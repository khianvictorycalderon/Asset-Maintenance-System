import { ChevronDown, Search } from "lucide-react";

export type InputOption = { value: string; label: string };

type InputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "select";
  placeholder?: string;
  // Only used by type="select"
  options?: InputOption[];
  // Only used by type="date"
  min?: string;
  max?: string;
  // Show a magnifier inside a text input
  searchIcon?: boolean;
  onEnter?: () => void;
  disabled?: boolean;
};

// Light theme: no bg, border only. Dark theme: bg-neutral-700.
const fieldClass =
  "w-full min-w-0 rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus:ring-orange-950 dark:scheme-dark";

export default function InputField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  options = [],
  min,
  max,
  searchIcon = false,
  onEnter,
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300"
      >
        {label}
      </label>

      <div className="relative">
        {type === "select" ? (
          <>
            <select
              id={id}
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              className={`${fieldClass} appearance-none pr-10`}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
            />
          </>
        ) : (
          <>
            {searchIcon && (
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
              />
            )}
            <input
              id={id}
              type={type}
              value={value}
              min={min}
              max={max}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onEnter?.();
              }}
              className={`${fieldClass} ${searchIcon ? "pl-11" : ""}`}
            />
          </>
        )}
      </div>
    </div>
  );
}
