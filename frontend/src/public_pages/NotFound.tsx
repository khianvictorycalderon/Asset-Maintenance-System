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
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-zinc-100 via-neutral-200 to-stone-300 dark:from-zinc-950 dark:via-neutral-900 dark:to-stone-900 text-zinc-800 dark:text-zinc-200 px-6">
      <div className="text-center space-y-6">

        <h1 className="text-9xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-zinc-700 via-neutral-600 to-stone-500 dark:from-zinc-300 dark:via-neutral-400 dark:to-stone-400">
          404
        </h1>

        <h2 className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-zinc-200">
          {NOT_FOUND_MESSAGE.main}
        </h2>

        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          {NOT_FOUND_MESSAGE.additional}
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-white transition font-medium shadow-lg shadow-black/10"
          >
            Go Home
          </Link>

          <button
            onClick={handleBack}
            className="cursor-pointer px-6 py-3 rounded-xl bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 transition font-medium"
          >
            Go Back
          </button>
        </div>

      </div>
    </div>
  );
}