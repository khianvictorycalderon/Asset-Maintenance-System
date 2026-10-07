import { useState } from "react";
import Pagination from "../components/Pagination";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Toast from "../components/Toast";

type ResultType = "Success" | "Failed" | "Rejected";

interface ActivityLog {
  id: number;
  activity: string;
  performedBy: {
    type: "user" | "unidentified";
    name?: string;
    ip?: string;
  };
  result: ResultType;
  date: string;
  timestamp: string;
  targetUser?: string;
  details?: string;
  isNew?: boolean;
}

const AdminActivityLogs = () => {
  // =========================
  // ACTIVITY LOGS
  // =========================
  const [logs] = useState<ActivityLog[]>([
    {
      id: 1,
      activity: "Update user role",
      performedBy: {
        type: "user",
        name: "Shino Amano",
      },
      result: "Success",
      date: "October 4, 2026",
      timestamp: "16:42:18",
      targetUser: "Jane Doe",
      details:
        "Changed role of Jane Doe from Employee to Supervisor.",
    },

    {
      id: 2,
      activity: "Fetch all users",
      performedBy: {
        type: "user",
        name: "Shino Amano",
      },
      result: "Success",
      date: "October 4, 2026",
      timestamp: "16:38:04",
      details:
        "Retrieved the complete list of registered users.",
    },

    {
      id: 3,
      activity: "Revoke user access",
      performedBy: {
        type: "user",
        name: "Shino Amano",
      },
      result: "Failed",
      date: "October 4, 2026",
      timestamp: "16:31:27",
      targetUser: "Pedro Reyes",
      details:
        "The system failed to revoke access because the request could not be completed.",
    },

    {
      id: 4,
      activity: "Update user role",
      performedBy: {
        type: "unidentified",
        ip: "192.168.1.25",
      },
      result: "Rejected",
      date: "October 4, 2026",
      timestamp: "16:24:51",
      targetUser: "Maria Santos",
      details:
        "The request was rejected because the actor could not be identified.",
    },

    {
      id: 5,
      activity: "Change password",
      performedBy: {
        type: "user",
        name: "Shino Amano",
      },
      result: "Success",
      date: "October 4, 2026",
      timestamp: "16:18:09",
      targetUser: "Juan Cruz",
      details:
        "Password was successfully changed for the selected user.",
      isNew: true,
    },
  ]);

  // =========================
  // LOADING / ERROR STATE
  // =========================
  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // =========================
  // TOAST
  // =========================
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // =========================
  // EXPANDED ROW
  // =========================
  const [expandedId, setExpandedId] =
    useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedId(
      expandedId === id ? null : id
    );
  };

  // =========================
  // RETRY
  // =========================
  const handleRetry = () => {
    setErrorMessage("");
    setIsLoading(true);

    // Temporary loading simulation.
    // Replace this with the backend request later.
    setTimeout(() => {
      setIsLoading(false);

      setToast({
        type: "success",
        message: "Activity logs loaded successfully.",
      });
    }, 800);
  };

  // =========================
  // PAGINATION
  // =========================
  const [currentPage, setCurrentPage] = useState(1);

  // Temporary values
  // These will come from the backend later.
  const totalItems = 93;
  const itemsPerPage = 10;
  const totalPages = 10;

  // =========================
  // RESULT BADGE STYLE
  // =========================
  const getResultStyle = (
    result: ResultType
  ) => {
    switch (result) {
      case "Success":
        return "bg-green-500/15 text-green-400 border border-green-500/30";

      case "Failed":
        return "bg-red-500/15 text-red-400 border border-red-500/30";

      case "Rejected":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";

      default:
        return "bg-gray-500/15 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#1d1d1d] p-6 text-white">

      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="mb-6">

        <h1 className="text-2xl font-bold">
          System Activity Logs
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Monitor system activities, actions, and administrative events.
        </p>

      </div>

      {/* =========================
          ACTIVITY LOG CARD
      ========================= */}
      <div className="overflow-hidden rounded-xl border border-gray-700 bg-[#242424]">

        {/* =========================
            TABLE
        ========================= */}
        <div className="overflow-x-auto">

          <table className="min-w-[1100px] w-full">

            {/* TABLE HEADER */}
            <thead className="border-b border-gray-700 bg-[#191919]">

              <tr>

                <th className="w-10 px-4 py-4"></th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Activity
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Performed By
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Result
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Date Performed
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Timestamp
                </th>

              </tr>

            </thead>

            {/* =========================
                TABLE BODY
            ========================= */}
            <tbody className="divide-y divide-gray-700">

              {/* LOADING */}
              {isLoading ? (

                <tr>

                  <td colSpan={6}>

                    <LoadingState />

                  </td>

                </tr>

              ) : errorMessage ? (

                /* ERROR */
                <tr>

                  <td colSpan={6}>

                    <ErrorState
                      message={errorMessage}
                      onRetry={handleRetry}
                    />

                  </td>

                </tr>

              ) : logs.length === 0 ? (

                /* EMPTY */
                <tr>

                  <td colSpan={6}>

                    <EmptyState
                      message="No activity logs found."
                    />

                  </td>

                </tr>

              ) : (

                /* LOGS */
                logs.map((log) => {

                  const isExpanded =
                    expandedId === log.id;

                  return (
                    <>
                      {/* =========================
                          MAIN LOG ROW
                      ========================= */}
                      <tr
                        key={log.id}
                        className={`
                          transition-colors duration-1000
                          hover:bg-[#2b2b2b]

                          ${
                            log.isNew
                              ? "bg-amber-500/10"
                              : ""
                          }
                        `}
                      >

                        {/* EXPAND BUTTON */}
                        <td className="px-4 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              toggleRow(log.id)
                            }
                            title="View activity details"
                            className="
                              flex h-7 w-7
                              items-center justify-center
                              rounded-md
                              border border-gray-600
                              text-gray-300
                              transition
                              hover:bg-gray-700
                              hover:text-white
                            "
                          >

                            <span
                              className={`
                                text-sm
                                transition-transform

                                ${
                                  isExpanded
                                    ? "rotate-90"
                                    : ""
                                }
                              `}
                            >
                              ›
                            </span>

                          </button>

                        </td>

                        {/* ACTIVITY */}
                        <td className="px-5 py-4">

                          <span className="text-sm font-medium text-white">
                            {log.activity}
                          </span>

                        </td>

                        {/* PERFORMED BY */}
                        <td className="px-5 py-4">

                          {log.performedBy.type ===
                          "user" ? (

                            <div className="flex items-center gap-2">

                              <div
                                className="
                                  flex h-8 w-8
                                  items-center justify-center
                                  rounded-full
                                  bg-blue-500/15
                                  text-xs font-semibold
                                  text-blue-400
                                "
                              >
                                {log.performedBy.name
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span className="text-sm text-gray-200">
                                {log.performedBy.name}
                              </span>

                            </div>

                          ) : (

                            <div className="flex items-center gap-2">

                              <div
                                className="
                                  flex h-8 w-8
                                  items-center justify-center
                                  rounded-full
                                  bg-amber-500/10
                                  text-amber-400
                                "
                              >
                                ?
                              </div>

                              <div>

                                <div
                                  className="
                                    inline-flex
                                    items-center
                                    rounded-md
                                    border
                                    border-gray-600
                                    bg-[#191919]
                                    px-2 py-1
                                    font-mono
                                    text-xs
                                    text-gray-300
                                  "
                                >
                                  {log.performedBy.ip}
                                </div>

                                <div
                                  className="
                                    mt-1
                                    text-[11px]
                                    text-amber-400
                                  "
                                >
                                  Unidentified
                                </div>

                              </div>

                            </div>

                          )}

                        </td>

                        {/* RESULT */}
                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex
                              rounded-md
                              px-2.5 py-1
                              text-xs font-medium
                              ${getResultStyle(
                                log.result
                              )}
                            `}
                          >
                            {log.result}
                          </span>

                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4 text-sm text-gray-300">
                          {log.date}
                        </td>

                        {/* TIMESTAMP */}
                        <td className="px-5 py-4">

                          <span
                            className="
                              font-mono
                              tabular-nums
                              text-sm
                              text-gray-300
                            "
                          >
                            {log.timestamp}
                          </span>

                        </td>

                      </tr>

                      {/* =========================
                          EXPANDED DETAILS
                      ========================= */}
                      {isExpanded && (

                        <tr
                          key={`${log.id}-details`}
                          className="bg-[#1b1b1b]"
                        >

                          <td
                            colSpan={6}
                            className="px-14 py-4"
                          >

                            <div
                              className="
                                rounded-lg
                                border border-gray-700
                                bg-[#202020]
                                p-4
                              "
                            >

                              <div className="grid gap-4 sm:grid-cols-2">

                                {/* TARGET USER */}
                                <div>

                                  <p
                                    className="
                                      mb-1
                                      text-xs
                                      font-medium
                                      uppercase
                                      tracking-wide
                                      text-gray-500
                                    "
                                  >
                                    Target User
                                  </p>

                                  <p className="text-sm text-gray-200">
                                    {log.targetUser ||
                                      "—"}
                                  </p>

                                </div>

                                {/* ACTIVITY */}
                                <div>

                                  <p
                                    className="
                                      mb-1
                                      text-xs
                                      font-medium
                                      uppercase
                                      tracking-wide
                                      text-gray-500
                                    "
                                  >
                                    Activity
                                  </p>

                                  <p className="text-sm text-gray-200">
                                    {log.activity}
                                  </p>

                                </div>

                              </div>

                              {/* DETAILS */}
                              <div className="mt-4">

                                <p
                                  className="
                                    mb-1
                                    text-xs
                                    font-medium
                                    uppercase
                                    tracking-wide
                                    text-gray-500
                                  "
                                >
                                  Details
                                </p>

                                <p
                                  className="
                                    max-w-4xl
                                    text-sm
                                    leading-6
                                    text-gray-300
                                  "
                                >
                                  {log.details ||
                                    "No additional details."}
                                </p>

                              </div>

                            </div>

                          </td>

                        </tr>

                      )}

                    </>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}
        {!isLoading &&
          !errorMessage &&
          logs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}

      </div>

      {/* =========================
          LEGEND
      ========================= */}
      <div className="mt-6 flex flex-wrap gap-4">

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-green-400"></span>
          Success
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-red-400"></span>
          Failed
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
          Rejected
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-amber-200"></span>
          New activity
        </div>

      </div>

      {/* =========================
          TOAST
      ========================= */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};

export default AdminActivityLogs;