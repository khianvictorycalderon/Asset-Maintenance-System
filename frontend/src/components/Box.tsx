import type { ReactNode } from "react";

type BoxProps = {
  children: ReactNode;
  className?: string;
  // Remove the inner padding (used when the box wraps a full-width table)
  flush?: boolean;
};

// Rounded content box. Lighter than the page background in both themes.
export default function Box({ children, className = "", flush = false }: BoxProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 ${
        flush ? "" : "p-5 sm:p-6"
      } ${className}`}
    >
      {children}
    </section>
  );
}
