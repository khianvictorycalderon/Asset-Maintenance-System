import { useState } from "react";
import { Link } from "react-router-dom";
import { NAVBAR_BUTTONS, NAVBAR_HEADER } from "../config";
import { getTheme, setTheme } from "../utils/theme";
import assetMaintenanceLogo from "/public/asset-maintenance-logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const [theme, setThemeState] = useState<"System" | "Light" | "Dark">(
    getTheme()
  );

  const THEMES = ["System", "Light", "Dark"] as const;

  const changeTheme = (t: "System" | "Light" | "Dark") => {
    setTheme(t);
    setThemeState(t);
    setThemeOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-orange-300 dark:border-orange-900 bg-orange-500/90 dark:bg-orange-900/90 backdrop-blur-md">

      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link
           to="/"
           className="flex items-center gap-3"
>
       <img
          src={assetMaintenanceLogo}
          alt="Asset Maintenance System Logo"
          className="h-15 w-15 object-contain"
        />

        <span
          className="text-lg font-bold tracking-tight text-white dark:text-zinc-100"
        >
          {NAVBAR_HEADER}
        </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">

          {NAVBAR_BUTTONS.map((btn) => (
            <Link
              key={btn.path}
              to={btn.path}
              className="text-sm text-white/90 dark:text-orange-100/90 hover:text-black dark:hover:text-white transition"
            >
              {btn.label}
            </Link>
          ))}

          {/* Theme dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen((v) => !v)}
              className="px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-950 bg-orange-300 dark:bg-orange-950 text-xs text-orange-950 dark:text-orange-100"
            >
              Theme: {theme} ▾
            </button>

            {themeOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => changeTheme(t)}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">

          {/* Theme dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen((v) => !v)}
              className="px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-950 bg-orange-300 dark:bg-orange-950 text-xs text-orange-950 dark:text-orange-100"
            >
              {theme}
            </button>

            {themeOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => changeTheme(t)}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-zinc-800 dark:text-zinc-200"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-6 py-4 space-y-3">

          {NAVBAR_BUTTONS.map((btn) => (
            <Link
              key={btn.path}
              to={btn.path}
              onClick={() => setOpen(false)}
              className="block text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition"
            >
              {btn.label}
            </Link>
          ))}

        </div>
      )}
    </nav>
  );
}