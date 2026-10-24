import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  ClipboardList,
  Check,
  X,
} from "lucide-react";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";

// =========================
// TYPES
// =========================
type AssetAssignmentRecord = {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  category: string;
  supervisorId: string;
  supervisorName: string;
  supervisorUsername: string;
  assignedBy: string;
  dateAssigned: string; // yyyy-MM-dd
};

type ApiAssignment = {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  category: string;
  supervisor_id: string;
  supervisor_name: string;
  supervisor_username: string;
  assigned_by: string | null;
  date_assigned: string;
};

type AssetOption = {
  id: string;
  name: string;
  tag: string;
  category: string;
  isAssigned: boolean;
  assignedTo: string | null;
};

type ApiAssetOption = {
  id: string;
  name: string;
  tag: string;
  category: string;
  is_assigned: boolean;
  assigned_to: string | null;
};

type SupervisorOption = {
  id: string;
  full_name: string;
  username: string;
  is_revoked: boolean;
};

type AssignerOption = { id: string; full_name: string };

const PAGE_SIZE = 5;
const BASE_URL = `${API_URLS.Employee}/asset-assignments`;
const SUPERVISORS_URL = `${API_URLS.Employee}/supervisors`;

const emptyFilters = {
  search: "",
  supervisor: "",
  assignedBy: "",
  from: "",
  to: "",
};

const toRecord = (a: ApiAssignment): AssetAssignmentRecord => ({
  id: a.id,
  assetId: a.asset_id,
  assetName: a.asset_name,
  assetTag: a.asset_tag,
  category: a.category,
  supervisorId: a.supervisor_id,
  supervisorName: a.supervisor_name,
  supervisorUsername: a.supervisor_username,
  assignedBy: a.assigned_by ?? "—",
  dateAssigned: a.date_assigned,
});

const toAssetOption = (a: ApiAssetOption): AssetOption => ({
  id: a.id,
  name: a.name,
  tag: a.tag,
  category: a.category,
  isAssigned: a.is_assigned,
  assignedTo: a.assigned_to,
});

// One shared error mapper (401 is handled by the caller)
const getErrorInfo = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return { message: "Something went wrong.", status: undefined };
  }
  if (!error.response) {
    return { message: "Can't reach the server.", status: undefined };
  }

  const status = error.response.status;
  const data = error.response.data;

  if (status === 401) return { message: "Your session has expired.", status };
  if (status === 403) {
    return {
      message: "You don't have permission to perform this action.",
      status,
    };
  }
  if (status >= 500) {
    return { message: "Server error. Please try again.", status };
  }

  return {
    message:
      data?.message ?? data?.detail ?? data?.title ?? "Something went wrong.",
    status,
  };
};

function formatDate(date: string) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:focus:border-orange-500 dark:focus:ring-orange-950";

const labelClass =
  "mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300";

export default function AssetsAssignment() {
  const navigate = useNavigate();

  // Table data
  const [assignments, setAssignments] = useState<AssetAssignmentRecord[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Dropdown options
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]); // active only
  const [filterSupervisors, setFilterSupervisors] = useState<SupervisorOption[]>([]); // incl. revoked
  const [assigners, setAssigners] = useState<AssignerOption[]>([]);
  const [assetOptions, setAssetOptions] = useState<AssetOption[]>([]);
  const [totalAssetOptions, setTotalAssetOptions] = useState(0);

  // New assignment form
  const [selectedAssets, setSelectedAssets] = useState<AssetOption[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [assetKeyword, setAssetKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const assetBoxRef = useRef<HTMLDivElement>(null);

  // Filters: drafts = what the inputs show, filters = what the table uses
  const [search, setSearch] = useState("");
  const [filterSupervisor, setFilterSupervisor] = useState("");
  const [filterAssignedBy, setFilterAssignedBy] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  // Edit modal
  const [editing, setEditing] = useState<AssetAssignmentRecord | null>(null);
  const [editSupervisor, setEditSupervisor] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<AssetAssignmentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = () => setReloadKey((k) => k + 1);

  const showNotice = (text: string, isError = false) => {
    setNotice(text);
    setNoticeIsError(isError);
  };

  // =========================
  // FETCH SUPERVISORS + ASSIGNERS
  // =========================
  useEffect(() => {
    let cancelled = false;
    const cfg = { withCredentials: true };

    (async () => {
      try {
        const [sup, supAll, asg] = await Promise.all([
          axios.get(SUPERVISORS_URL, cfg),
          axios.get(SUPERVISORS_URL, { ...cfg, params: { includeRevoked: true } }),
          axios.get(`${BASE_URL}/assigner-options`, cfg),
        ]);
        if (cancelled) return;
        setSupervisors(sup.data.supervisors ?? []);
        setFilterSupervisors(supAll.data.supervisors ?? []);
        setAssigners(asg.data.assigners ?? []);
      } catch (error) {
        if (cancelled) return;
        const info = getErrorInfo(error);
        if (info.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        showNotice(info.message, true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, navigate]);

  // =========================
  // FETCH ASSET OPTIONS (debounced while typing in the dropdown search)
  // =========================
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          const res = await axios.get(`${BASE_URL}/asset-options`, {
            withCredentials: true,
            params: { keyword: assetKeyword.trim() || undefined, limit: 100 },
          });
          if (cancelled) return;
          setAssetOptions((res.data.assets ?? []).map(toAssetOption));
          setTotalAssetOptions(res.data.total_assets ?? 0);
        } catch (error) {
          if (cancelled) return;
          const info = getErrorInfo(error);
          if (info.status === 401) {
            navigate("/login", { replace: true });
            return;
          }
          showNotice(info.message, true);
        }
      },
      assetKeyword ? 300 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [assetKeyword, reloadKey, navigate]);

  // Close the asset dropdown when clicking outside of it
  useEffect(() => {
    if (!assetDropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!assetBoxRef.current?.contains(e.target as Node)) {
        setAssetDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [assetDropdownOpen]);

  // =========================
  // FETCH ASSIGNMENTS
  // =========================
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setListError("");
      try {
        const res = await axios.get(BASE_URL, {
          withCredentials: true,
          params: {
            keyword: filters.search.trim() || undefined,
            supervisorId: filters.supervisor || undefined,
            assignedById: filters.assignedBy || undefined,
            startDate: filters.from || undefined,
            endDate: filters.to || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
        });
        if (cancelled) return;

        const pages = Math.max(1, res.data.total_pages ?? 1);
        // e.g. the last row of the last page was deleted
        if (page > pages) {
          setPage(pages);
          return;
        }

        setAssignments((res.data.assignments ?? []).map(toRecord));
        setTotalAssignments(res.data.total_assignments ?? 0);
        setTotalPages(pages);
      } catch (error) {
        if (cancelled) return;
        const info = getErrorInfo(error);
        if (info.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setListError(info.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, filters, reloadKey, navigate]);

  // =========================
  // NEW ASSIGNMENT
  // =========================
  function toggleAsset(asset: AssetOption) {
    setSelectedAssets((current) =>
      current.some((item) => item.id === asset.id)
        ? current.filter((item) => item.id !== asset.id)
        : [...current, asset]
    );
  }

  function resetAssignmentForm() {
    setSelectedAssets([]);
    setSelectedSupervisor("");
    setAssetDropdownOpen(false);
    setAssetKeyword("");
  }

  async function handleAssign() {
    if (submitting) return;
    if (!selectedAssets.length || !selectedSupervisor) {
      showNotice("Please select at least one asset and a supervisor.", true);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        BASE_URL,
        {
          asset_ids: selectedAssets.map((asset) => asset.id),
          supervisor_id: selectedSupervisor,
        },
        { withCredentials: true }
      );
      showNotice(`${selectedAssets.length} asset assignment(s) created.`);
      resetAssignmentForm();
      clearFilters();
      refresh();
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      showNotice(info.message, true);
    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // FILTERS
  // =========================
  function handleSearch() {
    setFilters({
      search,
      supervisor: filterSupervisor,
      assignedBy: filterAssignedBy,
      from: dateFrom,
      to: dateTo,
    });
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setFilterSupervisor("");
    setFilterAssignedBy("");
    setDateFrom("");
    setDateTo("");
    setFilters(emptyFilters);
    setPage(1);
  }

  // =========================
  // EDIT (modal)
  // =========================
  function openEdit(item: AssetAssignmentRecord) {
    setEditing(item);
    // A revoked supervisor can't be picked again, so make them choose a new one
    setEditSupervisor(
      supervisors.some((s) => s.id === item.supervisorId) ? item.supervisorId : ""
    );
    setEditError("");
  }

  function closeEdit() {
    if (editSaving) return;
    setEditing(null);
    setEditError("");
  }

  async function handleEditSave() {
    if (!editing || editSaving) return;
    if (!editSupervisor) {
      setEditError("Please select a supervisor.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      await axios.put(
        `${BASE_URL}/${editing.id}`,
        { supervisor_id: editSupervisor },
        { withCredentials: true }
      );
      setEditing(null);
      showNotice("Assignment updated successfully.");
      refresh();
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setEditError(info.message);
    } finally {
      setEditSaving(false);
    }
  }

  // =========================
  // DELETE (modal)
  // =========================
  function openDelete(item: AssetAssignmentRecord) {
    setDeleteTarget(item);
    setDeleteError("");
  }

  function closeDelete() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await axios.delete(`${BASE_URL}/${deleteTarget.id}`, {
        withCredentials: true,
      });
      setDeleteTarget(null);
      showNotice("Assignment deleted successfully.");
      refresh();
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setDeleteError(info.message);
    } finally {
      setDeleting(false);
    }
  }

  // Escape closes whichever modal is open
  useEffect(() => {
    if (!editing && !deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editing && !editSaving) {
        setEditing(null);
        setEditError("");
      }
      if (deleteTarget && !deleting) {
        setDeleteTarget(null);
        setDeleteError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, editSaving, deleteTarget, deleting]);

  const rangeStart = totalAssignments === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalAssignments);

  return (
    <div className="min-h-full w-full px-0 py-0 text-gray-800 dark:text-gray-100">
      <div className="w-full space-y-5">

        {/* PAGE HEADER */}
        <header className="mb-5">
          <div className="flex items-center gap-3">
            <ClipboardList
              size={22}
              className="text-orange-600 dark:text-orange-400"
            />
            <h1 className="text-2xl font-bold tracking-tight">
              Employee Assets Assignment
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Assign assets to supervisors and manage existing assignments.
          </p>
        </header>

        {/* NOTIFICATION */}
        {notice && (
          <div
            role="status"
            className={`flex items-center justify-between gap-3 rounded-lg border px-5 py-4 text-sm ${
              noticeIsError
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                : "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200"
            }`}
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="cursor-pointer rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* NEW ASSIGNMENT */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="mb-5 text-base font-bold">New Assignment</h2>

          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1.5fr_1fr]">

            {/* ASSET MULTISELECT */}
            <div className="relative" ref={assetBoxRef}>
              <label className={labelClass}>
                Asset <span className="text-red-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setAssetDropdownOpen((open) => !open)}
                aria-expanded={assetDropdownOpen}
                className={`${inputClass} flex min-h-[48px] items-center justify-between gap-2 text-left`}
              >
                <span className="flex min-w-0 flex-1 flex-wrap gap-2">
                  {selectedAssets.length ? (
                    selectedAssets.map((asset) => (
                      <span
                        key={asset.id}
                        className="inline-flex max-w-full items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                      >
                        <span className="truncate">{asset.name}</span>

                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Remove ${asset.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleAsset(asset);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              toggleAsset(asset);
                            }
                          }}
                        >
                          <X size={14} />
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">
                      Select one or more assets
                    </span>
                  )}
                </span>

                <ChevronDown size={18} className="shrink-0" />
              </button>

              {assetDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="relative mb-2">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      autoFocus
                      value={assetKeyword}
                      onChange={(event) => setAssetKeyword(event.target.value)}
                      placeholder="Search asset name or tag"
                      className={`${inputClass} py-2 pl-9`}
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {assetOptions.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-gray-400">
                        No assets found.
                      </p>
                    )}

                    {assetOptions.map((asset) => {
                      const selected = selectedAssets.some(
                        (item) => item.id === asset.id
                      );

                      return (
                        <button
                          type="button"
                          key={asset.id}
                          disabled={asset.isAssigned && !selected}
                          onClick={() => toggleAsset(asset)}
                          className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-800"
                        >
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                              selected
                                ? "border-orange-600 bg-orange-600 text-white"
                                : "border-gray-300 dark:border-zinc-600"
                            }`}
                          >
                            {selected && <Check size={14} />}
                          </span>

                          <span className="flex-1">
                            <span className="block font-medium">{asset.name}</span>
                            <span className="text-xs text-gray-400">
                              {asset.tag}
                              {asset.isAssigned
                                ? ` · Already assigned${asset.assignedTo ? ` to ${asset.assignedTo}` : ""}`
                                : ""}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {totalAssetOptions > assetOptions.length && (
                    <p className="px-2 pt-2 text-xs text-gray-400">
                      Showing {assetOptions.length} of {totalAssetOptions}. Type to narrow the list.
                    </p>
                  )}
                </div>
              )}

              <p className="mt-2 text-xs text-gray-400">
                Select multiple available assets for the same supervisor.
              </p>
            </div>

            {/* SUPERVISOR SELECT */}
            <div>
              <label className={labelClass}>
                Supervisor <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  value={selectedSupervisor}
                  onChange={(event) => setSelectedSupervisor(event.target.value)}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="">Select supervisor</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.full_name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-gray-400">
              {selectedAssets.length} asset(s) selected
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetAssignmentForm}
                disabled={submitting}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={15} />
                Reset
              </button>

              <button
                type="button"
                onClick={handleAssign}
                disabled={submitting}
                className="cursor-pointer rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Assigning..." : "+ Assign Assets"}
              </button>
            </div>
          </div>
        </section>

        {/* SEARCH AND FILTERS */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold">
              Search and Filter Assignments
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Find assignments using asset, supervisor, assigned by, or date.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Search Keywords</label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="Asset name or asset tag"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Supervisor</label>
              <select
                value={filterSupervisor}
                onChange={(event) => setFilterSupervisor(event.target.value)}
                className={inputClass}
              >
                <option value="">All supervisors</option>
                {filterSupervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.full_name}
                    {supervisor.is_revoked ? " (revoked)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Assigned By</label>
              <select
                value={filterAssignedBy}
                onChange={(event) => setFilterAssignedBy(event.target.value)}
                className={inputClass}
              >
                <option value="">All employees</option>
                {assigners.map((assigner) => (
                  <option key={assigner.id} value={assigner.id}>
                    {assigner.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 items-end gap-5 lg:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSearch}
                className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* ASSIGNMENTS TABLE */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 sm:px-6">
            <div>
              <h2 className="text-base font-bold">Asset Assignments</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                View and manage asset-to-supervisor assignments.
              </p>
            </div>

            <span className="w-fit rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              {totalAssignments} assignments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 dark:bg-zinc-800/80 dark:text-gray-300">
                <tr>
                  <th className="px-5 py-5">Asset Name</th>
                  <th className="px-4 py-5">Asset Tag</th>
                  <th className="px-4 py-5">Category</th>
                  <th className="px-4 py-5">Supervisor Name</th>
                  <th className="px-4 py-5">Supervisor Username</th>
                  <th className="px-4 py-5">Assigned By</th>
                  <th className="px-4 py-5">Date Assigned</th>
                  <th className="px-5 py-5 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <LoadingState />
                    </td>
                  </tr>
                ) : listError ? (
                  <tr>
                    <td colSpan={8}>
                      <ErrorState message={listError} onRetry={refresh} />
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <ClipboardList
                        size={36}
                        className="mx-auto mb-3 text-gray-300 dark:text-zinc-600"
                      />
                      <p className="text-base font-semibold text-gray-600 dark:text-gray-300">
                        No assignments found
                      </p>
                      <p className="mt-2 text-sm text-gray-400">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  assignments.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-orange-50/50 dark:hover:bg-zinc-800/60"
                    >
                      <td className="max-w-[220px] px-5 py-5 font-medium">
                        {item.assetName}
                      </td>
                      <td className="px-4 py-5 text-gray-500 dark:text-gray-400">
                        {item.assetTag}
                      </td>
                      <td className="px-4 py-5">{item.category}</td>
                      <td className="px-4 py-5">{item.supervisorName}</td>
                      <td className="px-4 py-5 text-gray-500 dark:text-gray-400">
                        {item.supervisorUsername}
                      </td>
                      <td className="px-4 py-5">{item.assignedBy}</td>
                      <td className="whitespace-nowrap px-4 py-5">
                        {formatDate(item.dateAssigned)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            title={`Edit ${item.assetName}`}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => openDelete(item)}
                            title={`Delete ${item.assetName}`}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {rangeStart} to {rangeEnd} of {totalAssignments} assignments
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  (number) =>
                    number === 1 ||
                    number === totalPages ||
                    Math.abs(number - page) <= 1
                )
                .map((number, index, numbers) => (
                  <span key={number} className="contents">
                    {index > 0 && numbers[index - 1] !== number - 1 && (
                      <span className="px-1 text-sm text-gray-400">…</span>
                    )}

                    <button
                      type="button"
                      onClick={() => setPage(number)}
                      aria-current={page === number ? "page" : undefined}
                      className={`size-10 rounded-lg border text-sm transition ${
                        page === number
                          ? "border-orange-600 bg-orange-600 font-bold text-white"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {number}
                    </button>
                  </span>
                ))}

              <span className="mx-1 text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* EDIT ASSIGNMENT MODAL */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEdit();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-assignment-title"
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 id="edit-assignment-title" className="text-xl font-bold">
                  Edit Assignment
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Update the supervisor responsible for this asset.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                aria-label="Close edit dialog"
                className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
              <p className="text-base font-semibold">{editing.assetName}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Asset Tag: {editing.assetTag}
              </p>
            </div>

            <label className={labelClass}>
              Supervisor <span className="text-red-500">*</span>
            </label>

            <select
              value={editSupervisor}
              onChange={(event) => setEditSupervisor(event.target.value)}
              className={inputClass}
            >
              <option value="">Select supervisor</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.full_name}
                </option>
              ))}
            </select>

            {editError && (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {editError}
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={editSaving}
                className="cursor-pointer rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaving || editSupervisor === editing.supervisorId}
                className="cursor-pointer rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDelete();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2 className="text-xl font-bold">Delete assignment</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Remove <span className="font-semibold">{deleteTarget.assetName}</span>{" "}
              ({deleteTarget.assetTag}) from{" "}
              <span className="font-semibold">{deleteTarget.supervisorName}</span>? This can't be undone.
            </p>

            {deleteError && (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {deleteError}
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleting}
                className="cursor-pointer rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="cursor-pointer rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
