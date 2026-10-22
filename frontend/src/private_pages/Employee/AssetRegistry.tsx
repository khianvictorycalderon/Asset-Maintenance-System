import { useMemo, useState } from "react";
import {
  Search,
  Calendar,
  ChevronDown,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

type Assignment = {
  id: number;
  personnelName: string;
  personnelUsername: string;
  supervisorName: string;
  supervisorUsername: string;
  assignedBy: string;
  dateAssigned: string;
};

const initialAssignments: Assignment[] = [
  {
    id: 1,
    personnelName: "Bianca Santos",
    personnelUsername: "bsantos",
    supervisorName: "Maria Dela Cruz",
    supervisorUsername: "mdelacruz",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-16",
  },
  {
    id: 2,
    personnelName: "Alvin Reyes",
    personnelUsername: "areyes",
    supervisorName: "Maria Dela Cruz",
    supervisorUsername: "mdelacruz",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-16",
  },
  {
    id: 3,
    personnelName: "Dana Villanueva",
    personnelUsername: "dvillanueva",
    supervisorName: "Roberto Lim",
    supervisorUsername: "rlim",
    assignedBy: "System - admin",
    dateAssigned: "2026-10-14",
  },
  {
    id: 4,
    personnelName: "Carlo Mendoza",
    personnelUsername: "cmendoza",
    supervisorName: "Roberto Lim",
    supervisorUsername: "rlim",
    assignedBy: "System - admin",
    dateAssigned: "2026-10-14",
  },
  {
    id: 5,
    personnelName: "Faye Dizon",
    personnelUsername: "fdizon",
    supervisorName: "Teresa Gonzales",
    supervisorUsername: "tgonzales",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-09",
  },
  {
    id: 6,
    personnelName: "Mark Rivera",
    personnelUsername: "mrivera",
    supervisorName: "Maria Dela Cruz",
    supervisorUsername: "mdelacruz",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-08",
  },
  {
    id: 7,
    personnelName: "Angela Cruz",
    personnelUsername: "acruz",
    supervisorName: "Teresa Gonzales",
    supervisorUsername: "tgonzales",
    assignedBy: "John Doe",
    dateAssigned: "2026-10-07",
  },
];

const supervisors = [
  { name: "Maria Dela Cruz", username: "mdelacruz" },
  { name: "Roberto Lim", username: "rlim" },
  { name: "Teresa Gonzales", username: "tgonzales" },
];

const personnel = [
  { name: "Bianca Santos", username: "bsantos" },
  { name: "Alvin Reyes", username: "areyes" },
  { name: "Dana Villanueva", username: "dvillanueva" },
  { name: "Carlo Mendoza", username: "cmendoza" },
  { name: "Faye Dizon", username: "fdizon" },
  { name: "Mark Rivera", username: "mrivera" },
  { name: "Angela Cruz", username: "acruz" },
];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-zinc-500";

const labelClass =
  "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200";

const buttonSecondary =
  "rounded-lg bg-gray-100 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-600";

function formatDate(date: string) {
  if (!date) return "—";

  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

export default function AssignPersonnel() {
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);

  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");

  const [search, setSearch] = useState("");
  const [filterSupervisor, setFilterSupervisor] =
    useState("All supervisors");
  const [filterAssignedBy, setFilterAssignedBy] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const pageSize = 5;

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const searchText =
        `${item.personnelName} ${item.personnelUsername} ${item.supervisorName} ${item.supervisorUsername} ${item.assignedBy}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const matchesSupervisor =
        filterSupervisor === "All supervisors" ||
        item.supervisorName === filterSupervisor;

      const matchesAssignedBy =
        filterAssignedBy === "All" ||
        item.assignedBy === filterAssignedBy;

      const matchesStartDate =
        !startDate || item.dateAssigned >= startDate;

      const matchesEndDate =
        !endDate || item.dateAssigned <= endDate;

      return (
        matchesSearch &&
        matchesSupervisor &&
        matchesAssignedBy &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    assignments,
    search,
    filterSupervisor,
    filterAssignedBy,
    startDate,
    endDate,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssignments.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const displayedAssignments = filteredAssignments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function showMessage(
    text: string,
    type: "success" | "error" = "success"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  function resetForm() {
    setSelectedPersonnel("");
    setSelectedSupervisor("");
    setEditingId(null);
    setMessage("");
  }

  function handleAssign() {
    if (!selectedPersonnel || !selectedSupervisor) {
      showMessage(
        "Please select both personnel and supervisor.",
        "error"
      );
      return;
    }

    const person = personnel.find(
      (item) => item.username === selectedPersonnel
    );

    const supervisor = supervisors.find(
      (item) => item.username === selectedSupervisor
    );

    if (!person || !supervisor) return;

    const alreadyAssigned = assignments.some(
      (item) =>
        item.personnelUsername === person.username &&
        item.id !== editingId
    );

    if (alreadyAssigned) {
      showMessage(
        "This personnel already has a supervisor. Edit the existing assignment instead.",
        "error"
      );
      return;
    }

    if (editingId !== null) {
      setAssignments((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? {
                ...item,
                personnelName: person.name,
                personnelUsername: person.username,
                supervisorName: supervisor.name,
                supervisorUsername: supervisor.username,
              }
            : item
        )
      );

      showMessage("Assignment updated successfully.");
      setEditingId(null);
    } else {
      const newAssignment: Assignment = {
        id:
          Math.max(0, ...assignments.map((item) => item.id)) + 1,
        personnelName: person.name,
        personnelUsername: person.username,
        supervisorName: supervisor.name,
        supervisorUsername: supervisor.username,
        assignedBy: "John Doe",
        dateAssigned: new Date().toLocaleDateString("en-CA"),
      };

      setAssignments((previous) => [newAssignment, ...previous]);
      showMessage("Personnel assigned successfully.");
    }

    setSelectedPersonnel("");
    setSelectedSupervisor("");
    setPage(1);
  }

  function handleEdit(item: Assignment) {
    setSelectedPersonnel(item.personnelUsername);
    setSelectedSupervisor(item.supervisorUsername);
    setEditingId(item.id);
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmed) return;

    setAssignments((previous) =>
      previous.filter((item) => item.id !== id)
    );

    if (editingId === id) {
      setSelectedPersonnel("");
      setSelectedSupervisor("");
      setEditingId(null);
    }

    showMessage("Assignment deleted successfully.");
  }

  function resetFilters() {
    setSearch("");
    setFilterSupervisor("All supervisors");
    setFilterAssignedBy("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  return (
    <main className="min-h-full w-full text-gray-900 transition-colors dark:text-gray-100">
      <div className="w-full space-y-5">
        {/* Page Heading */}
        <div>
          <div className="flex items-center gap-3">
            <Users size={27} className="text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Assign Personnel
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Assign personnel to a supervisor and manage existing assignments.
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div
            role="status"
            className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            }`}
          >
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
              className="cursor-pointer text-xl leading-none opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Assignment Form */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
          <div className="mb-5 border-b border-gray-200 pb-4 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId !== null ? "Edit Assignment" : "New Assignment"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a personnel member and assign them to a supervisor.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Personnel */}
            <div className="min-w-0">
              <label htmlFor="personnel" className={labelClass}>
                Personnel <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  id="personnel"
                  className={`${inputClass} appearance-none pr-10`}
                  value={selectedPersonnel}
                  onChange={(e) => setSelectedPersonnel(e.target.value)}
                >
                  <option value="">Select personnel to assign</option>
                  {personnel.map((person) => (
                    <option
                      key={person.username}
                      value={person.username}
                    >
                      {person.name} ({person.username})
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>

              <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Personnel can only be assigned to one supervisor at a time.
              </p>
            </div>

            {/* Supervisor */}
            <div className="min-w-0">
              <label htmlFor="supervisor" className={labelClass}>
                Supervisor <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  id="supervisor"
                  className={`${inputClass} appearance-none pr-10`}
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
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
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Buttons directly below the dropdowns */}
          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 dark:border-zinc-700">
            <button
              type="button"
              onClick={resetForm}
              className={`${buttonSecondary} cursor-pointer`}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleAssign}
              className="cursor-pointer rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              {editingId !== null ? "Update Assignment" : "+ Assign Personnel"}
            </button>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
          <div className="mb-5 border-b border-gray-200 pb-4 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Search and Filter Assignments
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Find assignments using personnel, supervisor, assigned by, or date.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Search */}
            <div>
              <label htmlFor="assignment-search" className={labelClass}>
                Search Keywords
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="assignment-search"
                  type="text"
                  placeholder="Name or username..."
                  className={`${inputClass} pl-10`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Supervisor Filter */}
            <div>
              <label htmlFor="filter-supervisor" className={labelClass}>
                Supervisor
              </label>

              <select
                id="filter-supervisor"
                className={inputClass}
                value={filterSupervisor}
                onChange={(e) => {
                  setFilterSupervisor(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All supervisors">All supervisors</option>
                {supervisors.map((supervisor) => (
                  <option
                    key={supervisor.username}
                    value={supervisor.name}
                  >
                    {supervisor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned By Filter */}
            <div>
              <label htmlFor="filter-assigned-by" className={labelClass}>
                Assigned By
              </label>

              <select
                id="filter-assigned-by"
                className={inputClass}
                value={filterAssignedBy}
                onChange={(e) => {
                  setFilterAssignedBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All</option>
                <option value="John Doe">John Doe</option>
                <option value="System - admin">System - admin</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="start-date" className={labelClass}>
                Start Date
              </label>

              <div className="relative">
                <input
                  id="start-date"
                  type="date"
                  className={`${inputClass} pr-10`}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
                <Calendar
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="end-date" className={labelClass}>
                End Date
              </label>

              <div className="relative">
                <input
                  id="end-date"
                  type="date"
                  className={`${inputClass} pr-10`}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
                <Calendar
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="cursor-pointer rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className={`${buttonSecondary} cursor-pointer`}
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* Assignment Table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-5 dark:border-zinc-700 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Personnel Assignments
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage personnel-to-supervisor assignments.
              </p>
            </div>

            <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800 dark:bg-orange-950 dark:text-orange-300">
              {filteredAssignments.length} assignments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-gray-200">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Personnel Name
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Personnel Username
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Supervisor Name
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Supervisor Username
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Assigned By
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Date Assigned
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 text-center font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayedAssignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No assignments found. Try changing your filters or
                      create a new assignment.
                    </td>
                  </tr>
                ) : (
                  displayedAssignments.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-200 text-gray-700 transition hover:bg-orange-50 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-orange-950/30"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900 dark:text-white">
                        {item.personnelName}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                        {item.personnelUsername}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900 dark:text-white">
                        {item.supervisorName}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                        {item.supervisorUsername}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {item.assignedBy}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDate(item.dateAssigned)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            title="Edit assignment"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            title="Delete assignment"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                          >
                            <Trash2 size={15} />
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
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-5 py-5 dark:border-zinc-700 sm:px-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              {filteredAssignments.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {"–"}
              {Math.min(
                currentPage * pageSize,
                filteredAssignments.length
              )}{" "}
              of {filteredAssignments.length} assignments
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  setPage((previous) => Math.max(1, previous - 1))
                }
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-800"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((previous) =>
                    Math.min(totalPages, previous + 1)
                  )
                }
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-800"
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
