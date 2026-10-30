
import { useEffect, useMemo, useState } from "react";
import {
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

function toPhilippineDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

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
  if (!dateString) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00+08:00`));
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function createQueryString(
  search: string,
  status: string,
  fromDate: string,
  toDate: string,
  page: number
) {
  const params = new URLSearchParams();

  if (search.trim()) params.set("keyword", search.trim());
  if (status !== "All Statuses") params.set("status", status);
  if (fromDate) params.set("startDate", fromDate);
  if (toDate) params.set("endDate", toDate);

  params.set("page", String(page));
  params.set("pageSize", String(API_PAGE_SIZE));

  return params.toString();
}

async function getApiError(response: Response) {
  const result = await response.json().catch(() => null);

  return (
    result?.detail ||
    result?.message ||
    result?.title ||
    `Request failed with status ${response.status}.`
  );
}

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
      headers: { Accept: "application/json" },
      signal,
    }
  );

  if (!firstResponse.ok) {
    throw new Error(await getApiError(firstResponse));
  }

  const firstPage =
    (await firstResponse.json()) as MaintenanceTasksResponse;

  let allTasks = [...firstPage.tasks];

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
            headers: { Accept: "application/json" },
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

function StatusBadge({ status }: { status: MaintenanceStatus }) {
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

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tablePage, setTablePage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

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

  const filteredTasks = tasks;

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - firstDay + 1;

      if (dayNumber < 1) {
        return {
          date: new Date(year, month - 1, previousMonthDays + dayNumber),
          current: false,
        };
      }

      if (dayNumber > daysInMonth) {
        return {
          date: new Date(year, month + 1, dayNumber - daysInMonth),
          current: false,
        };
      }

      return {
        date: new Date(year, month, dayNumber),
        current: true,
      };
    });
  }, [currentMonth]);

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

  function goToTablePage(page: number) {
    setTablePage(Math.min(Math.max(page, 1), totalPages));
  }

  return (
    <div className="min-h-full w-full text-neutral-900 dark:text-neutral-50">
      <main className="mx-auto w-full max-w-none space-y-4">

        {/* Page heading */}
        <section>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Maintenance Schedule
          </h1>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
            Monitor upcoming maintenance deadlines and task progress.
          </p>
        </section>

        {/* Search and filters */}
        <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1.5fr)_minmax(160px,1fr)_minmax(130px,0.7fr)_minmax(130px,0.7fr)_auto]">

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setTablePage(1);
                }}
                placeholder="Search maintenance task..."
                aria-label="Search maintenance tasks"
                className="h-10 w-full rounded-lg border border-neutral-300 bg-transparent pl-9 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus:ring-orange-950"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTablePage(1);
                }}
                aria-label="Filter by maintenance status"
                className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-transparent px-3 pr-9 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-50"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status}
                    value={status}
                    className="bg-neutral-50 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                  >
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
              />
            </div>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                const value = e.target.value;
                setFromDate(value);

                if (toDate && value && value > toDate) {
                  setToDate("");
                }

                setTablePage(1);
              }}
              aria-label="From date"
              title="From date"
              className="h-10 w-full min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-50 sm:px-3"
            />

            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => {
                setToDate(e.target.value);
                setTablePage(1);
              }}
              aria-label="To date"
              title="To date"
              className="h-10 w-full min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-50 sm:px-3"
            />

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-neutral-200 px-4 text-sm font-medium text-neutral-800 transition hover:bg-orange-100 hover:text-orange-800 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-orange-950 dark:hover:text-orange-300"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </section>

        {/* Schedule calendar */}
        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="p-3 sm:p-4">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                Schedule Calendar
              </h2>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] sm:text-xs">
                {(
                  [
                    "Completed",
                    "Scheduled",
                    "In Progress",
                    "Overdue",
                  ] as MaintenanceStatus[]
                ).map((status) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`}
                    />
                    <span className="text-neutral-600 dark:text-neutral-300">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2.5 py-1.5 text-xs font-medium text-orange-800 transition hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
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
                className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2.5 py-1.5 text-xs font-medium text-orange-800 transition hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <div className="min-w-[600px]">

                {/* Weekday headers: horizontal divider only */}
                <div className="grid grid-cols-7 divide-x divide-neutral-200 border-y border-neutral-200 bg-neutral-100 dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-700">
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
                      className="px-1 py-2 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-200"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar dates */}
                <div className="grid grid-cols-7 divide-x divide-neutral-200 dark:divide-neutral-700">
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
                        className={`min-h-[84px] border-b border-neutral-200 p-1.5 dark:border-neutral-700 sm:min-h-[94px] sm:p-2 ${
                          cell.current
                            ? "bg-neutral-50 dark:bg-neutral-800"
                            : "bg-neutral-100/70 dark:bg-neutral-900/40"
                        }`}
                      >
                        <span
                          className={`text-[11px] font-semibold ${
                            cell.current
                              ? "text-neutral-800 dark:text-neutral-200"
                              : "text-neutral-400 dark:text-neutral-500"
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
              <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Loading maintenance schedule...
              </p>
            )}
          </div>
        </section>

        {/* Maintenance tasks table */}
        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">

          <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
            <h2 className="text-lg font-bold">
              Maintenance Tasks
            </h2>

            <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-y border-neutral-200 dark:border-neutral-700">
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

              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {loading && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400"
                    >
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
                      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
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
                      className="transition hover:bg-orange-50/70 dark:hover:bg-neutral-700/60"
                    >
                      <td className="px-4 py-3 sm:px-6">
                        <span className="font-medium">
                          {task.name}
                        </span>
                      </td>
                      <td className="px-4 py-2 sm:px-6">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300 sm:px-6">
                        {formatDate(task.deadline)}
                      </td>
                    </tr>
                  ))}

                {!loading && !error && paginatedTasks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-neutral-500 dark:text-neutral-400">
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
                          className="mt-1 font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
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

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 p-3 dark:border-neutral-700 sm:p-4">
            <button
              type="button"
              onClick={() => goToTablePage(tablePage - 1)}
              disabled={tablePage === 1 || loading}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-xs transition hover:border-orange-400 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:hover:text-orange-300"
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
                aria-current={tablePage === page ? "page" : undefined}
                className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition ${
                  tablePage === page
                    ? "bg-orange-600 text-neutral-50"
                    : "border border-neutral-300 text-neutral-700 hover:border-orange-400 hover:text-orange-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:text-orange-300"
                }`}
              >
                {page}
              </button>
            ))}

            <span className="px-1 text-xs text-neutral-500 dark:text-neutral-400">
              Page {tablePage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => goToTablePage(tablePage + 1)}
              disabled={tablePage === totalPages || loading}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-xs transition hover:border-orange-400 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:hover:text-orange-300"
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
