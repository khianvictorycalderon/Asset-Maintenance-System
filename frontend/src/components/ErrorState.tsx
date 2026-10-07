interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState = ({
  message,
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12">

      {/* Error icon */}
      <div
        className="
          flex h-12 w-12
          items-center justify-center
          rounded-full
          bg-red-500/10
          text-red-400
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
            d="M12 9v3.75m0 3.75h.008v.008H12V16.5z"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.29 3.86l-7.82 13.5A1.5 1.5 0 003.77 19.5h16.46a1.5 1.5 0 001.3-2.25l-7.82-13.5a1.5 1.5 0 00-2.6 0z"
          />
        </svg>
      </div>

      {/* Backend error message */}
      <p className="mt-3 max-w-md text-center text-sm text-red-400">
        {message}
      </p>

      {/* Retry */}
      <button
        type="button"
        onClick={onRetry}
        className="
          mt-4
          rounded-lg
          bg-green-600
          px-4 py-2
          text-sm font-medium
          text-white
          transition
          hover:bg-green-500
        "
      >
        Retry
      </button>

    </div>
  );
};

export default ErrorState;