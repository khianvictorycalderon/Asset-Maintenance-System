import { useState } from "react";
import PopModal from "../PopModal";
import StatusBadge from "../StatusBadge";
import { formatDeadline } from "../../utils/formatDate";
import { TASK_STATUSES, type PersonnelTask, type TaskStatus } from "./taskTypes";

type UpdateTaskModalProps = {
  task: PersonnelTask;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (status: TaskStatus) => void;
};

// Mount with key={task.id} so the selected status starts from the task's current one.
export default function UpdateTaskModal({
  task,
  saving,
  error,
  onClose,
  onSubmit,
}: UpdateTaskModalProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const unchanged = status === task.status;

  const details: { label: string; value: string }[] = [
    { label: "Task", value: task.name },
    { label: "Description", value: task.description },
    { label: "Deadline", value: formatDeadline(task.deadline) },
    { label: "Supervisor", value: task.supervisor },
  ];

  return (
    <PopModal isOpen title="Update Task Status" onClose={onClose} locked={saving}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!unchanged && !saving) onSubmit(status);
        }}
      >
        <dl className="space-y-3 rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-700">
          {details.map((detail) => (
            <div key={detail.label} className="grid grid-cols-[96px_1fr] gap-3">
              <dt className="text-neutral-600 dark:text-neutral-400">{detail.label}</dt>
              <dd className="break-words font-medium text-neutral-900 dark:text-neutral-50">
                {detail.value}
              </dd>
            </div>
          ))}
          <div className="grid grid-cols-[96px_1fr] items-center gap-3">
            <dt className="text-neutral-600 dark:text-neutral-400">Current</dt>
            <dd>
              <StatusBadge status={task.status} />
            </dd>
          </div>
        </dl>

        <fieldset className="mt-5" disabled={saving}>
          <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
            New status
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {TASK_STATUSES.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-3 text-center text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-400 ${
                  status === option
                    ? "border-orange-600 bg-orange-600 text-neutral-50"
                    : "border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600"
                }`}
              >
                <input
                  type="radio"
                  name="task-status"
                  value={option}
                  checked={status === option}
                  onChange={() => setStatus(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
            The status is shared with your supervisor and anyone else assigned to this task.
          </p>
        </fieldset>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-full bg-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-300 disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || unchanged}
            className="cursor-pointer rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-neutral-50 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </PopModal>
  );
}
