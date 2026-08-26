import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 px-6">
      <div className="w-full max-w-3xl text-center space-y-8">

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Build something
          <span className="text-zinc-500 dark:text-zinc-400"> simple.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          A modern, minimal application template built with clean design,
          scalable structure, and neutral styling.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition shadow-sm"
          >
            Sign-In
          </Link>

          <Link
            to="/register"
            className="px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium transition"
          >
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}