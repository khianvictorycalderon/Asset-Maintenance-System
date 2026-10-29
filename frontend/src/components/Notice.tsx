import { useEffect } from "react";
import { X } from "lucide-react";

type NoticeProps = {
  type: "success" | "error";
  message: string;
  onClose: () => void;
};

// Inline banner that dismisses itself after a few seconds.
export default function Notice({ type, message, onClose }: NoticeProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          : "border-green-300 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
      }`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="cursor-pointer"
      >
        <X size={16} />
      </button>
    </div>
  );
}
