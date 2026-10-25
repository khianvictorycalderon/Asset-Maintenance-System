import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-orange-50 px-4 text-slate-900 transition-colors duration-500 dark:bg-neutral-950 dark:text-white sm:px-6">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: "url('/images/NEM_mechanical.jpg')",
        }}
      />

      {/* Theme-aware Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-200/25 via-orange-950/35 to-orange-950/65 transition-colors duration-500 dark:from-black/35 dark:via-orange-950/75 dark:to-black/95" />

      {/* Light Theme Glow */}
      <div
        className="absolute inset-0 transition-opacity duration-500 dark:opacity-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 35%, rgba(255,237,213,0.65), transparent 75%)",
        }}
      />

      {/* Dark Theme Glow */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 dark:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(249,115,22,0.24), transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl space-y-8 text-center">
        {/* Hero Title */}
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white md:text-6xl">
          Manage your assets
          <span className="text-orange-600 drop-shadow-sm dark:text-orange-300 dark:drop-shadow-md">
            {" "}with Confidence.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-xl text-base font-semibold leading-relaxed text-white/90 transition-colors duration-300 md:text-lg">
          A web-based system for an automotive manufacturing company to manage
          assets, monitor maintenance, and support reliable operations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          {/* Sign-In */}
          <Link
            to="/login"
            className="w-full rounded-xl bg-orange-600 px-6 py-3 font-medium text-white shadow-lg shadow-orange-900/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-900/30 dark:bg-orange-600 dark:shadow-orange-950/40 dark:hover:bg-orange-500 sm:w-auto"
          >
            Sign-In
          </Link>

          {/* Create Account */}
          <Link
            to="/register"
            className="w-full rounded-xl border border-orange-300 bg-white/70 px-6 py-3 font-medium text-slate-800 backdrop-blur-sm transition-all duration-200 hover:bg-white dark:border-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:w-auto"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}