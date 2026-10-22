
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
  { id: 1, personnelName: "Bianca Santos", personnelUsername: "bsantos", supervisorName: "Maria Dela Cruz", supervisorUsername: "mdelacruz", assignedBy: "John Doe", dateAssigned: "2026-10-16" },
  { id: 2, personnelName: "Alvin Reyes", personnelUsername: "areyes", supervisorName: "Maria Dela Cruz", supervisorUsername: "mdelacruz", assignedBy: "John Doe", dateAssigned: "2026-10-16" },
  { id: 3, personnelName: "Dana Villanueva", personnelUsername: "dvillanueva", supervisorName: "Roberto Lim", supervisorUsername: "rlim", assignedBy: "System - admin", dateAssigned: "2026-10-14" },
  { id: 4, personnelName: "Carlo Mendoza", personnelUsername: "cmendoza", supervisorName: "Roberto Lim", supervisorUsername: "rlim", assignedBy: "System - admin", dateAssigned: "2026-10-14" },
  { id: 5, personnelName: "Faye Dizon", personnelUsername: "fdizon", supervisorName: "Teresa Gonzales", supervisorUsername: "tgonzales", assignedBy: "John Doe", dateAssigned: "2026-10-09" },
  { id: 6, personnelName: "Mark Rivera", personnelUsername: "mrivera", supervisorName: "Maria Dela Cruz", supervisorUsername: "mdelacruz", assignedBy: "John Doe", dateAssigned: "2026-10-08" },
  { id: 7, personnelName: "Angela Cruz", personnelUsername: "acruz", supervisorName: "Teresa Gonzales", supervisorUsername: "tgonzales", assignedBy: "John Doe", dateAssigned: "2026-10-07" },
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
  "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:focus:border-orange-500 dark:focus:ring-orange-950";

const labelClass =
  "mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300";

export default function AssignPersonnel() {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [search, setSearch] = useState("");
  const [filterSupervisor, setFilterSupervisor] = useState("All supervisors");
  const [filterAssignedBy, setFilterAssignedBy] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const pageSize = 5;

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const matchesSearch =
        `${item.personnelName} ${item.personnelUsername} ${item.supervisorName} ${item.supervisorUsername}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesSupervisor =
        filterSupervisor === "All supervisors" ||
        item.supervisorName === filterSupervisor;

      const matchesAssignedBy =
        filterAssignedBy === "All" || item.assignedBy === filterAssignedBy;

      const matchesStartDate = !startDate || item.dateAssigned >= startDate;
      const matchesEndDate = !endDate || item.dateAssigned <= endDate;

      return (
        matchesSearch &&
        matchesSupervisor &&
        matchesAssignedBy &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [assignments, search, filterSupervisor, filterAssignedBy, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const displayedAssignments = filteredAssignments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function handleAssign() {
    if (!selectedPersonnel || !selectedSupervisor) {
      setMessage("Please select both personnel and supervisor.");
      return;
    }

    const person = personnel.find((item) => item.username === selectedPersonnel);
    const supervisor = supervisors.find((item) => item.username === selectedSupervisor);

    if (!person || !supervisor) return;

    const alreadyAssigned = assignments.some(
      (item) => item.personnelUsername === person.username && item.id !== editingId
    );

    if (alreadyAssigned) {
      setMessage("This personnel already has a supervisor. Edit the existing assignment instead.");
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

      setMessage("Assignment updated successfully.");
      setEditingId(null);
    } else {
      const newAssignment: Assignment = {
        id: Math.max(0, ...assignments.map((item) => item.id)) + 1,
        personnelName: person.name,
        personnelUsername: person.username,
        supervisorName: supervisor.name,
        supervisorUsername: supervisor.username,
        assignedBy: "John Doe",
        dateAssigned: new Date().toLocaleDateString("en-CA"),
      };

      setAssignments((previous) => [newAssignment, ...previous]);
      setMessage("Personnel assigned successfully.");
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
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;

    setAssignments((previous) => previous.filter((item) => item.id !== id));

    if (editingId === id) resetForm();

    setMessage("Assignment deleted successfully.");
  }

  function resetForm() {
    setSelectedPersonnel("");
    setSelectedSupervisor("");
    setEditingId(null);
    setMessage("");
  }

  function resetFilters() {
    setSearch("");
    setFilterSupervisor("All supervisors");
    setFilterAssignedBy("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function formatDate(date: string) {
    const [year, month, day] = date.split("-");
    return `${month}/${day}/${year}`;
  }

  return (
    <div className="min-h-full w-full bg-[#f4f4f4] px-0 py-0 text-gray-800 dark:bg-zinc-950 dark:text-gray-100">
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
          {editingId !== null ? "Edit Assignment" : "New Assignment"}
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
                onChange={(e) => setSelectedPersonnel(e.target.value)}
              >
                <option value="">Select personnel to assign</option>
                {personnel.map((person) => (
                  <option key={person.username} value={person.username}>
                    {person.name} ({person.username})
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
                  <option key={supervisor.username} value={supervisor.username}>
                    {supervisor.name}
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
            className="rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleAssign}
            className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {editingId !== null ? "Update" : "Assign"}
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
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Supervisor</label>
            <select
              className={inputClass}
              value={filterSupervisor}
              onChange={(e) => {
                setFilterSupervisor(e.target.value);
                setPage(1);
              }}
            >
              <option>All supervisors</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.username} value={supervisor.name}>
                  {supervisor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Assigned By</label>
            <select
              className={inputClass}
              value={filterAssignedBy}
              onChange={(e) => {
                setFilterAssignedBy(e.target.value);
                setPage(1);
              }}
            >
              <option>All</option>
              <option>John Doe</option>
              <option>System - admin</option>
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
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
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
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
              <Calendar size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => setPage(1)}
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
              {displayedAssignments.map((item) => (
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
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title="Delete assignment"
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {displayedAssignments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredAssignments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredAssignments.length)} of {filteredAssignments.length} assignments
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((previous) => previous - 1)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((number) => number === 1 || number === totalPages || Math.abs(number - currentPage) <= 1)
              .map((number, index, visiblePages) => (
                <span key={number} className="contents">
                  {index > 0 && number - visiblePages[index - 1] > 1 && (
                    <span className="px-1 text-xs text-gray-400">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(number)}
                    aria-current={currentPage === number ? "page" : undefined}
                    className={`h-10 min-w-10 rounded-lg border px-3 text-sm ${
                      currentPage === number
                        ? "border-orange-600 bg-orange-600 font-bold text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {number}
                  </button>
                </span>
              ))}

            <span className="px-2 text-xs text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((previous) => previous + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
