type StatusBadgeProps = { status: string };

const STYLES: Record<string, string> = {
  Completed:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  "In Progress":
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  Active:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  Inactive:
    "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200",
  "Under Maintenance":
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        STYLES[status] ??
        "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200"
      }`}
    >
      {status}
    </span>
  );
}
