import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  ChevronDown,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Toast from "../../components/Toast";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";

// =========================
// TYPES
// =========================
type Assignment = {
  id: string;
  personnelId: string;
  personnelName: string;
  personnelUsername: string;
  supervisorId: string;
  supervisorName: string;
  supervisorUsername: string;
  assignedBy: string;
  dateAssigned: string; // yyyy-MM-dd
};

type ApiAssignment = {
  id: string;
  personnel_id: string;
  personnel_name: string;
  personnel_username: string;
  supervisor_id: string;
  supervisor_name: string;
  supervisor_username: string;
  assigned_by: string | null;
  date_assigned: string;
};

type SupervisorOption = {
  id: string;
  full_name: string;
  username: string;
  is_revoked: boolean;
};

type PersonnelOption = {
  id: string;
  full_name: string;
  username: string;
  is_assigned: boolean;
  assigned_to: string | null;
};

type AssignerOption = { id: string; full_name: string };

type ToastState = { type: "success" | "error"; message: string } | null;

const PAGE_SIZE = 5;
const BASE_URL = `${API_URLS.Employee}/personnel-assignments`;
const SUPERVISORS_URL = `${API_URLS.Employee}/supervisors`;

const emptyFilters = {
  keyword: "",
  supervisorId: "",
  assignedById: "",
  startDate: "",
  endDate: "",
};

const toAssignment = (a: ApiAssignment): Assignment => ({
  id: a.id,
  personnelId: a.personnel_id,
  personnelName: a.personnel_name,
  personnelUsername: a.personnel_username,
  supervisorId: a.supervisor_id,
  supervisorName: a.supervisor_name,
  supervisorUsername: a.supervisor_username,
  assignedBy: a.assigned_by ?? "—",
  dateAssigned: a.date_assigned,
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

const inputClass =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:focus:border-orange-500 dark:focus:ring-orange-950";

const labelClass =
  "mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300";

// "2026-10-16" -> "10/16/2026"
function formatDate(date: string) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

export default function AssignPersonnel() {
  const navigate = useNavigate();

  // Table data
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Dropdown options
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]); // active only (form)
  const [filterSupervisors, setFilterSupervisors] = useState<SupervisorOption[]>([]); // incl. revoked (filter)
  const [personnel, setPersonnel] = useState<PersonnelOption[]>([]);
  const [assigners, setAssigners] = useState<AssignerOption[]>([]);

  // Form
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Filters: draft = what the inputs show, applied = what the table uses
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [toast, setToast] = useState<ToastState>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // =========================
  // FETCH DROPDOWN OPTIONS
  // =========================
  useEffect(() => {
    let cancelled = false;
    const cfg = { withCredentials: true };

    (async () => {
      try {
        const [sup, supAll, per, asg] = await Promise.all([
          axios.get(SUPERVISORS_URL, cfg),
          axios.get(SUPERVISORS_URL, { ...cfg, params: { includeRevoked: true } }),
          axios.get(`${BASE_URL}/personnel-options`, { ...cfg, params: { limit: 100 } }),
          axios.get(`${BASE_URL}/assigner-options`, cfg),
        ]);
        if (cancelled) return;
        setSupervisors(sup.data.supervisors ?? []);
        setFilterSupervisors(supAll.data.supervisors ?? []);
        setPersonnel(per.data.personnel ?? []);
        setAssigners(asg.data.assigners ?? []);
      } catch (error) {
        if (cancelled) return;
        const info = getErrorInfo(error);
        if (info.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setMessage(info.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, navigate]);

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
            keyword: applied.keyword.trim() || undefined,
            supervisorId: applied.supervisorId || undefined,
            assignedById: applied.assignedById || undefined,
            startDate: applied.startDate || undefined,
            endDate: applied.endDate || undefined,
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

        setAssignments((res.data.assignments ?? []).map(toAssignment));
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
  }, [page, applied, reloadKey, navigate]);

  const refresh = () => setReloadKey((k) => k + 1);

  // =========================
  // FORM
  // =========================
  function resetForm() {
    setSelectedPersonnel("");
    setSelectedSupervisor("");
    setEditing(null);
    setMessage("");
  }

  async function handleAssign() {
    if (submitting) return;
    if (!selectedPersonnel || !selectedSupervisor) {
      setMessage("Please select both personnel and supervisor.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      if (editing) {
        await axios.put(
          `${BASE_URL}/${editing.id}`,
          { supervisor_id: selectedSupervisor },
          { withCredentials: true }
        );
        setToast({ type: "success", message: "Assignment updated successfully." });
      } else {
        await axios.post(
          BASE_URL,
          { personnel_ids: [selectedPersonnel], supervisor_id: selectedSupervisor },
          { withCredentials: true }
        );
        setToast({ type: "success", message: "Personnel assigned successfully." });
        setPage(1);
      }
      resetForm();
      refresh();
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setMessage(info.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item: Assignment) {
    setEditing(item);
    setSelectedPersonnel(item.personnelId);
    // A revoked supervisor can't be picked again, so make them choose a new one
    setSelectedSupervisor(
      supervisors.some((s) => s.id === item.supervisorId) ? item.supervisorId : ""
    );
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =========================
  // DELETE
  // =========================
  function openDelete(item: Assignment) {
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
      if (editing?.id === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      setToast({ type: "success", message: "Assignment deleted successfully." });
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

  useEffect(() => {
    if (!deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) {
        setDeleteTarget(null);
        setDeleteError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteTarget, deleting]);

  // =========================
  // FILTERS
  // =========================
  function handleSearch() {
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setToast({ type: "error", message: "Start date must be before end date." });
      return;
    }
    setPage(1);
    setApplied(draft);
  }

  function resetFilters() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  }

  const setDraftField = (field: keyof typeof emptyFilters, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  // =========================
  // PERSONNEL SELECT OPTIONS
  // =========================
  // When editing, make sure the assigned person is listed even if outside the first 100 results
  const personnelChoices: PersonnelOption[] =
    editing && !personnel.some((p) => p.id === editing.personnelId)
      ? [
          {
            id: editing.personnelId,
            full_name: editing.personnelName,
            username: editing.personnelUsername,
            is_assigned: true,
            assigned_to: editing.supervisorName,
          },
          ...personnel,
        ]
      : personnel;

  const rangeStart = totalAssignments === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalAssignments);

  return (
    <div className="min-h-full w-full px-0 py-0 text-gray-800 dark:text-gray-100">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <Users size={23} className="text-orange-600 dark:text-orange-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Assign Personnel
          </h1>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Assign personnel to a supervisor and manage existing assignments.
        </p>
      </div>

      {/* New Assignment Form */}
      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <h2 className="mb-5 text-base font-bold text-gray-900 dark:text-gray-100">
          {editing ? "Edit Assignment" : "New Assignment"}
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Personnel <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-8`}
                value={selectedPersonnel}
                disabled={!!editing}
                onChange={(e) => setSelectedPersonnel(e.target.value)}
              >
                <option value="">Select personnel to assign</option>
                {personnelChoices.map((person) => (
                  <option
                    key={person.id}
                    value={person.id}
                    disabled={person.is_assigned && person.id !== editing?.personnelId}
                  >
                    {person.full_name} ({person.username})
                    {person.is_assigned && person.id !== editing?.personnelId
                      ? ` — assigned to ${person.assigned_to ?? "a supervisor"}`
                      : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              You can select one personnel at a time. Personnel who already have a supervisor should be edited instead.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Supervisor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-8`}
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
              >
                <option value="">Select supervisor</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.full_name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            className="rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
          >
            {editing ? "Cancel" : "Reset"}
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : editing ? "Update" : "Assign"}
          </button>
        </div>

        {message && (
          <div role="status" className="mt-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
            {message}
          </div>
        )}
      </section>

      {/* Search and Filters */}
      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>Search</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Name or username..."
                className={`${inputClass} pl-9`}
                value={draft.keyword}
                onChange={(e) => setDraftField("keyword", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Supervisor</label>
            <select
              className={inputClass}
              value={draft.supervisorId}
              onChange={(e) => setDraftField("supervisorId", e.target.value)}
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
              className={inputClass}
              value={draft.assignedById}
              onChange={(e) => setDraftField("assignedById", e.target.value)}
            >
              <option value="">All</option>
              {assigners.map((assigner) => (
                <option key={assigner.id} value={assigner.id}>
                  {assigner.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 items-end gap-5 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className={labelClass}>Start Date</label>
            <div className="relative">
              <input
                aria-label="Start date"
                type="date"
                className={`${inputClass} pr-9`}
                value={draft.startDate}
                onChange={(e) => setDraftField("startDate", e.target.value)}
              />
              <Calendar size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className={labelClass}>End Date</label>
            <div className="relative">
              <input
                aria-label="End date"
                type="date"
                className={`${inputClass} pr-9`}
                value={draft.endDate}
                onChange={(e) => setDraftField("endDate", e.target.value)}
              />
              <Calendar size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      {/* Assignments Table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left">
            <thead className="bg-gray-50 dark:bg-zinc-800/80">
              <tr className="border-b border-gray-200 dark:border-zinc-700">
                {[
                  "Personnel Name",
                  "Personnel Username",
                  "Supervisor Name",
                  "Supervisor Username",
                  "Assigned By",
                  "Date Assigned",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-5 py-5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <LoadingState />
                  </td>
                </tr>
              ) : listError ? (
                <tr>
                  <td colSpan={7}>
                    <ErrorState message={listError} onRetry={refresh} />
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message="No assignments found." />
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 even:bg-[#fafafa] hover:bg-orange-50/60 dark:border-zinc-800 dark:even:bg-zinc-900 dark:hover:bg-zinc-800/70">
                    <td className="whitespace-nowrap px-5 py-5 text-sm text-gray-800 dark:text-gray-100">{item.personnelName}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm text-gray-500 dark:text-gray-400">{item.personnelUsername}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm text-gray-800 dark:text-gray-100">{item.supervisorName}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm text-gray-500 dark:text-gray-400">{item.supervisorUsername}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm text-gray-800 dark:text-gray-100">{item.assignedBy}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm text-gray-800 dark:text-gray-100">{formatDate(item.dateAssigned)}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="Edit assignment"
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(item)}
                          title="Delete assignment"
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
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

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {rangeStart} to {rangeEnd} of {totalAssignments} assignments
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((previous) => previous - 1)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1)
              .map((number, index, visiblePages) => (
                <span key={number} className="contents">
                  {index > 0 && number - visiblePages[index - 1] > 1 && (
                    <span className="px-1 text-xs text-gray-400">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(number)}
                    aria-current={page === number ? "page" : undefined}
                    className={`h-10 min-w-10 rounded-lg border px-3 text-sm ${
                      page === number
                        ? "border-orange-600 bg-orange-600 font-bold text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {number}
                  </button>
                </span>
              ))}

            <span className="px-2 text-xs text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((previous) => previous + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => e.target === e.currentTarget && closeDelete()}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Delete assignment
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Remove <span className="font-semibold">{deleteTarget.personnelName}</span> from{" "}
              <span className="font-semibold">{deleteTarget.supervisorName}</span>? This can't be undone.
            </p>

            {deleteError && (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleting}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}