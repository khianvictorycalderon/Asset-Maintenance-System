import axios from "axios";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";

type TaskStatus = "Pending" | "In Progress" | "Completed";

type PersonnelOption = {
  id: string;
  full_name: string;
  email: string;
};

type ApiTaskAssignee = { id: string; full_name: string };

type ApiTask = {
  id: string;
  name: string;
  description: string;
  due_at: string;
  status: TaskStatus;
  assigned_by_id: string | null;
  assigned_by: string | null;
  assignees: ApiTaskAssignee[];
  created_at: string;
};

type TasksResponse = {
  tasks: ApiTask[];
  total_tasks: number;
  total_pages: number;
};

type TaskForm = {
  name: string;
  description: string;
  dueAt: string;
  personnelIds: string[];
  status: TaskStatus;
};

type TaskFilters = {
  keyword: string;
  status: string;
  personnelId: string;
  startDate: string;
  endDate: string;
};

const BASE_URL = `${API_URLS.Supervisor}/maintenance-tasks`;
const PAGE_SIZE = 5;
const STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];
const EMPTY_FORM: TaskForm = {
  name: "",
  description: "",
  dueAt: "",
  personnelIds: [],
  status: "Pending",
};
const EMPTY_FILTERS: TaskFilters = {
  keyword: "",
  status: "",
  personnelId: "",
  startDate: "",
  endDate: "",
};

const fieldClass =
  "w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:focus:ring-orange-950";
const labelClass = "mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300";

function getErrorInfo(error: unknown) {
  if (!axios.isAxiosError(error)) return { message: "Something went wrong.", status: undefined };
  if (!error.response) return { message: "Can't reach the server.", status: undefined };
  const { status, data } = error.response;
  if (status === 401) return { message: "Your session has expired.", status };
  if (status === 403) return { message: "You don't have permission to perform this action.", status };
  if (status >= 500) return { message: "Server error. Please try again.", status };
  return {
    message: data?.message ?? data?.detail ?? data?.title ?? "Something went wrong.",
    status,
  };
}

function formatDeadline(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function statusStyle(status: TaskStatus) {
  if (status === "Completed")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (status === "In Progress")
    return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
}

function PersonnelPicker({
  personnel,
  selected,
  onChange,
  disabled = false,
}: {
  personnel: PersonnelOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const visiblePersonnel = personnel.filter((person) =>
    `${person.full_name} ${person.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`${fieldClass} flex min-h-[42px] items-center justify-between gap-2 text-left`}
      >
        <span className="truncate text-gray-500 dark:text-gray-300">
          {selected.length ? `${selected.length} selected` : "Select personnel"}
        </span>
        <ChevronDown size={16} className="shrink-0" />
      </button>
      {selected.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {selected.map((id) => {
            const person = personnel.find((option) => option.id === id);
            return person ? (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-800 dark:bg-orange-950 dark:text-orange-200"
              >
                {person.full_name}
                <button
                  type="button"
                  aria-label={`Remove ${person.full_name}`}
                  onClick={() => toggle(id)}
                  disabled={disabled}
                  className="rounded-full hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-neutral-200 bg-neutral-50 p-2 shadow-xl dark:border-neutral-600 dark:bg-neutral-800">
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search personnel..."
            className={`${fieldClass} mb-2 py-2`}
          />
          <div className="max-h-52 overflow-y-auto">
            {visiblePersonnel.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm text-gray-500">
                {personnel.length ? "No matching personnel." : "No personnel are assigned to you yet."}
              </p>
            ) : (
              visiblePersonnel.map((person) => {
                const checked = selected.includes(person.id);
                return (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => toggle(person.id)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-orange-50 dark:hover:bg-neutral-800"
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded border ${
                        checked
                          ? "border-orange-600 bg-orange-600 text-white"
                          : "border-gray-300 dark:border-neutral-600"
                      }`}
                    >
                      {checked && <Check size={12} />}
                    </span>
                    <span>
                      <span className="block font-medium">{person.full_name}</span>
                      <span className="text-xs text-gray-500">{person.email}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenanceAssignment() {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<PersonnelOption[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editTarget, setEditTarget] = useState<ApiTask | null>(null);
  const [editForm, setEditForm] = useState<TaskForm>(EMPTY_FORM);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiTask | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [searchDraft, setSearchDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [personnelDraft, setPersonnelDraft] = useState("");
  const [startDateDraft, setStartDateDraft] = useState("");
  const [endDateDraft, setEndDateDraft] = useState("");
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);

  const refresh = () => setRefreshKey((key) => key + 1);
  const showNotice = (message: string, isError = false) => {
    setNotice(message);
    setNoticeIsError(isError);
  };

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${BASE_URL}/personnel-options`, { withCredentials: true })
      .then((response) => {
        if (!cancelled) setPersonnel(response.data.personnel ?? []);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const info = getErrorInfo(error);
        if (info.status === 401) navigate("/login", { replace: true });
        else showNotice(info.message, true);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setListError("");
      try {
        const response = await axios.get<TasksResponse>(BASE_URL, {
          withCredentials: true,
          params: {
            keyword: filters.keyword.trim() || undefined,
            status: filters.status || undefined,
            personnelId: filters.personnelId || undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
        });
        if (cancelled) return;
        const pages = Math.max(1, response.data.total_pages ?? 1);
        if (page > pages) {
          setPage(pages);
          return;
        }
        setTasks(response.data.tasks ?? []);
        setTotalTasks(response.data.total_tasks ?? 0);
        setTotalPages(pages);
      } catch (error) {
        if (cancelled) return;
        const info = getErrorInfo(error);
        if (info.status === 401) navigate("/login", { replace: true });
        else setListError(info.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters, navigate, page, refreshKey]);

  async function saveTask(event: FormEvent<HTMLFormElement>, editing = false) {
    event.preventDefault();
    const currentForm = editing ? editForm : form;
    const setError = editing ? setEditError : setFormError;
    const setSaving = editing ? setEditSaving : setSubmitting;
    if (currentForm.personnelIds.length === 0) {
      setError("Select at least one personnel member.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: currentForm.name.trim(),
        description: currentForm.description.trim(),
        due_at: new Date(currentForm.dueAt).toISOString(),
        personnel_ids: currentForm.personnelIds,
        status: currentForm.status,
      };
      if (editing && editTarget) {
        await axios.put(`${BASE_URL}/${editTarget.id}`, payload, { withCredentials: true });
        setEditTarget(null);
        showNotice("Maintenance task updated successfully.");
      } else {
        await axios.post(BASE_URL, payload, { withCredentials: true });
        setForm(EMPTY_FORM);
        showNotice("Maintenance task created successfully.");
      }
      setPage(1);
      refresh();
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 401) navigate("/login", { replace: true });
      else setError(info.message);
    } finally {
      setSaving(false);
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({
      keyword: searchDraft,
      status: statusDraft,
      personnelId: personnelDraft,
      startDate: startDateDraft,
      endDate: endDateDraft,
    });
    setPage(1);
  }

  function resetFilters() {
    setSearchDraft("");
    setStatusDraft("");
    setPersonnelDraft("");
    setStartDateDraft("");
    setEndDateDraft("");
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function startEditing(task: ApiTask) {
    setEditTarget(task);
    setEditForm({
      name: task.name,
      description: task.description,
      dueAt: toLocalDateTime(task.due_at),
      personnelIds: task.assignees.map((assignee) => assignee.id),
      status: task.status,
    });
    setEditError("");
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await axios.delete(`${BASE_URL}/${deleteTarget.id}`, { withCredentials: true });
      setDeleteTarget(null);
      showNotice("Maintenance task deleted successfully.");
      refresh();
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 401) navigate("/login", { replace: true });
      else setDeleteError(info.message);
    } finally {
      setDeleting(false);
    }
  }

  const updateForm = (editing: boolean, field: keyof TaskForm, value: string | string[]) => {
    const setter = editing ? setEditForm : setForm;
    setter((current) => ({ ...current, [field]: value }));
  };

  function TaskFields(editing = false) {
    const currentForm = editing ? editForm : form;
    const update = (field: keyof TaskForm, value: string | string[]) =>
      updateForm(editing, field, value);
    return (
      <>
        <div className="grid gap-4 md:grid-cols-[1fr_1.8fr_1fr_1.4fr]">
          <div>
            <label className={labelClass} htmlFor={`${editing ? "edit-" : ""}task-name`}>Task Name</label>
            <input
              id={`${editing ? "edit-" : ""}task-name`}
              className={fieldClass}
              value={currentForm.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Enter task name"
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${editing ? "edit-" : ""}task-description`}>Task Description</label>
            <textarea
              id={`${editing ? "edit-" : ""}task-description`}
              className={`${fieldClass} min-h-[42px] resize-y`}
              value={currentForm.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Enter task description"
              maxLength={100}
              required
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {currentForm.description.length}/100
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor={`${editing ? "edit-" : ""}task-deadline`}>Task Deadline</label>
            <input
              id={`${editing ? "edit-" : ""}task-deadline`}
              className={fieldClass}
              type="datetime-local"
              value={currentForm.dueAt}
              onChange={(event) => update("dueAt", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Assign To</label>
            <PersonnelPicker
              personnel={personnel}
              selected={currentForm.personnelIds}
              onChange={(ids) => update("personnelIds", ids)}
            />
          </div>
        </div>
        {editing && (
          <div className="max-w-xs">
            <label className={labelClass} htmlFor="edit-task-status">Status</label>
            <select
              id="edit-task-status"
              className={fieldClass}
              value={currentForm.status}
              onChange={(event) => update("status", event.target.value as TaskStatus)}
            >
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        )}
      </>
    );
  }

  const firstItem = totalTasks === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, totalTasks);

  return (
    <main className="min-h-full w-full text-gray-900 dark:text-gray-100">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Assignment</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create and manage tasks assigned to the personnel you supervise.
        </p>
      </header>

      {notice && (
        <div
          role={noticeIsError ? "alert" : "status"}
          className={`mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            noticeIsError
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          }`}
        >
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={17} /></button>
        </div>
      )}

      <form
        onSubmit={(event) => void saveTask(event)}
        className="mb-4 rounded-xl border border-gray-200 bg-neutral-50 p-4 shadow-sm dark:border-neutral-600 dark:bg-neutral-800 sm:p-5"
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase">
          <Plus size={16} className="text-orange-600" /> Create Maintenance Task
        </h2>
        {TaskFields()}
        {formError && <p role="alert" className="mt-3 text-sm text-red-600">{formError}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={submitting || personnel.length === 0}
            className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Task"}
          </button>
        </div>
        {personnel.length === 0 && (
          <p className="mt-2 text-right text-xs text-gray-500">
            Personnel must be assigned to you before you can create a task.
          </p>
        )}
      </form>

      <form
        onSubmit={applyFilters}
        className="mb-6 grid items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-600 dark:bg-neutral-800 md:grid-cols-[1.8fr_1fr_1.1fr_1fr_1fr_auto]"
      >
        <div className="relative">
          <label className={labelClass} htmlFor="task-search">Search</label>
          <Search size={16} className="absolute left-3 top-[37px] text-gray-400" />
          <input
            id="task-search"
            className={`${fieldClass} pl-9`}
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Task name or description..."
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="status-filter">Status</label>
          <select id="status-filter" className={fieldClass} value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="personnel-filter">Assigned To</label>
          <select id="personnel-filter" className={fieldClass} value={personnelDraft} onChange={(event) => setPersonnelDraft(event.target.value)}>
            <option value="">All personnel</option>
            {personnel.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="start-date">Deadline From</label>
          <div className="relative">
            <input id="start-date" className={fieldClass} type="date" value={startDateDraft} onChange={(event) => setStartDateDraft(event.target.value)} />
            <CalendarDays size={15} className="pointer-events-none absolute right-3 top-3 text-gray-400" />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="end-date">Deadline To</label>
          <div className="relative">
            <input id="end-date" className={fieldClass} type="date" value={endDateDraft} onChange={(event) => setEndDateDraft(event.target.value)} />
            <CalendarDays size={15} className="pointer-events-none absolute right-3 top-3 text-gray-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700">Apply</button>
          <button type="button" onClick={resetFilters} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700">Reset</button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-neutral-50 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Maintenance Tasks</h2>
          <span className="w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </span>
        </div>

          {listError ? (
            <div className="p-8 text-center">
              <p role="alert" className="text-sm text-red-600">{listError}</p>
              <button type="button" onClick={refresh} className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 dark:bg-neutral-700 dark:text-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Task Name</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Deadline</th>
                    <th className="px-4 py-3 font-semibold">Assigned To</th>
                    <th className="px-4 py-3 font-semibold">Assigned By</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Loading maintenance tasks...</td></tr>
                  ) : tasks.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">No maintenance tasks found.</td></tr>
                  ) : tasks.map((task) => (
                    <tr key={task.id} className="border-t border-gray-200 text-gray-700 transition hover:bg-orange-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-orange-950/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{task.name}</td>
                      <td className="max-w-xs px-4 py-3 text-gray-600 dark:text-gray-300">{task.description}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDeadline(task.due_at)}</td>
                      <td className="max-w-[200px] px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {task.assignees.slice(0, 2).map((person) => (
                            <span key={person.id} className="rounded-full bg-neutral-200 px-2 py-1 text-xs dark:bg-neutral-700">{person.full_name}</span>
                          ))}
                          {task.assignees.length > 2 && (
                            <span className="rounded-full bg-neutral-200 px-2 py-1 text-xs dark:bg-neutral-700" title={task.assignees.slice(2).map((person) => person.full_name).join(", ")}>
                              +{task.assignees.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{task.assigned_by ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(task.status)}`}>{task.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEditing(task)} aria-label={`Edit ${task.name}`} className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700">
                            <Pencil size={15} />
                          </button>
                          <button type="button" onClick={() => { setDeleteTarget(task); setDeleteError(""); }} aria-label={`Delete ${task.name}`} className="rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!listError && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-neutral-800 sm:flex-row">
              <span>Showing {firstItem}–{lastItem} of {totalTasks} tasks</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40 dark:border-neutral-700">
                  <ChevronLeft size={14} /> Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40 dark:border-neutral-700">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
      </section>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-task-title">
          <form onSubmit={(event) => void saveTask(event, true)} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-neutral-900 shadow-2xl dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="edit-task-title" className="text-lg font-bold">Edit Maintenance Task</h2>
              <button type="button" onClick={() => setEditTarget(null)} disabled={editSaving} aria-label="Close edit dialog" className="rounded-lg p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"><X size={20} /></button>
            </div>
            <div className="space-y-4">{TaskFields(true)}</div>
            {editError && <p role="alert" className="mt-3 text-sm text-red-600">{editError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditTarget(null)} disabled={editSaving} className="rounded-lg bg-neutral-200 px-4 py-2 text-sm text-neutral-800 transition hover:bg-neutral-300 disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600">Cancel</button>
              <button type="submit" disabled={editSaving} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50">{editSaving ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-task-title">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-neutral-900 shadow-2xl dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50">
            <h2 id="delete-task-title" className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Delete Maintenance Task</h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
              Delete “{deleteTarget.name}”? This will remove its assignments and cannot be undone.
            </p>
            {deleteError && <p role="alert" className="mt-3 text-sm text-red-600">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg bg-neutral-200 px-4 py-2 text-sm text-neutral-800 transition hover:bg-neutral-300 disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600">Cancel</button>
              <button type="button" onClick={() => void confirmDelete()} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50">{deleting ? "Deleting..." : "Delete Task"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
