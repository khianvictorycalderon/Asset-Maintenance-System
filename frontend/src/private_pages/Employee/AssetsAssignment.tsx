
import { useMemo, useState } from "react";
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

type AssetAssignmentRecord = {
  id: number;
  assetName: string;
  assetTag: string;
  category: string;
  supervisorName: string;
  supervisorUsername: string;
  assignedBy: string;
  dateAssigned: string;
};

type AssetOption = {
  name: string;
  tag: string;
  category: string;
};

const assets: AssetOption[] = [
  { name: "CNC Milling Machine", tag: "AST-011", category: "Machinery" },
  { name: "Hydraulic Press", tag: "AST-012", category: "Machinery" },
  { name: "Forklift #03", tag: "AST-013", category: "Vehicle" },
  { name: "Air Compressor", tag: "AST-014", category: "Equipment" },
  { name: "Welding Station", tag: "AST-015", category: "Tools" },
  { name: "Industrial Generator", tag: "AST-016", category: "Equipment" },
  { name: "Conveyor Belt", tag: "AST-017", category: "Machinery" },
  { name: "Forklift #04", tag: "AST-018", category: "Vehicle" },
  { name: "Drill Press", tag: "AST-019", category: "Machinery" },
  { name: "Welding Machine", tag: "AST-020", category: "Tools" },
  { name: "Hydraulic Jack", tag: "AST-021", category: "Equipment" },
  { name: "Lathe Machine", tag: "AST-022", category: "Machinery" },
  { name: "Safety Equipment Set", tag: "AST-023", category: "Tools" },
];

const supervisors = [
  { name: "Maria Dela Cruz", username: "mdelacruz" },
  { name: "Roberto Lim", username: "rlim" },
  { name: "Teresa Gonzales", username: "tgonzales" },
];

const initialAssignments: AssetAssignmentRecord[] = [
  {
    id: 1,
    assetName: "CNC Milling Machine",
    assetTag: "AST-011",
    category: "Machinery",
    supervisorName: "Maria Dela Cruz",
    supervisorUsername: "mdelacruz",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-16",
  },
  {
    id: 2,
    assetName: "Hydraulic Press",
    assetTag: "AST-012",
    category: "Machinery",
    supervisorName: "Maria Dela Cruz",
    supervisorUsername: "mdelacruz",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-16",
  },
  {
    id: 3,
    assetName: "Forklift #03",
    assetTag: "AST-013",
    category: "Vehicle",
    supervisorName: "Roberto Lim",
    supervisorUsername: "rlim",
    assignedBy: "System - admin",
    dateAssigned: "2026-10-14",
  },
  {
    id: 4,
    assetName: "Air Compressor",
    assetTag: "AST-014",
    category: "Equipment",
    supervisorName: "Roberto Lim",
    supervisorUsername: "rlim",
    assignedBy: "System - admin",
    dateAssigned: "2026-10-14",
  },
  {
    id: 5,
    assetName: "Welding Station",
    assetTag: "AST-015",
    category: "Tools",
    supervisorName: "Teresa Gonzales",
    supervisorUsername: "tgonzales",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-09",
  },
  {
    id: 6,
    assetName: "Industrial Generator",
    assetTag: "AST-016",
    category: "Equipment",
    supervisorName: "Maria Dela Cruz",
    supervisorUsername: "mdelacruz",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-08",
  },
  {
    id: 7,
    assetName: "Conveyor Belt",
    assetTag: "AST-017",
    category: "Machinery",
    supervisorName: "Teresa Gonzales",
    supervisorUsername: "tgonzales",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-07",
  },
  {
    id: 8,
    assetName: "Forklift #04",
    assetTag: "AST-018",
    category: "Vehicle",
    supervisorName: "Roberto Lim",
    supervisorUsername: "rlim",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-05",
  },
  {
    id: 9,
    assetName: "Drill Press",
    assetTag: "AST-019",
    category: "Machinery",
    supervisorName: "Maria Dela Cruz",
    supervisorUsername: "mdelacruz",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-03",
  },
  {
    id: 10,
    assetName: "Welding Machine",
    assetTag: "AST-020",
    category: "Tools",
    supervisorName: "Teresa Gonzales",
    supervisorUsername: "tgonzales",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-02",
  },
  {
    id: 11,
    assetName: "Hydraulic Jack",
    assetTag: "AST-021",
    category: "Equipment",
    supervisorName: "Roberto Lim",
    supervisorUsername: "rlim",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-01",
  },
  {
    id: 12,
    assetName: "Lathe Machine",
    assetTag: "AST-022",
    category: "Machinery",
    supervisorName: "Maria Dela Cruz",
    supervisorUsername: "mdelacruz",
    assignedBy: "John Doe",
    dateAssigned: "2026-09-29",
  },
  {
    id: 13,
    assetName: "Safety Equipment Set",
    assetTag: "AST-023",
    category: "Tools",
    supervisorName: "Teresa Gonzales",
    supervisorUsername: "tgonzales",
    assignedBy: "John Doe",
    dateAssigned: "2026-09-27",
  },
];

const PAGE_SIZE = 5;
const CURRENT_USER = "John Doe";

function formatDate(date: string) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

export default function AssetsAssignment() {
  const [assignments, setAssignments] =
    useState<AssetAssignmentRecord[]>(initialAssignments);

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filterSupervisor, setFilterSupervisor] = useState("");
  const [filterAssignedBy, setFilterAssignedBy] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    supervisor: "",
    assignedBy: "",
    from: "",
    to: "",
  });

  const [page, setPage] = useState(1);
  const [editing, setEditing] =
    useState<AssetAssignmentRecord | null>(null);
  const [editSupervisor, setEditSupervisor] = useState("");
  const [notice, setNotice] = useState("");

  const assignedTags = useMemo(
    () => new Set(assignments.map((item) => item.assetTag)),
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    const query = filters.search.toLowerCase().trim();

    return assignments.filter((item) => {
      const matchesSearch =
        !query ||
        item.assetName.toLowerCase().includes(query) ||
        item.assetTag.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesSupervisor =
        !filters.supervisor ||
        item.supervisorUsername === filters.supervisor;

      const matchesAssignedBy =
        !filters.assignedBy ||
        item.assignedBy === filters.assignedBy;

      const matchesFrom =
        !filters.from || item.dateAssigned >= filters.from;

      const matchesTo =
        !filters.to || item.dateAssigned <= filters.to;

      return (
        matchesSearch &&
        matchesSupervisor &&
        matchesAssignedBy &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [assignments, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssignments.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleAssignments = filteredAssignments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const assignedByOptions = [
    ...new Set(assignments.map((item) => item.assignedBy)),
  ].sort();

  const inputClass =
    "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:focus:border-orange-500 dark:focus:ring-orange-950";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300";

  function toggleAsset(tag: string) {
    setSelectedAssets((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }

  function resetAssignmentForm() {
    setSelectedAssets([]);
    setSelectedSupervisor("");
    setAssetDropdownOpen(false);
  }

  function handleAssign() {
    if (!selectedAssets.length || !selectedSupervisor) {
      setNotice("Please select at least one asset and a supervisor.");
      return;
    }

    const supervisor = supervisors.find(
      (item) => item.username === selectedSupervisor
    );

    if (!supervisor) return;

    const newAssignments = selectedAssets.flatMap((tag, index) => {
      const asset = assets.find((item) => item.tag === tag);
      if (!asset) return [];

      return [
        {
          id: Date.now() + index,
          assetName: asset.name,
          assetTag: asset.tag,
          category: asset.category,
          supervisorName: supervisor.name,
          supervisorUsername: supervisor.username,
          assignedBy: CURRENT_USER,
          dateAssigned: new Date().toLocaleDateString("en-CA"),
        },
      ];
    });

    setAssignments((current) => [...newAssignments, ...current]);
    setPage(1);
    clearFilters();
    resetAssignmentForm();
    setNotice(`${newAssignments.length} asset assignment(s) created.`);
  }

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

    setFilters({
      search: "",
      supervisor: "",
      assignedBy: "",
      from: "",
      to: "",
    });

    setPage(1);
  }

  function handleDelete(id: number) {
    const assignment = assignments.find((item) => item.id === id);
    if (!assignment) return;

    if (
      !window.confirm(
        `Delete the assignment for ${assignment.assetName}?`
      )
    ) {
      return;
    }

    setAssignments((current) =>
      current.filter((item) => item.id !== id)
    );

    setNotice("Assignment deleted successfully.");
  }

  function handleEditSave() {
    if (!editing || !editSupervisor) return;

    const supervisor = supervisors.find(
      (item) => item.username === editSupervisor
    );

    if (!supervisor) return;

    setAssignments((current) =>
      current.map((item) =>
        item.id === editing.id
          ? {
              ...item,
              supervisorName: supervisor.name,
              supervisorUsername: supervisor.username,
            }
          : item
      )
    );

    setEditing(null);
    setNotice("Assignment updated successfully.");
  }

  return (
    <div className="min-h-full w-full bg-[#f4f4f4] px-0 py-0 text-gray-800 dark:bg-zinc-950 dark:text-gray-100">
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
            className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="rounded p-1 hover:bg-orange-100 dark:hover:bg-orange-900"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* NEW ASSIGNMENT */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="mb-5 text-base font-bold">
            New Assignment
          </h2>

          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1.5fr_1fr]">

            {/* ASSET MULTISELECT */}
            <div className="relative">
              <label className={labelClass}>
                Asset <span className="text-red-500">*</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setAssetDropdownOpen((open) => !open)
                }
                aria-expanded={assetDropdownOpen}
                className={`${inputClass} flex min-h-[48px] items-center justify-between gap-2 text-left`}
              >
                <span className="flex min-w-0 flex-1 flex-wrap gap-2">
                  {selectedAssets.length ? (
                    selectedAssets.map((tag) => {
                      const asset = assets.find(
                        (item) => item.tag === tag
                      );

                      return (
                        <span
                          key={tag}
                          className="inline-flex max-w-full items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                        >
                          <span className="truncate">
                            {asset?.name ?? tag}
                          </span>

                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={`Remove ${asset?.name ?? tag}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleAsset(tag);
                            }}
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                event.stopPropagation();
                                toggleAsset(tag);
                              }
                            }}
                          >
                            <X size={14} />
                          </span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-400">
                      Select one or more assets
                    </span>
                  )}
                </span>

                <ChevronDown size={18} className="shrink-0" />
              </button>

              {assetDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  {assets.map((asset) => {
                    const selected = selectedAssets.includes(asset.tag);
                    const alreadyAssigned = assignedTags.has(asset.tag);

                    return (
                      <button
                        type="button"
                        key={asset.tag}
                        disabled={alreadyAssigned && !selected}
                        onClick={() => toggleAsset(asset.tag)}
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
                          <span className="block font-medium">
                            {asset.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {asset.tag}
                            {alreadyAssigned ? " · Already assigned" : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
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
                  onChange={(event) =>
                    setSelectedSupervisor(event.target.value)
                  }
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="">Select supervisor</option>
                  {supervisors.map((supervisor) => (
                    <option
                      key={supervisor.username}
                      value={supervisor.username}
                    >
                      {supervisor.name}
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
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-600"
              >
                <RotateCcw size={15} />
                Reset
              </button>

              <button
                type="button"
                onClick={handleAssign}
                className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                + Assign Assets
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
                onChange={(event) =>
                  setFilterSupervisor(event.target.value)
                }
                className={inputClass}
              >
                <option value="">All supervisors</option>
                {supervisors.map((supervisor) => (
                  <option
                    key={supervisor.username}
                    value={supervisor.username}
                  >
                    {supervisor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Assigned By</label>
              <select
                value={filterAssignedBy}
                onChange={(event) =>
                  setFilterAssignedBy(event.target.value)
                }
                className={inputClass}
              >
                <option value="">All employees</option>
                {assignedByOptions.map((employee) => (
                  <option key={employee} value={employee}>
                    {employee}
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
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
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
              <h2 className="text-base font-bold">
                Asset Assignments
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                View and manage asset-to-supervisor assignments.
              </p>
            </div>

            <span className="w-fit rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              {filteredAssignments.length} assignments
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
                {visibleAssignments.map((item) => (
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
                          onClick={() => {
                            setEditing(item);
                            setEditSupervisor(item.supervisorUsername);
                          }}
                          title={`Edit ${item.assetName}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          title={`Delete ${item.assetName}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {visibleAssignments.length === 0 && (
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
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              {filteredAssignments.length
                ? (currentPage - 1) * PAGE_SIZE + 1
                : 0}{" "}
              to{" "}
              {Math.min(
                currentPage * PAGE_SIZE,
                filteredAssignments.length
              )}{" "}
              of {filteredAssignments.length} assignments
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              )
                .filter(
                  (number) =>
                    number === 1 ||
                    number === totalPages ||
                    Math.abs(number - currentPage) <= 1
                )
                .map((number, index, numbers) => (
                  <span key={number} className="contents">
                    {index > 0 &&
                      numbers[index - 1] !== number - 1 && (
                        <span className="px-1 text-sm text-gray-400">
                          …
                        </span>
                      )}

                    <button
                      type="button"
                      onClick={() => setPage(number)}
                      aria-current={
                        currentPage === number ? "page" : undefined
                      }
                      className={`size-10 rounded-lg border text-sm transition ${
                        currentPage === number
                          ? "border-orange-600 bg-orange-600 font-bold text-white"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {number}
                    </button>
                  </span>
                ))}

              <span className="mx-1 text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
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
            if (event.target === event.currentTarget) {
              setEditing(null);
            }
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
                <h2
                  id="edit-assignment-title"
                  className="text-xl font-bold"
                >
                  Edit Assignment
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Update the supervisor responsible for this asset.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close edit dialog"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
              <p className="text-base font-semibold">
                {editing.assetName}
              </p>
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
              {supervisors.map((supervisor) => (
                <option
                  key={supervisor.username}
                  value={supervisor.username}
                >
                  {supervisor.name}
                </option>
              ))}
            </select>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleEditSave}
                className="rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
