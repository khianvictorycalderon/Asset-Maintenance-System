import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  // Layout classes for both <th> and <td> (width, alignment, nowrap...)
  className?: string;
  // Text styling for the <td> cells only
  cellClassName?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading: boolean;
  error: string;
  onRetry: () => void;
  emptyMessage: string;
};

// Horizontal borders only (divide-y), no vertical borders.
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyMessage,
}: DataTableProps<T>) {
  const cellPadding = (index: number) =>
    index === 0 ? "pl-6 pr-4 py-4" : "px-4 py-4";

  const message = (content: ReactNode) => (
    <tbody>
      <tr>
        <td colSpan={columns.length} className="px-6 py-14 text-center text-sm">
          {content}
        </td>
      </tr>
    </tbody>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs font-medium uppercase text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`${cellPadding(index)} ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        {loading ? (
          message(
            <span
              role="status"
              className="inline-flex items-center gap-3 text-neutral-600 dark:text-neutral-300"
            >
              <span className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-orange-600 dark:border-neutral-600" />
              Loading...
            </span>,
          )
        ) : error ? (
          message(
            <div>
              <p role="alert" className="text-red-700 dark:text-red-400">
                {error}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 cursor-pointer rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-neutral-50 transition hover:bg-orange-700"
              >
                Retry
              </button>
            </div>,
          )
        ) : rows.length === 0 ? (
          message(
            <span className="text-neutral-600 dark:text-neutral-400">
              {emptyMessage}
            </span>,
          )
        ) : (
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="text-neutral-800 transition hover:bg-orange-50 dark:text-neutral-200 dark:hover:bg-neutral-700/60"
              >
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={`${cellPadding(index)} ${column.className ?? ""} ${column.cellClassName ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}
