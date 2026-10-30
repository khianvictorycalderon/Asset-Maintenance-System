
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
} from "lucide-react";

type MaintenanceStatus =
  | "Completed"
  | "Scheduled"
  | "In Progress"
  | "Overdue";

type MaintenanceTask = {
  id: string;
  name: string;
  status: MaintenanceStatus;
  deadline: string;
};

// Shape returned by the ASP.NET Core API.
type ApiMaintenanceTask = {
  id: string;
  name: string;
  description: string;
  due_at: string;
  status: MaintenanceStatus;
  assigned_by_id: string | null;
  assigned_by: string | null;
  assignees: {
    id: string;
    full_name: string;
  }[];
  created_at: string;
};

type MaintenanceTasksResponse = {
  tasks: ApiMaintenanceTask[];
  total_tasks: number;
  current_page: number;
  page_size: number;
  total_pages: number;
};

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5043"
).replace(/\/$/, "");

const API_ENDPOINT = `${API_BASE_URL}/api/supervisor/maintenance-tasks`;

const STATUS_STYLES: Record<
  MaintenanceStatus,
  { badge: string; dot: string }
> = {
  Completed: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Scheduled: {
    badge:
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  "In Progress": {
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  Overdue: {
    badge:
      "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-500",
  },
};

const STATUS_OPTIONS = [
  "All Statuses",
  "Completed",
  "Scheduled",
  "In Progress",
  "Overdue",
];

const PAGE_SIZE = 5;
const API_PAGE_SIZE = 100;

// Converts the API's date into a Philippine calendar date.
// This avoids shifting a deadline to the previous or next day.
function toPhilippineDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }
  );
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Creates the API query string using the selected filters.
function createQueryString(
  search: string,
  status: string,
  fromDate: string,
  toDate: string,
  page: number
) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("keyword", search.trim());
  }

  if (status !== "All Statuses") {
    params.set("status", status);
  }

  if (fromDate) {
    params.set("startDate", fromDate);
  }

  if (toDate) {
    params.set("endDate", toDate);
  }

  params.set("page", String(page));
  params.set("pageSize", String(API_PAGE_SIZE));

  return params.toString();
}

// Reads a useful error message from the backend.
async function getApiError(response: Response) {
  const result = await response.json().catch(() => null);

  return (
    result?.detail ||
    result?.message ||
    result?.title ||
    `Request failed with status ${response.status}.`
  );
}

// Fetches every page so the calendar can display all matching tasks,
// while the visible table keeps its own five-row pagination.
async function fetchAllMaintenanceTasks(
  search: string,
  status: string,
  fromDate: string,
  toDate: string,
  signal: AbortSignal
): Promise<MaintenanceTask[]> {
  const firstQuery = createQueryString(
    search,
    status,
    fromDate,
    toDate,
    1
  );

  const firstResponse = await fetch(
    `${API_ENDPOINT}?${firstQuery}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
      signal,
    }
  );

  if (!firstResponse.ok) {
    throw new Error(await getApiError(firstResponse));
  }

  const firstPage =
    (await firstResponse.json()) as MaintenanceTasksResponse;

  let allTasks = [...firstPage.tasks];

  // Request the remaining API pages if there are more than 100 tasks.
  if (firstPage.total_pages > 1) {
    const remainingRequests = Array.from(
      { length: firstPage.total_pages - 1 },
      (_, index) => index + 2
    );

    const remainingPages = await Promise.all(
      remainingRequests.map(async (page) => {
        const query = createQueryString(
          search,
          status,
          fromDate,
          toDate,
          page
        );

        const response = await fetch(
          `${API_ENDPOINT}?${query}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(await getApiError(response));
        }

        return (await response.json()) as MaintenanceTasksResponse;
      })
    );

    remainingPages.forEach((page) => {
      allTasks = [...allTasks, ...page.tasks];
    });
  }

  return allTasks.map((task) => ({
    id: task.id,
    name: task.name,
    status: task.status,
    deadline: toPhilippineDate(task.due_at),
  }));
}

function StatusBadge({
  status,
}: {
  status: MaintenanceStatus;
}) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${style.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

export default function MaintenanceSchedule() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Start on October 2026, matching your Figma reference.
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tablePage, setTablePage] = useState(1);

  // Load maintenance tasks from the backend whenever filters change.
  useEffect(() => {
    const controller = new AbortController();

    // Small delay prevents unnecessary requests while typing.
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const result = await fetchAllMaintenanceTasks(
          search,
          statusFilter,
          fromDate,
          toDate,
          controller.signal
        );

        setTasks(result);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load maintenance tasks."
        );

        setTasks([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search, statusFilter, fromDate, toDate]);

  // The backend already applies the selected filters.
  const filteredTasks = tasks;

  // Generate every date needed to display the complete month.
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();

    const totalCells =
      Math.ceil((firstDay + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - firstDay + 1;

      if (dayNumber < 1) {
        return {
          date: new Date(
            year,
            month - 1,
            previousMonthDays + dayNumber
          ),
          current: false,
        };
      }

      if (dayNumber > daysInMonth) {
        return {
          date: new Date(
            year,
            month + 1,
            dayNumber - daysInMonth
          ),
          current: false,
        };
      }

      return {
        date: new Date(year, month, dayNumber),
        current: true,
      };
    });
  }, [currentMonth]);

  // Table pagination.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / PAGE_SIZE)
  );

  const paginatedTasks = filteredTasks.slice(
    (tablePage - 1) * PAGE_SIZE,
    tablePage * PAGE_SIZE
  );

  function changeMonth(direction: number) {
    setCurrentMonth(
      (month) =>
        new Date(
          month.getFullYear(),
          month.getMonth() + direction,
          1
        )
    );
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("All Statuses");
    setFromDate("");
    setToDate("");
    setTablePage(1);
  }

  function changeSearch(value: string) {
    setSearch(value);
    setTablePage(1);
  }

  function changeStatus(value: string) {
    setStatusFilter(value);
    setTablePage(1);
  }

  function changeFromDate(value: string) {
    setFromDate(value);

    if (toDate && value && value > toDate) {
      setToDate("");
    }

    setTablePage(1);
  }

  function changeToDate(value: string) {
    setToDate(value);
    setTablePage(1);
  }

  function goToTablePage(page: number) {
    setTablePage(
      Math.min(Math.max(page, 1), totalPages)
    );
  }

  return (
    <div className="min-h-full w-full bg-[#f4f4f4] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-5 lg:px-0">
      <main className="mx-auto w-full max-w-none space-y-4">

        {/* Page heading */}
        <section>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Maintenance Schedule
          </h1>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
            Monitor upcoming maintenance deadlines and task progress.
          </p>
        </section>

        {/* Search and filters */}
        <section className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1.5fr)_minmax(160px,1fr)_minmax(130px,0.7fr)_minmax(130px,0.7fr)_auto]">

            {/* Search */}
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => changeSearch(e.target.value)}
                placeholder="Search maintenance task..."
                aria-label="Search maintenance tasks"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-orange-950"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => changeStatus(e.target.value)}
                aria-label="Filter by maintenance status"
                className="h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 pr-9 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
            </div>

            {/* Start date */}
            <input
              type="date"
              value={fromDate}
              onChange={(e) => changeFromDate(e.target.value)}
              aria-label="From date"
              title="From date"
              className="h-10 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 sm:px-3"
            />

            {/* End date */}
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => changeToDate(e.target.value)}
              aria-label="To date"
              title="To date"
              className="h-10 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 sm:px-3"
            />

            {/* Reset */}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 text-sm font-medium transition hover:bg-orange-100 hover:text-orange-700 dark:bg-zinc-800 dark:hover:bg-orange-950 dark:hover:text-orange-300"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </section>

        {/* Schedule calendar */}
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-3 sm:p-4">

            {/* Calendar heading and legend */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={20}
                  className="text-orange-600"
                />

                <h2 className="text-lg font-bold">
                  Schedule Calendar
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] sm:text-xs">
                {(
                  [
                    "Completed",
                    "Scheduled",
                    "In Progress",
                    "Overdue",
                  ] as MaintenanceStatus[]
                ).map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`}
                    />

                    <span className="text-zinc-600 dark:text-zinc-300">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Month navigation */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <h3 className="text-center text-sm font-bold sm:text-base">
                {formatMonth(currentMonth)}
              </h3>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Full monthly calendar */}
            <div className="mt-3 overflow-x-auto">
              <div className="min-w-[600px]">

                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                  {[
                    "Sun",
                    "Mon",
                    "Tues",
                    "Wed",
                    "Thurs",
                    "Fri",
                    "Sat",
                  ].map((day) => (
                    <div
                      key={day}
                      className="border-r border-zinc-300 px-1 py-2 text-center text-xs font-semibold last:border-r-0 dark:border-zinc-700"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar dates */}
                <div className="grid grid-cols-7">
                  {calendarCells.map((cell, index) => {
                    const dateKey = [
                      cell.date.getFullYear(),
                      String(cell.date.getMonth() + 1).padStart(2, "0"),
                      String(cell.date.getDate()).padStart(2, "0"),
                    ].join("-");

                    const dayTasks = filteredTasks.filter(
                      (task) => task.deadline === dateKey
                    );

                    return (
                      <div
                        key={`${dateKey}-${index}`}
                        className={`min-h-[84px] border-b border-r border-zinc-300 p-1.5 last:border-r-0 dark:border-zinc-700 sm:min-h-[94px] sm:p-2 ${
                          cell.current
                            ? "bg-white dark:bg-zinc-900"
                            : "bg-zinc-50 dark:bg-zinc-950"
                        }`}
                      >
                        <span
                          className={`text-[11px] font-semibold ${
                            cell.current
                              ? "text-zinc-800 dark:text-zinc-200"
                              : "text-zinc-400 dark:text-zinc-600"
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>

                        <div className="mt-1 space-y-1">
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              title={`${task.name} — ${task.status}`}
                              className={`flex items-start gap-1 rounded-md px-1.5 py-1 text-[9px] leading-tight sm:text-[10px] ${STATUS_STYLES[task.status].badge}`}
                            >
                              <span
                                className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_STYLES[task.status].dot}`}
                              />

                              <span className="min-w-0 break-words">
                                <span className="font-semibold">
                                  {task.name}
                                </span>

                                <span className="block opacity-80">
                                  {task.status}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {loading && (
              <p className="mt-3 text-center text-xs text-zinc-500">
                Loading maintenance schedule...
              </p>
            )}
          </div>
        </section>

        {/* Maintenance tasks table */}
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

          {/* Table heading */}
          <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
            <h2 className="text-lg font-bold">
              Maintenance Tasks
            </h2>

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="w-[36%] px-4 py-3 font-semibold sm:px-6">
                    Maintenance Name
                  </th>

                  <th className="w-[30%] px-4 py-3 font-semibold sm:px-6">
                    Maintenance Status
                  </th>

                  <th className="px-4 py-3 font-semibold sm:px-6">
                    Maintenance Deadline
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-zinc-500">
                      Loading maintenance tasks...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center">
                      <p className="font-medium text-red-600 dark:text-red-400">
                        Unable to load maintenance tasks
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {error}
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  paginatedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-zinc-200 transition hover:bg-orange-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                    >
                      <td className="px-4 py-3 sm:px-6">
                        <span className="font-medium">
                          {task.name}
                        </span>
                      </td>

                      <td className="px-4 py-2 sm:px-6">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 sm:px-6">
                        {formatDate(task.deadline)}
                      </td>
                    </tr>
                  ))}

                {!loading &&
                  !error &&
                  paginatedTasks.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2 text-zinc-500">
                          <Search size={24} />

                          <p className="font-medium">
                            No maintenance tasks found
                          </p>

                          <p className="text-xs">
                            There are no maintenance tasks matching your filters.
                          </p>

                          <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-1 font-semibold text-orange-600 hover:text-orange-700"
                          >
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
            <button
              type="button"
              onClick={() => goToTablePage(tablePage - 1)}
              disabled={tablePage === 1 || loading}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs transition hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
            >
              Previous
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => goToTablePage(page)}
                disabled={loading}
                aria-current={
                  tablePage === page ? "page" : undefined
                }
                className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition ${
                  tablePage === page
                    ? "bg-orange-600 text-white"
                    : "border border-zinc-200 hover:border-orange-400 dark:border-zinc-700"
                }`}
              >
                {page}
              </button>
            ))}

            <span className="px-1 text-xs text-zinc-500">
              Page {tablePage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => goToTablePage(tablePage + 1)}
              disabled={tablePage === totalPages || loading}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs transition hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
            >
              Next
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
