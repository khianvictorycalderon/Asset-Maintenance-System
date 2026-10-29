import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type PopModalProps = {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  // While true (e.g. a request is in flight) the modal can't be dismissed
  locked?: boolean;
};

// Theme-aware pop-up used for every edit. Closes with Esc or a backdrop click.
export default function PopModal({
  isOpen,
  title,
  children,
  onClose,
  locked = false,
}: PopModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !locked) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, locked, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!locked) onClose();
        }}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={locked}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1 text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
