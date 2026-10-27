import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, ChevronDown } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";

// =========================
// TYPES
// =========================
type AssignedAsset = {
  id: string;
  assetName: string;
  assetTag: string;
  category: string;
  assignedBy: string;
  dateAssigned: string; // yyyy-MM-dd
};

type ApiAssignedAsset = {
  id: string;
  asset_name: string;
  asset_tag: string;
  category: string;
  assigned_by: string | null;
  date_assigned: string;
};

type AssignerOption = { id: string; full_name: string };

const PAGE_SIZE = 10;
const BASE_URL = `${API_URLS.Supervisor}/assigned-assets`;

const emptyFilters = {
  keyword: "",
  category: "",
  assignedById: "",
  startDate: "",
  endDate: "",
};

const toAsset = (a: ApiAssignedAsset): AssignedAsset => ({
  id: a.id,
  assetName: a.asset_name,
  assetTag: a.asset_tag,
  category: a.category,
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

// "2026-10-16" -> "10/16/2026"
function formatDate(date: string) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:focus:border-orange-500 dark:focus:ring-orange-950";

const labelClass =
  "mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400";

export default function AssignedAssets() {
  const navigate = useNavigate();

  // Table data
  const [assets, setAssets] = useState<AssignedAsset[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Dropdown options
  const [categories, setCategories] = useState<string[]>([]);
  const [assigners, setAssigners] = useState<AssignerOption[]>([]);

  // Filters: draft = what the inputs show, applied = what the table uses
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [filterError, setFilterError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  // =========================
  // FETCH FILTER OPTIONS
  // =========================
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/filter-options`, {
          withCredentials: true,
        });
        if (cancelled) return;
        setCategories(res.data.categories ?? []);
        setAssigners(res.data.assigners ?? []);
      } catch (error) {
        if (cancelled) return;
        if (getErrorInfo(error).status === 401) {
          navigate("/login", { replace: true });
        }
        // Dropdowns stay empty on other errors; the table shows its own error
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, navigate]);

  // =========================
  // FETCH ASSIGNED ASSETS
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
            category: applied.category || undefined,
            assignedById: applied.assignedById || undefined,
            startDate: applied.startDate || undefined,
            endDate: applied.endDate || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
        });
        if (cancelled) return;

        const pages = Math.max(1, res.data.total_pages ?? 1);
        if (page > pages) {
          setPage(pages);
          return;
        }

        setAssets((res.data.assets ?? []).map(toAsset));
        setTotalAssets(res.data.total_assets ?? 0);
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
  // FILTERS
  // =========================
  const setDraftField = (field: keyof typeof emptyFilters, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  function handleSearch() {
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setFilterError("The start date cannot be later than the end date.");
      return;
    }
    setFilterError("");
    setPage(1);
    setApplied(draft);
  }

  function handleReset() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setFilterError("");
    setPage(1);
  }

  const rangeStart = totalAssets === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalAssets);

  return (
    <div className="min-h-full w-full text-gray-800 dark:text-gray-100">
      {/* Heading */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Assigned Assets
        </h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          View assets assigned to you for supervision.
        </p>
      </div>

      {/* Search and Filters */}
      <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <h2 className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-100">
          Search and Filters
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[2fr_1.4fr_1.2fr]">
          <div>
            <label className={labelClass}>Search</label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Asset name or tag..."
                className={`${inputClass} pl-11`}
                value={draft.keyword}
                onChange={(e) => setDraftField("keyword", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Asset Category</label>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-10`}
                value={draft.category}
                onChange={(e) => setDraftField("category", e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Assigned By</label>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-10`}
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
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 items-end gap-5 lg:grid-cols-[1fr_auto_1fr_auto]">
          <div>
            <label className={labelClass}>Date Assigned - From</label>
            <div className="relative">
              <input
                aria-label="Date assigned from"
                type="date"
                className={`${inputClass} pr-10`}
                value={draft.startDate}
                max={draft.endDate || undefined}
                onChange={(e) => setDraftField("startDate", e.target.value)}
              />
              <Calendar
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>

          <span className="hidden pb-3 text-gray-400 lg:block">-</span>

          <div>
            <label className={labelClass}>Date Assigned - To</label>
            <div className="relative">
              <input
                aria-label="Date assigned to"
                type="date"
                className={`${inputClass} pr-10`}
                value={draft.endDate}
                min={draft.startDate || undefined}
                onChange={(e) => setDraftField("endDate", e.target.value)}
              />
              <Calendar
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>

          <div className="flex gap-3 lg:justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="cursor-pointer rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Search
            </button>
          </div>
        </div>

        {filterError && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {filterError}
          </p>
        )}
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-600 dark:border-zinc-700 dark:text-gray-300">
                <th className="px-6 py-5">Asset Name</th>
                <th className="px-4 py-5">Asset Tag</th>
                <th className="px-4 py-5">Category</th>
                <th className="px-4 py-5">Assigned By</th>
                <th className="px-4 py-5">Date Assigned</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <LoadingState />
                  </td>
                </tr>
              ) : listError ? (
                <tr>
                  <td colSpan={5}>
                    <ErrorState message={listError} onRetry={refresh} />
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No assigned assets found." />
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-gray-100 even:bg-[#fafafa] hover:bg-orange-50/60 dark:border-zinc-800 dark:even:bg-zinc-900 dark:hover:bg-zinc-800/70"
                  >
                    <td className="px-6 py-5 font-medium text-gray-900 dark:text-gray-100">
                      {asset.assetName}
                    </td>
                    <td className="px-4 py-5 text-gray-500 dark:text-gray-400">
                      {asset.assetTag}
                    </td>
                    <td className="px-4 py-5 text-gray-700 dark:text-gray-200">
                      {asset.category}
                    </td>
                    <td className="px-4 py-5 text-gray-700 dark:text-gray-200">
                      {asset.assignedBy}
                    </td>
                    <td className="whitespace-nowrap px-4 py-5 text-gray-700 dark:text-gray-200">
                      {formatDate(asset.dateAssigned)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {rangeStart} to {rangeEnd} of {totalAssets} assignments
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(
                (number) =>
                  number === 1 ||
                  number === totalPages ||
                  Math.abs(number - page) <= 1
              )
              .map((number, index, visible) => (
                <span key={number} className="contents">
                  {index > 0 && number - visible[index - 1] > 1 && (
                    <span className="px-1 text-xs text-gray-400">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(number)}
                    aria-current={page === number ? "page" : undefined}
                    className={`h-10 min-w-10 cursor-pointer rounded-lg border px-3 text-sm ${
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
