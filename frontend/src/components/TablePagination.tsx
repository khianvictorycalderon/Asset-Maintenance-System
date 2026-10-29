type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string; // e.g. "tasks"
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

const edgeButton =
  "cursor-pointer rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700";

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  disabled = false,
  onPageChange,
}: TablePaginationProps) {
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  // First, last and the neighbours of the current page; gaps become "..."
  const visiblePages = [1, page - 1, page, page + 1, totalPages]
    .filter(
      (number, index, all) =>
        number >= 1 && number <= totalPages && all.indexOf(number) === index,
    )
    .sort((left, right) => left - right);

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-6 py-5 dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        Showing {rangeStart} to {rangeEnd} of {totalItems} {itemLabel}
      </p>

      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={edgeButton}
        >
          Previous
        </button>

        {visiblePages.map((number, index) => (
          <span key={number} className="contents">
            {index > 0 && number - visiblePages[index - 1] > 1 && (
              <span className="px-1 text-xs text-neutral-500">...</span>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(number)}
              aria-current={page === number ? "page" : undefined}
              className={`h-10 min-w-10 cursor-pointer rounded-lg border px-3 text-sm transition disabled:cursor-not-allowed ${
                page === number
                  ? "border-orange-600 bg-orange-600 font-bold text-neutral-50"
                  : "border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
              }`}
            >
              {number}
            </button>
          </span>
        ))}

        <span className="px-2 text-xs text-neutral-600 dark:text-neutral-400">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={edgeButton}
        >
          Next
        </button>
      </nav>
    </div>
  );
}
