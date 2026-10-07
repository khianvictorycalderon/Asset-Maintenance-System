const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12">
      <div
        className="
          h-8 w-8
          animate-spin
          rounded-full
          border-4
          border-gray-700
          border-t-green-500
        "
      />

      <p className="mt-3 text-sm text-gray-400">
        Loading...
      </p>
    </div>
  );
};

export default LoadingState;