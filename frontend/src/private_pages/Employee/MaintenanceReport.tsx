import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  RefreshCw,
  Search,
} from "lucide-react";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";

type ReportStatus = "Pending" | "In Progress" | "Completed" | "Overdue";
type Preset = "all" | "year" | "q1" | "q2" | "q3" | "q4" | "last30" | "custom";

type ReportTask = {
  id: string;
  name: string;
  description: string;
  status: ReportStatus;
  personnel_names: string[];
  supervisor_name: string;
  assigned_at: string;
  due_at: string;
  updated_at: string;
};

type ReportResponse = {
  tasks: ReportTask[];
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  current_page: number;
  page_size: number;
  total_pages: number;
};

type Filters = {
  keyword: string;
  status: string;
  startDate: string;
  endDate: string;
};

type ErrorInfo = { message: string; status?: number };

const BASE_URL = `${API_URLS.Employee}/maintenance-report`;
const PAGE_SIZE = 10;
const ALL_FILTERS: Filters = { keyword: "", status: "", startDate: "", endDate: "" };

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:focus:ring-orange-950";
const labelClass = "mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700";

function getErrorInfo(error: unknown): ErrorInfo {
  if (!axios.isAxiosError(error)) return { message: "Something went wrong." };
  if (!error.response) return { message: "Can't reach the server." };
  const status = error.response.status;
  const data = error.response.data;
  if (status === 401) return { message: "Your session has expired.", status };
  if (status === 403) {
    return { message: "You don't have permission to view this report.", status };
  }
  if (status >= 500) return { message: "Server error. Please try again.", status };
  return {
    message: data?.message ?? data?.detail ?? data?.title ?? "Something went wrong.",
    status,
  };
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateRangeForPreset(preset: Preset, year: number) {
  if (preset === "all" || preset === "custom") return { startDate: "", endDate: "" };
  if (preset === "year") return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  if (preset === "last30") {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return { startDate: localDateString(start), endDate: localDateString(end) };
  }

  const quarter = Number(preset.slice(1));
  const firstMonth = (quarter - 1) * 3;
  const start = new Date(year, firstMonth, 1);
  const end = new Date(year, firstMonth + 3, 0);
  return { startDate: localDateString(start), endDate: localDateString(end) };
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function statusStyle(status: ReportStatus) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    case "In Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "Overdue":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    default:
      return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
  }
}

export default function MaintenanceReport() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Filters>(ALL_FILTERS);
  const [applied, setApplied] = useState<Filters>(ALL_FILTERS);
  const [preset, setPreset] = useState<Preset>("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    axios
      .get<ReportResponse>(BASE_URL, {
        withCredentials: true,
        params: {
          keyword: applied.keyword.trim() || undefined,
          status: applied.status || undefined,
          startDate: applied.startDate || undefined,
          endDate: applied.endDate || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        if (cancelled) return;
        const pages = Math.max(1, data.total_pages ?? 1);
        if (page > pages) {
          setPage(pages);
          return;
        }
        setReport(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        const info = getErrorInfo(cause);
        if (info.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(info.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applied, navigate, page, reloadKey]);

  function choosePreset(value: Preset) {
    setPreset(value);
    if (value !== "custom") {
      setDraft((current) => ({ ...current, ...dateRangeForPreset(value, year) }));
    }
  }

  function changeYear(value: number) {
    setYear(value);
    if (preset !== "custom" && preset !== "all" && preset !== "last30") {
      setDraft((current) => ({ ...current, ...dateRangeForPreset(preset, value) }));
    }
  }

  function applyFilters() {
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setActionMessage("The start date must be on or before the end date.");
      return;
    }
    setActionMessage("");
    setPage(1);
    setApplied({ ...draft, keyword: draft.keyword.trim() });
  }

  function clearFilters() {
    setDraft(ALL_FILTERS);
    setApplied(ALL_FILTERS);
    setPreset("all");
    setPage(1);
    setActionMessage("");
  }

  function quickStatusFilter(status: string) {
    setDraft((current) => ({ ...current, status }));
    setApplied((current) => ({ ...current, status }));
    setPage(1);
  }

  async function downloadCsv() {
    if (downloading) return;
    setDownloading(true);
    setActionMessage("");
    try {
      const params = {
        keyword: applied.keyword.trim() || undefined,
        status: applied.status || undefined,
        startDate: applied.startDate || undefined,
        endDate: applied.endDate || undefined,
        pageSize: 100,
      };
      const allTasks: ReportTask[] = [];
      const firstPage = await axios.get<ReportResponse>(BASE_URL, {
        withCredentials: true,
        params: { ...params, page: 1 },
      });
      allTasks.push(...(firstPage.data.tasks ?? []));
      for (let currentPage = 2; currentPage <= firstPage.data.total_pages; currentPage += 1) {
        const response = await axios.get<ReportResponse>(BASE_URL, {
          withCredentials: true,
          params: { ...params, page: currentPage },
        });
        allTasks.push(...(response.data.tasks ?? []));
      }

      const rows = [
        [
          "Task",
          "Description",
          "Status",
          "Assigned Personnel",
          "Supervisor",
          "Date Assigned",
          "Due Date",
          "Last Updated",
          "Task ID",
        ],
        ...allTasks.map((task) => [
          task.name,
          task.description,
          task.status,
          task.personnel_names.join("; "),
          task.supervisor_name,
          task.assigned_at,
          task.due_at,
          task.updated_at,
          task.id,
        ]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      const dateLabel = applied.startDate || applied.endDate
        ? `${applied.startDate || "beginning"}_to_${applied.endDate || "today"}`
        : "all-time";
      link.href = url;
      link.download = `maintenance-report_${dateLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setActionMessage(`${allTasks.length} report ${allTasks.length === 1 ? "row" : "rows"} exported.`);
    } catch (cause) {
      const info = getErrorInfo(cause);
      if (info.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setActionMessage(info.message);
    } finally {
      setDownloading(false);
    }
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, index) => currentYear - index);
  const metrics = [
    { label: "Total tasks", count: report?.total_tasks ?? 0, filter: "", tone: "text-neutral-900 dark:text-neutral-50" },
    { label: "Completed", count: report?.completed_tasks ?? 0, filter: "Completed", tone: "text-green-700 dark:text-green-300" },
    { label: "In progress", count: report?.in_progress_tasks ?? 0, filter: "In Progress", tone: "text-blue-700 dark:text-blue-300" },
    { label: "Pending", count: report?.pending_tasks ?? 0, filter: "Pending", tone: "text-orange-700 dark:text-orange-300" },
    { label: "Overdue", count: report?.overdue_tasks ?? 0, filter: "Overdue", tone: "text-red-700 dark:text-red-300" },
  ];

  return (
    <div className="space-y-6 text-neutral-800 dark:text-neutral-100">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Maintenance Report</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Review task progress, assignments, and due dates across your maintenance teams.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-neutral-50 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={downloadCsv}
            disabled={downloading || loading}
          >
            <Download size={16} />
            {downloading ? "Preparing CSV..." : "Download CSV"}
          </button>
        </div>
      </header>

      <section className="rounded-xl bg-neutral-50 p-5 shadow-sm dark:bg-neutral-800">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-orange-600 dark:text-orange-400" />
          <h2 className="font-semibold">Search and filter report</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="sm:col-span-2 xl:col-span-2">
            <label className={labelClass} htmlFor="report-keyword">Search</label>
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="report-keyword"
                className={`${inputClass} pl-10`}
                placeholder="Task, personnel, or supervisor"
                value={draft.keyword}
                onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="report-status">Status</label>
            <select
              id="report-status"
              className={inputClass}
              value={draft.status}
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="report-period">Report period</label>
            <select
              id="report-period"
              className={inputClass}
              value={preset}
              onChange={(event) => choosePreset(event.target.value as Preset)}
            >
              <option value="all">All time</option>
              <option value="year">Full year</option>
              <option value="q1">Quarter 1 (Jan–Mar)</option>
              <option value="q2">Quarter 2 (Apr–Jun)</option>
              <option value="q3">Quarter 3 (Jul–Sep)</option>
              <option value="q4">Quarter 4 (Oct–Dec)</option>
              <option value="last30">Last 30 days</option>
              <option value="custom">Custom date range</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="report-year">Year</label>
            <select
              id="report-year"
              className={inputClass}
              value={year}
              disabled={preset === "all" || preset === "last30" || preset === "custom"}
              onChange={(event) => changeYear(Number(event.target.value))}
            >
              {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="report-start">From</label>
            <input
              id="report-start"
              className={inputClass}
              type="date"
              value={draft.startDate}
              onChange={(event) => {
                setPreset("custom");
                setDraft((current) => ({ ...current, startDate: event.target.value }));
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="report-end">To</label>
            <input
              id="report-end"
              className={inputClass}
              type="date"
              value={draft.endDate}
              onChange={(event) => {
                setPreset("custom");
                setDraft((current) => ({ ...current, endDate: event.target.value }));
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Date range uses the task creation date. Quarter presets follow the selected year.
          </p>
          <div className="flex gap-2">
            <button type="button" className={secondaryButtonClass} onClick={clearFilters}>
              Clear
            </button>
            <button
              type="button"
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-neutral-50 transition hover:bg-orange-700"
              onClick={applyFilters}
            >
              Apply filters
            </button>
          </div>
        </div>
      </section>

      {actionMessage && (
        <p role="status" className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200">
          {actionMessage}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Report summary">
        {metrics.map((metric) => (
          <button
            type="button"
            key={metric.label}
            onClick={() => quickStatusFilter(metric.filter)}
            className={`rounded-xl bg-neutral-50 p-4 text-left shadow-sm transition hover:ring-1 hover:ring-orange-300 dark:bg-neutral-800 dark:hover:ring-orange-700 ${
              applied.status === metric.filter ? "ring-2 ring-orange-500" : ""
            }`}
          >
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{metric.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${metric.tone}`}>{metric.count}</p>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl bg-neutral-50 shadow-sm dark:bg-neutral-800">
        <div className="flex flex-col gap-2 border-b border-neutral-200 px-5 py-4 dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Maintenance tasks</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {report?.total_tasks ?? 0} matching {report?.total_tasks === 1 ? "task" : "tasks"}
            </p>
          </div>
          {report && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Page {report.current_page} of {report.total_pages}
            </p>
          )}
        </div>

        {error ? (
          <div className="px-5 py-12 text-center">
            <p className="font-medium text-red-700 dark:text-red-300">{error}</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-orange-700 hover:underline dark:text-orange-400"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-3 px-5 py-14 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-orange-600 dark:border-neutral-600 dark:border-t-orange-400" />
            Loading maintenance report...
          </div>
        ) : !report?.tasks.length ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <FileText size={28} className="text-neutral-400" />
            <p className="mt-3 font-medium">No maintenance tasks found</p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Try another date range or clear some filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-700/70 dark:text-neutral-300">
                  <tr>
                    <th className="px-5 py-3 font-medium">Task</th>
                    <th className="px-5 py-3 font-medium">Personnel</th>
                    <th className="px-5 py-3 font-medium">Supervisor</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Assigned</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium">Last updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {report.tasks.map((task) => (
                    <tr key={task.id} className="align-top transition hover:bg-neutral-100/70 dark:hover:bg-neutral-700/40">
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{task.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">{task.description}</p>
                      </td>
                      <td className="px-5 py-4 text-neutral-700 dark:text-neutral-300">
                        {task.personnel_names.length ? task.personnel_names.join(", ") : "Unassigned"}
                      </td>
                      <td className="px-5 py-4 text-neutral-700 dark:text-neutral-300">{task.supervisor_name}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-neutral-600 dark:text-neutral-300">{formatDate(task.assigned_at)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-neutral-600 dark:text-neutral-300">{formatDate(task.due_at)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-neutral-600 dark:text-neutral-300">{formatDate(task.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, report.total_tasks)} of {report.total_tasks}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || loading}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => setPage((current) => Math.min(report.total_pages, current + 1))}
                  disabled={page >= report.total_pages || loading}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
