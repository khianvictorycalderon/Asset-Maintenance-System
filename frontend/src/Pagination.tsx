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
  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-gray-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
      
      {/* Showing text */}
      <p className="text-sm text-gray-400">
        Showing{" "}
        <span className="font-medium text-gray-200">
          {startItem}–{endItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-gray-200">
          {totalItems}
        </span>
      </p>

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={isFirstPage}
          onClick={() => onPageChange(currentPage - 1)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
            isFirstPage
              ? "cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600"
              : "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          Previous
        </button>

        <span className="px-2 text-sm text-gray-400">
          Page{" "}
          <span className="font-semibold text-white">
            {currentPage}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-white">
            {totalPages}
          </span>
        </span>

        <button
          type="button"
          disabled={isLastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
            isLastPage
              ? "cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600"
              : "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}