interface EmptyStateProps {
  message: string;
}

const EmptyState = ({
  message,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12">

      {/* Icon */}
      <div
        className="
          flex h-12 w-12
          items-center justify-center
          rounded-full
          bg-gray-700/50
          text-gray-400
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-8.25-4.5-8.25 4.5m16.5 0v9L12 21l-8.25-4.5v-9m16.5 0L12 12m0 0L3.75 7.5M12 12v9"
          />
        </svg>
      </div>

      <p className="mt-3 text-sm text-gray-400">
        {message}
      </p>

    </div>
  );
};

export default EmptyState;