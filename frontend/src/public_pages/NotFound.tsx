import { Link } from "react-router-dom";
import { NOT_FOUND_MESSAGE } from "../config";

export default function NotFoundPage() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-neutral-100 via-neutral-200 to-stone-300 dark:from-neutral-950 dark:via-neutral-900 dark:to-stone-900 text-neutral-800 dark:text-neutral-200 px-6">
      <div className="text-center space-y-6">

        <h1 className="text-9xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-neutral-700 via-neutral-600 to-stone-500 dark:from-neutral-300 dark:via-neutral-400 dark:to-stone-400">
          404
        </h1>

        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-800 dark:text-neutral-200">
          {NOT_FOUND_MESSAGE.main}
        </h2>

        <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
          {NOT_FOUND_MESSAGE.additional}
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl bg-neutral-700 hover:bg-neutral-800 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-white transition font-medium shadow-lg shadow-black/10"
          >
            Go Home
          </Link>

          <button
            onClick={handleBack}
            className="cursor-pointer px-6 py-3 rounded-xl bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 transition font-medium"
          >
            Go Back
          </button>
        </div>

      </div>
    </div>
  );
}