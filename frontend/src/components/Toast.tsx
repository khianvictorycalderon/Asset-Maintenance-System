interface ToastProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

const Toast = ({
  type,
  message,
  onClose,
}: ToastProps) => {
  const isSuccess = type === "success";

  return (
    <div
      className={`
        fixed
        right-4
        top-4
        z-50
        flex
        max-w-sm
        items-start
        gap-3
        rounded-lg
        border
        px-4
        py-3
        shadow-xl
        ${ 
          isSuccess
            ? "border-green-500/30 bg-green-500/10"
            : "border-red-500/30 bg-red-500/10"
        }
      `}
    >

      {/* Icon */}
      <div
        className={`
          mt-0.5
          flex h-6 w-6
          shrink-0
          items-center
          justify-center
          rounded-full
          ${
            isSuccess
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }
        `}
      >
        {isSuccess ? "✓" : "!"}
      </div>

      {/* Message */}
      <p
        className={`
          flex-1
          text-sm
          ${
            isSuccess
              ? "text-green-300"
              : "text-red-300"
          }
        `}
      >
        {message}
      </p>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 hover:text-white"
        aria-label="Close notification"
      >
        ×
      </button>

    </div>
  );
};

export default Toast;