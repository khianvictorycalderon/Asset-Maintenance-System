
import { useMemo, useState } from "react";

type AssetStatus = "Active" | "Inactive" | "Under Maintenance";
type AssetCondition = "Good" | "Fair" | "Poor" | "Damaged";
type Criticality = "Low" | "Medium" | "High" | "Critical";

type Asset = {
  id: number;
  name: string;
  tag: string;
  description: string;
  status: AssetStatus;
  condition: AssetCondition;
  category: string;
  criticality: Criticality;
  dateAdded: string;
};

const initialAssets: Asset[] = [
  {
    id: 1,
    name: "Laptop",
    tag: "AST-123",
    description: "Company laptop for development",
    status: "Active",
    condition: "Good",
    category: "IT Equipment",
    criticality: "High",
    dateAdded: "2026-04-15",
  },
  {
    id: 2,
    name: "Robot",
    tag: "AST-124",
    description: "Cleaning robot",
    status: "Active",
    condition: "Good",
    category: "Workshop Equipment",
    criticality: "High",
    dateAdded: "2026-04-15",
  },
  {
    id: 3,
    name: "Stove",
    tag: "AST-125",
    description: "Company appliance",
    status: "Active",
    condition: "Good",
    category: "Workshop Equipment",
    criticality: "Medium",
    dateAdded: "2026-04-15",
  },
];

const emptyForm = {
  name: "",
  tag: "",
  description: "",
  status: "Active" as AssetStatus,
  condition: "Good" as AssetCondition,
  category: "",
  criticality: "Medium" as Criticality,
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
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [keyword, setKeyword] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortField, setSortField] = useState("name");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const pageSize = 5;

  const filteredAssets = useMemo(() => {
    const filtered = assets.filter((asset) => {
      const fields: Record<string, string> = {
        name: asset.name,
        tag: asset.tag,
        description: asset.description,
        status: asset.status,
        condition: asset.condition,
        category: asset.category,
        criticality: asset.criticality,
      };

      const searchText = keyword.trim().toLowerCase();

      const matchesKeyword =
        !searchText ||
        (searchField === "all"
          ? Object.values(fields).some((value) =>
              value.toLowerCase().includes(searchText)
            )
          : (fields[searchField] ?? "")
              .toLowerCase()
              .includes(searchText));

      const matchesStart =
        !startDate || asset.dateAdded >= startDate;

      const matchesEnd =
        !endDate || asset.dateAdded <= endDate;

      return matchesKeyword && matchesStart && matchesEnd;
    });

    return filtered.sort((a, b) => {
      const left = String(a[sortField as keyof Asset] ?? "");
      const right = String(b[sortField as keyof Asset] ?? "");

      const comparison = left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [
    assets,
    keyword,
    searchField,
    startDate,
    endDate,
    sortField,
    sortOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssets.length / pageSize)
  );

  const visibleAssets = filteredAssets.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      setMessage("The start date cannot be later than the end date.");
      return;
    }

    const normalizedTag = form.tag.trim().toLowerCase();

    const duplicateTag = assets.some(
      (asset) =>
        asset.tag.trim().toLowerCase() === normalizedTag &&
        asset.id !== editingId
    );

    if (duplicateTag) {
      setMessage("This asset tag already exists. Please use a unique tag.");
      return;
    }

    if (editingId !== null) {
      setAssets((current) =>
        current.map((asset) =>
          asset.id === editingId
            ? {
                ...asset,
                ...form,
                name: form.name.trim(),
                tag: form.tag.trim(),
                description: form.description.trim(),
              }
            : asset
        )
      );

      setMessage("Asset updated successfully.");
    } else {
      const newAsset: Asset = {
        ...form,
        id: Date.now(),
        name: form.name.trim(),
        tag: form.tag.trim(),
        description: form.description.trim(),
        dateAdded: new Date().toISOString().slice(0, 10),
      };

      setAssets((current) => [newAsset, ...current]);
      setMessage("Asset registered successfully.");
    }

    setForm(emptyForm);
    setEditingId(null);
    setPage(1);
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
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(asset: Asset) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${asset.name}"?`
    );

    if (!confirmed) return;

    setAssets((current) =>
      current.filter((item) => item.id !== asset.id)
    );

    if (editingId === asset.id) {
      setForm(emptyForm);
      setEditingId(null);
    }

    setMessage("Asset deleted successfully.");

    setPage((current) =>
      Math.min(
        current,
        Math.max(1, Math.ceil((filteredAssets.length - 1) / pageSize))
      )
    );
  }

  function clearFilters() {
    setKeyword("");
    setSearchField("all");
    setStartDate("");
    setEndDate("");
    setSortOrder("asc");
    setSortField("name");
    setPage(1);
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
                className="mt-4 text-sm text-gray-700 dark:text-gray-300"
              >
                {message}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 dark:border-zinc-700">
              <button
                type="button"
                onClick={resetForm}
                className={buttonSecondary}
              >
                Reset
              </button>

              <button
                type="submit"
                className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                {editingId !== null ? "Save Changes" : "+ Register Asset"}
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
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label className={labelClass}>Search Field</label>
              <select
                className={fieldClass}
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value);
                  setPage(1);
                }}
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
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                className={fieldClass}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
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
                onClick={() => setPage(1)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className={buttonSecondary}
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
              {filteredAssets.length} assets
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
                {visibleAssets.map((asset) => (
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
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(asset)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {visibleAssets.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No assets found. Try changing your search filters or
                      register a new asset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 dark:border-zinc-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              {filteredAssets.length === 0 ? 0 : (page - 1) * pageSize + 1}
              {"–"}
              {Math.min(page * pageSize, filteredAssets.length)} of{" "}
              {filteredAssets.length} assets
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-800"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-800"
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
