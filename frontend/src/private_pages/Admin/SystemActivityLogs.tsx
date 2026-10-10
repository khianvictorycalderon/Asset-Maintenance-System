import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";
import { useSignalREvent } from "../../utils/useSignalREvent";

const PAGE_SIZE = 10;

type ActivityResult = "Success" | "Failed" | "Rejected";

type ActivityLog = {
  id: string;
  activity: string;
  performedBy?: string;
  ipAddress?: string;
  result: ActivityResult;
  datePerformed: string;
  timestamp: string;
  targetUser?: string;
  details?: string;
  isNew?: boolean;
};

// Shape returned by the backend
type ApiLog = {
  id: string;
  activity: string;
  performed_by: string | null;
  performed_by_user_id: string | null;
  target_user: string | null;
  result: ActivityResult;
  date_performed: string;
  timestamp: string; // UTC, ends in Z
  ip_address: string | null;
  details: string | null;
};

type LogsResponse = {
  message: string;
  logs: ApiLog[];
  total_logs: number;
  current_page: number;
  page_size: number;
  total_pages: number;
};

// Map the API log to the UI shape. Date and time are shown in the viewer's local time.
const toLog = (log: ApiLog): ActivityLog => {
  const date = new Date(log.timestamp);

  return {
    id: log.id,
    activity: log.activity,
    performedBy: log.performed_by ?? undefined,
    ipAddress: log.ip_address ?? undefined,
    result: log.result,
    datePerformed: date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    timestamp: date.toLocaleTimeString(undefined, { hour12: false }),
    targetUser: log.target_user ?? undefined,
    details: log.details ?? undefined,
  };
};

function ResultBadge({
  result,
}: {
  result: ActivityResult;
}) {
  const styles: Record<ActivityResult, string> = {
    Success:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    Failed:
      "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    Rejected:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[result]}`}
    >
      {result}
    </span>
  );
}

function PerformedBy({
  log,
}: {
  log: ActivityLog;
}) {
  if (log.performedBy) {
    return (
      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {log.performedBy}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        title="Unidentified actor"
        className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
      >
        <span className="text-neutral-400">?</span>
        {log.ipAddress || "Unknown IP"}
      </span>

      <span className="text-xs text-neutral-400 dark:text-neutral-500">
        Unidentified
      </span>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 text-sm dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-neutral-500 dark:text-neutral-400">
        Showing {start}–{end} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Previous
        </button>

        <span className="px-2 text-neutral-600 dark:text-neutral-300">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
        No activity logs found.
      </h3>

      <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
        System activity will appear here when actions are recorded.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse px-4 py-5"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-6 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.007M10.29 3.86l-7.4 12.82A2 2 0 004.62 19.68h14.76a2 2 0 001.73-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
        Unable to load activity logs
      </h3>

      <p className="mt-1 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
        Something went wrong while loading the system activity logs.
      </p>

      <button
        onClick={onRetry}
        className="mt-5 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
      >
        Retry
      </button>
    </div>
  );
}

export default function SystemActivityLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);

  const [newActivityCount, setNewActivityCount] = useState(0);

  const pageRef = useRef(1);
  const pageSizeRef = useRef(PAGE_SIZE);
  const totalRef = useRef(0);
  const seenIds = useRef<Set<string>>(new Set());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const fetchLogs = async (target: number) => {
    setLoading(true);
    setError(false);

    try {
      const response = await axios.get<LogsResponse>(
        `${API_URLS.Admin}/activity-logs?page=${target}&pageSize=${PAGE_SIZE}`,
        { withCredentials: true }
      );

      const data = response.data;

      // Backend returns newest first. Do not reorder.
      setLogs(data.logs.map(toLog));
      setTotalItems(data.total_logs);
      setPageSize(data.page_size);
      setTotalPages(Math.max(1, data.total_pages));
      setPage(data.current_page);
      setNewActivityCount(0);
      pageRef.current = data.current_page;
      pageSizeRef.current = data.page_size;
      totalRef.current = data.total_logs;
      seenIds.current = new Set(data.logs.map((l) => l.id));
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => fetchLogs(page);

    // Live updates: listen only, never send
  useSignalREvent<[ApiLog]>("ActivityLogCreated", (apiLog) => {
    // Ignore duplicates
    if (seenIds.current.has(apiLog.id)) return;
    seenIds.current.add(apiLog.id);

    totalRef.current += 1;
    setTotalItems(totalRef.current);
    setTotalPages(
      Math.max(1, Math.ceil(totalRef.current / pageSizeRef.current))
    );

    // Other pages: update the totals and show a notice only
    if (pageRef.current !== 1) {
      setNewActivityCount((count) => count + 1);
      return;
    }

    // Page 1: prepend, keep the page size, highlight the new row
    const log = { ...toLog(apiLog), isNew: true };

    setLogs((current) => [log, ...current].slice(0, pageSizeRef.current));

    const timer = window.setTimeout(() => {
      setLogs((current) =>
        current.map((l) => (l.id === log.id ? { ...l, isNew: false } : l))
      );
    }, 4000);

    timers.current.push(timer);
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          System Activity Logs
        </h1>

        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Monitor actions and events performed within the system.
        </p>
      </div>
      
      {newActivityCount > 0 && page !== 1 && (
        <div className="flex items-center justify-between rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300">
          <span>New activity ({newActivityCount}) is available on page 1.</span>

          <button
            onClick={() => fetchLogs(1)}
            className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700"
          >
            Go to page 1
          </button>
        </div>
      )}

      {/* Activity table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={retry} />
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full text-left">

                <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/70">
                  <tr>
                    <th className="w-10 px-4 py-3" />

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Activity
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Performed By
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Result
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Date Performed
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Timestamp
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">

                  {logs.map((log) => {
                    const expanded =
                      expandedId === log.id;

                    return (
                      <tr
                        key={log.id}
                        className={`transition ${
                          log.isNew
                            ? "bg-yellow-50/80 dark:bg-yellow-950/20"
                            : "hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                        }`}
                      >
                        <td className="px-4 py-4 align-top">
                          <button
                            onClick={() =>
                              setExpandedId(
                                expanded
                                  ? null
                                  : log.id
                              )
                            }
                            title={
                              expanded
                                ? "Hide details"
                                : "Show details"
                            }
                            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-neutral-700 dark:hover:text-white"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 transition-transform ${
                                expanded
                                  ? "rotate-90"
                                  : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {log.activity}
                            </span>

                            {log.isNew && (
                              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                                New
                              </span>
                            )}
                          </div>

                          {expanded && (
                            <div className="mt-3 max-w-lg rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                              {log.targetUser && (
                                <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
                                  <span className="font-semibold">
                                    Target:
                                  </span>{" "}
                                  {log.targetUser}
                                </p>
                              )}

                              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                {log.details ||
                                  "No additional details available."}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <PerformedBy log={log} />
                        </td>

                        <td className="px-4 py-4 align-top">
                          <ResultBadge result={log.result} />
                        </td>

                        <td className="px-4 py-4 align-top text-sm text-neutral-600 dark:text-neutral-300">
                          {log.datePerformed}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="font-mono text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
                            {log.timestamp}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                </tbody>

              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => fetchLogs(p)}
            />
          </>
        )}

      </div>

    </div>
  );
}
