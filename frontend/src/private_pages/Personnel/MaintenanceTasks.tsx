import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";
import Box from "../../components/Box";
import DataTable, { type DataTableColumn } from "../../components/DataTable";
import Notice from "../../components/Notice";
import StatusBadge from "../../components/StatusBadge";
import TablePagination from "../../components/TablePagination";
import TaskFilters from "../../components/Personnel/TaskFilters";
import UpdateTaskModal from "../../components/Personnel/UpdateTaskModal";
import {
  EMPTY_TASK_FILTERS,
  toPersonnelTask,
  type PersonnelTask,
  type PersonnelTasksResponse,
  type TaskFilterValues,
  type TaskStatus,
} from "../../components/Personnel/taskTypes";
import { getErrorInfo } from "../../utils/getErrorInfo";
import { formatDeadline, isPastDue } from "../../utils/formatDate";
import { useSignalREvent } from "../../utils/useSignalREvent";

const PAGE_SIZE = 10;
const BASE_URL = `${API_URLS.Personnel}/maintenance-tasks`;

type NoticeState = { type: "success" | "error"; message: string } | null;

export default function MaintenanceTasks() {
  const navigate = useNavigate();

  // Table data
  const [tasks, setTasks] = useState<PersonnelTask[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Filters: draft = what the inputs show, applied = what the table uses
  const [draft, setDraft] = useState<TaskFilterValues>(EMPTY_TASK_FILTERS);
  const [applied, setApplied] = useState<TaskFilterValues>(EMPTY_TASK_FILTERS);
  const [filterError, setFilterError] = useState("");

  // Update modal
  const [target, setTarget] = useState<PersonnelTask | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);

  // Background refreshes (real-time sync) shouldn't flash the loading state
  const silentRef = useRef(false);

  // =========================
  // FETCH TASKS
  // =========================
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const silent = silentRef.current;
      silentRef.current = false;
      if (!silent) setLoading(true);
      setListError("");

      try {
        const res = await axios.get<PersonnelTasksResponse>(BASE_URL, {
          withCredentials: true,
          params: {
            keyword: applied.keyword.trim() || undefined,
            description: applied.description.trim() || undefined,
            status: applied.status || undefined,
            startDate: applied.startDate || undefined,
            endDate: applied.endDate || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
        });
        if (cancelled) return;

        // The last page may disappear (e.g. after a filter change or a deletion)
        const pages = Math.max(1, res.data.total_pages ?? 1);
        if (page > pages) {
          setPage(pages);
          return;
        }

        setTasks((res.data.tasks ?? []).map(toPersonnelTask));
        setTotalTasks(res.data.total_tasks ?? 0);
        setTotalPages(pages);
      } catch (error) {
        if (cancelled) return;
        const info = getErrorInfo(error);
        if (info.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setListError(info.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, applied, reloadKey, navigate]);

  const refresh = () => setReloadKey((key) => key + 1);

  // Supervisor (or a co-assignee) changed something: quietly reload the list
  useSignalREvent("MaintenanceTasksUpdated", () => {
    silentRef.current = true;
    refresh();
  });

  // =========================
  // FILTERS
  // =========================
  function handleFilterChange(field: keyof TaskFilterValues, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSearch() {
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setFilterError("The start date cannot be later than the end date.");
      return;
    }
    setFilterError("");
    setPage(1);
    setApplied(draft);
  }

  function handleReset() {
    setDraft(EMPTY_TASK_FILTERS);
    setApplied(EMPTY_TASK_FILTERS);
    setFilterError("");
    setPage(1);
  }

  // =========================
  // UPDATE STATUS
  // =========================
  function openUpdate(task: PersonnelTask) {
    setSaveError("");
    setTarget(task);
  }

  const closeUpdate = useCallback(() => {
    setTarget(null);
    setSaveError("");
  }, []);

  async function saveStatus(status: TaskStatus) {
    if (!target) return;
    setSaving(true);
    setSaveError("");

    try {
      await axios.patch(`${BASE_URL}/${target.id}/status`, { status }, { withCredentials: true });
      setNotice({
        type: "success",
        message: `“${target.name}” was marked as ${status}.`,
      });
      setTarget(null);
      refresh();
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setSaveError(info.message);
      // 404: the task was removed or reassigned meanwhile, so show the fresh list
      if (info.status === 404) {
        silentRef.current = true;
        refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // TABLE
  // =========================
  const columns: DataTableColumn<PersonnelTask>[] = [
    {
      key: "name",
      header: "Task Name",
      cellClassName: "font-medium text-neutral-900 dark:text-neutral-50",
      render: (task) => task.name,
    },
    {
      key: "description",
      header: "Description",
      className: "max-w-xs",
      cellClassName: "text-neutral-600 dark:text-neutral-400",
      render: (task) => <span className="break-words">{task.description}</span>,
    },
    {
      key: "deadline",
      header: "Deadline",
      className: "whitespace-nowrap",
      render: (task) => {
        const overdue = task.status !== "Completed" && isPastDue(task.deadline);
        return (
          <span
            title={overdue ? "This task is past its deadline" : undefined}
            className={overdue ? "font-medium text-red-700 dark:text-red-400" : undefined}
          >
            {formatDeadline(task.deadline)}
          </span>
        );
      },
    },
    {
      key: "supervisor",
      header: "Supervisor",
      className: "whitespace-nowrap",
      render: (task) => task.supervisor,
    },
    {
      key: "status",
      header: "Status",
      render: (task) => <StatusBadge status={task.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (task) => (
        <button
          type="button"
          onClick={() => openUpdate(task)}
          aria-label={`Update ${task.name}`}
          className="cursor-pointer rounded-md bg-orange-600 px-4 py-2 text-xs font-semibold text-neutral-50 transition hover:bg-orange-700"
        >
          Update
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-full w-full space-y-5 text-neutral-800 dark:text-neutral-100">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Maintenance Tasks
        </h1>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Update the tasks assigned to you
        </p>
      </div>

      {notice && (
        <Notice
          type={notice.type}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}

      <TaskFilters
        values={draft}
        error={filterError}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <Box flush>
        <div className="flex items-center gap-3 px-6 py-5">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            Maintenance Tasks
          </h2>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={tasks}
          rowKey={(task) => task.id}
          loading={loading}
          error={listError}
          onRetry={refresh}
          emptyMessage="No maintenance tasks found."
        />

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalTasks}
          pageSize={PAGE_SIZE}
          itemLabel="tasks"
          disabled={loading}
          onPageChange={setPage}
        />
      </Box>

      {target && (
        <UpdateTaskModal
          key={target.id}
          task={target}
          saving={saving}
          error={saveError}
          onClose={closeUpdate}
          onSubmit={(status) => void saveStatus(status)}
        />
      )}
    </div>
  );
}
