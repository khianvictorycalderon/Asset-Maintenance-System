import Box from "../Box";
import InputField from "../InputField";
import { TASK_STATUSES, type TaskFilterValues } from "./taskTypes";

type TaskFiltersProps = {
  values: TaskFilterValues;
  error: string;
  onChange: (field: keyof TaskFilterValues, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...TASK_STATUSES.map((status) => ({ value: status, label: status })),
];

export default function TaskFilters({
  values,
  error,
  onChange,
  onSearch,
  onReset,
}: TaskFiltersProps) {
  return (
    <Box>
      <h2 className="mb-4 text-sm font-bold text-neutral-900 dark:text-neutral-50">
        Search and Filters
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[2fr_1.4fr_1.2fr]">
        <InputField
          id="task-search"
          label="Search"
          placeholder="Task name"
          searchIcon
          value={values.keyword}
          onChange={(value) => onChange("keyword", value)}
          onEnter={onSearch}
        />
        <InputField
          id="task-description"
          label="Task description"
          placeholder="Task description"
          value={values.description}
          onChange={(value) => onChange("description", value)}
          onEnter={onSearch}
        />
        <InputField
          id="task-status"
          label="Status"
          type="select"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(value) => onChange("status", value)}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 items-end gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
        <InputField
          id="task-start-date"
          label="Date assigned - From"
          type="date"
          value={values.startDate}
          max={values.endDate || undefined}
          onChange={(value) => onChange("startDate", value)}
        />

        <span aria-hidden="true" className="hidden pb-3 text-neutral-500 lg:block">
          -
        </span>

        <InputField
          id="task-end-date"
          label="Date assigned - To"
          type="date"
          value={values.endDate}
          min={values.startDate || undefined}
          onChange={(value) => onChange("endDate", value)}
        />

        <div className="flex gap-3 lg:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded-full bg-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="cursor-pointer rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-neutral-50 transition hover:bg-orange-700"
          >
            Search
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </Box>
  );
}
