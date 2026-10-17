
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";

type AssetStatus = "Active" | "Inactive" | "Under Maintenance";
type AssetCondition = "Good" | "Fair" | "Poor" | "Damaged";
type Criticality = "Low" | "Medium" | "High" | "Critical";

type Asset = {
  id: string;
  name: string;
  tag: string;
  description: string;
  status: AssetStatus;
  condition: AssetCondition;
  category: string;
  criticality: Criticality;
  dateAdded: string;
};

type ApiAsset = {
  id: string;
  name: string;
  tag: string;
  description: string;
  status: AssetStatus;
  condition: AssetCondition;
  category: string;
  criticality: Criticality;
  date_added: string;
  updated_at: string;
};

type AssetsResponse = {
  message: string;
  assets: ApiAsset[];
  total_assets: number;
  current_page: number;
  page_size: number;
  total_pages: number;
};

type AssetResponse = { message: string; asset: ApiAsset };

type FormMessage = { type: "success" | "error"; text: string };

const PAGE_SIZE = 5;

const toAsset = (a: ApiAsset): Asset => ({
  id: a.id,
  name: a.name,
  tag: a.tag,
  description: a.description,
  status: a.status,
  condition: a.condition,
  category: a.category,
  criticality: a.criticality,
  dateAdded: a.date_added,
});

const emptyFilters = {
  keyword: "",
  searchField: "all",
  startDate: "",
  endDate: "",
  sortField: "name",
  sortOrder: "asc",
};

const emptyForm = {
  name: "",
  tag: "",
  description: "",
  status: "Active" as AssetStatus,
  condition: "Good" as AssetCondition,
  category: "",
  criticality: "Medium" as Criticality,
};

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

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-zinc-500";

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200";

const buttonSecondary =
  "rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-600";

function StatusBadge({ status }: { status: AssetStatus }) {
  const styles: Record<AssetStatus, string> = {
    Active:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    Inactive:
      "bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-300",
    "Under Maintenance":
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function CriticalityBadge({
  criticality,
}: {
  criticality: Criticality;
}) {
  const styles: Record<Criticality, string> = {
    Low: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    High: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    Critical: "bg-red-600 text-white dark:bg-red-500 dark:text-white",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${styles[criticality]}`}
    >
      {criticality}
    </span>
  );
}

function formatDate(date: string, format: string) {
  if (!date) return "—";

  const [year, month, day] = date.split("-");

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return date;
    default:
      return `${month}/${day}/${year}`;
  }
}

export default function AssetRegistryPage() {
  const navigate = useNavigate();

  // Server data
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState("");

  // Form
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<FormMessage | null>(null);

  // Filter inputs (draft values)
  const [keyword, setKeyword] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortField, setSortField] = useState("name");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  // Filters actually sent to the server (set by "Apply Filters")
  const [applied, setApplied] = useState(emptyFilters);
  const [reloadKey, setReloadKey] = useState(0);

  // =========================
  // FETCH (page, applied filters, or reloadKey changes)
  // =========================
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setListError("");

      try {
        const response = await axios.get<AssetsResponse>(
          `${API_URLS.Admin}/assets`,
          {
            withCredentials: true,
            params: {
              keyword: applied.keyword.trim() || undefined,
              searchField: applied.searchField,
              startDate: applied.startDate || undefined,
              endDate: applied.endDate || undefined,
              sortField: applied.sortField,
              sortOrder: applied.sortOrder,
              page,
              pageSize: PAGE_SIZE,
            },
          }
        );

        if (cancelled) return;

        const data = response.data;
        setAssets(data.assets.map(toAsset));
        setTotalAssets(data.total_assets);
        setTotalPages(Math.max(1, data.total_pages));
      } catch (error: unknown) {
        if (cancelled) return;

        const info = getErrorInfo(error);
        if (info.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setListError(info.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, applied, reloadKey, navigate]);

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage(null);
  }

  // =========================
  // CREATE / UPDATE
  // =========================
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setMessage(null);

    const payload = {
      name: form.name.trim(),
      tag: form.tag.trim(),
      description: form.description.trim(),
      status: form.status,
      condition: form.condition,
      category: form.category,
      criticality: form.criticality,
    };

    try {
      const response =
        editingId !== null
          ? await axios.put<AssetResponse>(
              `${API_URLS.Admin}/assets/${editingId}`,
              payload,
              { withCredentials: true }
            )
          : await axios.post<AssetResponse>(
              `${API_URLS.Admin}/assets`,
              payload,
              { withCredentials: true }
            );

      setMessage({ type: "success", text: response.data.message });
      setForm(emptyForm);
      setEditingId(null);

      if (editingId === null) setPage(1);
      setReloadKey((key) => key + 1);
    } catch (error: unknown) {
      const info = getErrorInfo(error);

      if (info.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setMessage({ type: "error", text: info.message });

      // Asset was deleted by someone else: leave edit mode and refresh
      if (info.status === 404) {
        setForm(emptyForm);
        setEditingId(null);
        setReloadKey((key) => key + 1);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(asset: Asset) {
    setForm({
      name: asset.name,
      tag: asset.tag,
      description: asset.description,
      status: asset.status,
      condition: asset.condition,
      category: asset.category,
      criticality: asset.criticality,
    });

    setEditingId(asset.id);
    setMessage(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =========================
  // DELETE
  // =========================
  async function handleDelete(asset: Asset) {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${asset.name}"?`
    );
    if (!confirmed) return;

    setDeletingId(asset.id);
    setMessage(null);

    try {
      const response = await axios.delete<{ message: string }>(
        `${API_URLS.Admin}/assets/${asset.id}`,
        { withCredentials: true }
      );

      setMessage({ type: "success", text: response.data.message });

      if (editingId === asset.id) {
        setForm(emptyForm);
        setEditingId(null);
      }

      // Deleted the last row on this page: go back one page
      if (assets.length === 1 && page > 1) setPage(page - 1);
      else setReloadKey((key) => key + 1);
    } catch (error: unknown) {
      const info = getErrorInfo(error);

      if (info.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setMessage({ type: "error", text: info.message });

      if (info.status === 404) setReloadKey((key) => key + 1);
    } finally {
      setDeletingId(null);
    }
  }

  // =========================
  // FILTERS
  // =========================
  function handleApply() {
    if (startDate && endDate && startDate > endDate) {
      setMessage({
        type: "error",
        text: "The start date cannot be later than the end date.",
      });
      return;
    }

    setMessage(null);
    setApplied({
      keyword,
      searchField,
      startDate,
      endDate,
      sortField,
      sortOrder,
    });
    setPage(1);
  }

  function clearFilters() {
    setKeyword("");
    setSearchField("all");
    setStartDate("");
    setEndDate("");
    setSortOrder("asc");
    setSortField("name");
    setApplied(emptyFilters);
    setPage(1);
    setMessage(null);
  }

  return (
    <main className="min-h-full p-3 text-gray-900 transition-colors dark:text-gray-100 sm:p-5">
      <div className="mx-auto max-w-[1600px]">
        {/* Page Heading */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Asset Registry
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Register, search, and manage your organization's assets.
          </p>
        </div>

        {/* Registration Form */}
        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900 sm:p-5">
          <div className="mb-4 border-b border-gray-200 pb-3 dark:border-zinc-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {editingId !== null ? "Edit Asset" : "Register New Asset"}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the asset details below.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className={labelClass}>Asset Name *</label>
                <input
                  className={fieldClass}
                  placeholder="Enter asset name"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Asset Tag *</label>
                <input
                  className={fieldClass}
                  placeholder="e.g. AST-126"
                  value={form.tag}
                  onChange={(e) => updateForm("tag", e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={fieldClass}
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Under Maintenance">
                    Under Maintenance
                  </option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Condition</label>
                <select
                  className={fieldClass}
                  value={form.condition}
                  onChange={(e) => updateForm("condition", e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Category *</label>
                <select
                  className={fieldClass}
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Workshop Equipment">
                    Workshop Equipment
                  </option>
                  <option value="Office Equipment">
                    Office Equipment
                  </option>
                  <option value="IT Equipment">IT Equipment</option>
                  <option value="Machinery">Machinery</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Tools">Tools</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Criticality</label>
                <select
                  className={fieldClass}
                  value={form.criticality}
                  onChange={(e) =>
                    updateForm("criticality", e.target.value)
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <label className={labelClass}>Asset Description</label>
                <textarea
                  className={`${fieldClass} min-h-[42px] resize-y`}
                  placeholder="Enter asset description"
                  value={form.description}
                  onChange={(e) =>
                    updateForm("description", e.target.value)
                  }
                  maxLength={500}
                  rows={2}
                />
              </div>

              <div>
                <label className={labelClass}>Date Format</label>
                <select
                  className={fieldClass}
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            {message && (
              <p
                role="status"
                className={`mt-4 text-sm ${
                  message.type === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 dark:border-zinc-700">
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className={`${buttonSecondary} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="cursor-pointer rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-zinc-900"
              >
                {isSaving
                  ? "Saving..."
                  : editingId !== null
                  ? "Save Changes"
                  : "+ Register Asset"}
              </button>
            </div>
          </form>
        </section>

        {/* Search and Filters */}
        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Search and Filter Assets
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>Search Keywords</label>
              <input
                className={fieldClass}
                placeholder="Search assets..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Search Field</label>
              <select
                className={fieldClass}
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
              >
                <option value="all">All Fields</option>
                <option value="name">Asset Name</option>
                <option value="tag">Asset Tag</option>
                <option value="description">Description</option>
                <option value="status">Status</option>
                <option value="condition">Condition</option>
                <option value="category">Category</option>
                <option value="criticality">Criticality</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                className={fieldClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                className={fieldClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Sort Field</label>
              <select
                className={fieldClass}
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                <option value="name">Asset Name</option>
                <option value="tag">Asset Tag</option>
                <option value="description">Description</option>
                <option value="status">Status</option>
                <option value="condition">Condition</option>
                <option value="category">Category</option>
                <option value="criticality">Criticality</option>
                <option value="dateAdded">Date Added</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Sort Order</label>
              <select
                className={fieldClass}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="flex items-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={handleApply}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className={`${buttonSecondary} cursor-pointer`}
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* Asset Table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-4 dark:border-zinc-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Registered Assets
            </h2>

            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-950 dark:text-orange-300">
              {totalAssets} assets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Asset Name</th>
                  <th className="px-4 py-3 font-semibold">Asset Tag</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Condition</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Criticality</th>
                  <th className="px-4 py-3 font-semibold">Date Added</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Loading assets...
                    </td>
                  </tr>
                ) : listError ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm">
                      <p className="text-red-600 dark:text-red-400">
                        {listError}
                      </p>
                      <button
                        type="button"
                        onClick={() => setReloadKey((key) => key + 1)}
                        className="mt-3 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No assets found. Try changing your search filters or
                      register a new asset.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-t border-gray-200 text-gray-700 transition hover:bg-orange-50 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-orange-950/30"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </td>

                      <td className="px-4 py-3">{asset.tag}</td>

                      <td
                        className="max-w-48 truncate px-4 py-3"
                        title={asset.description}
                      >
                        {asset.description || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={asset.status} />
                      </td>

                      <td className="px-4 py-3">{asset.condition}</td>

                      <td className="px-4 py-3">{asset.category}</td>

                      <td className="px-4 py-3">
                        <CriticalityBadge criticality={asset.criticality} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDate(asset.dateAdded, dateFormat)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(asset)}
                            disabled={deletingId === asset.id}
                            className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(asset)}
                            disabled={deletingId === asset.id}
                            className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === asset.id ? "Deleting..." : "Delete"}
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 dark:border-zinc-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {totalAssets === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              {"–"}
              {Math.min(page * PAGE_SIZE, totalAssets)} of {totalAssets} assets
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-800"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-800"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
