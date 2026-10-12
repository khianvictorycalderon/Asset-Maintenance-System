interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  const btn =
    "cursor-pointer rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800";

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 text-sm dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-neutral-500 dark:text-neutral-400">
        Showing {start}–{end} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>

        <span className="px-2 text-neutral-600 dark:text-neutral-300">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          className={btn}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}