import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-orange-50 dark:bg-zinc-950 text-orange-950 dark:text-orange-100 px-4 sm:px-6 transition-colors duration-300">
      <div className="w-full max-w-3xl text-center space-y-8">

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Manage your assets
          <span className="text-zinc-500 dark:text-zinc-400"> with Confidence.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          A web-based system for an automotive manufacturing company to manage assets, monitor maintenance, and support reliable operations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">

          {/* Sign-In */}
          <Link
            to="/login"
            className="
              w-full sm:w-auto
              px-6 py-3
              rounded-xl
              bg-orange-500
              hover:bg-orange-600
              dark:bg-orange-700
              dark:hover:bg-orange-600
              text-white
              font-medium
              transition-colors
              duration-200
              shadow-sm
            "
          >
            Sign-In
          </Link>

          {/* Create Account */}
          <Link
            to="/register"
            className="
              w-full sm:w-auto
              px-6 py-3
              rounded-xl
              border
              border-orange-300
              dark:border-orange-800
              bg-white
              dark:bg-orange-950
              hover:bg-orange-100
              dark:hover:bg-orange-900
              text-orange-950
              dark:text-orange-100
              font-medium
              transition-colors
              duration-200
            "
          >
            Create Account
          </Link>

        </div>

      </div>
    </div>
  );
}