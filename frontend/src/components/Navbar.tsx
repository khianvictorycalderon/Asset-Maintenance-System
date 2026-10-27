import { useState } from "react";
import { Link } from "react-router-dom";
import { NAVBAR_BUTTONS, NAVBAR_HEADER } from "../config";
import { getTheme, setTheme } from "../utils/theme";
import assetMaintenanceLogo from "/public/images/asset-maintenance-logo.png";

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
    <nav className="fixed top-0 left-0 w-full z-50 bg-orange-500 dark:bg-orange-600">

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
          className="text-sm md:text-md lg:text-lg font-bold tracking-tight text-white truncate max-w-[70%] md:max-w-[85%] lg:max-w-full"
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
              className="text-sm text-white hover:text-neutral-200 transition duration-300"
            >
              {btn.label}
            </Link>
          ))}

          {/* Theme dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen((v) => !v)}
              className="cursor-pointer px-3 py-1.5 rounded-lg border border-white/25 bg-neutral-100/15 dark:bg-neutral-900/15 text-xs text-white hover:bg-neutral-100/25 dark:hover:bg-neutral-900/25 transition"
            >
              Theme: {theme} ▾
            </button>

            {themeOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => changeTheme(t)}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
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
              className="px-3 py-1.5 rounded-lg border border-white/25 dark:border-neutral-700 bg-white/15 dark:bg-neutral-900 text-xs text-white dark:text-orange-300 hover:bg-white/25 dark:hover:bg-neutral-800 transition"
            >
              {theme}
            </button>

            {themeOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => changeTheme(t)}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
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
            className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-white"
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
        <div className="shadow text-center md:hidden border-b-3 border-orange-500 dark:border-orange-600 bg-white dark:bg-neutral-950 px-6 py-4 space-y-3">

          {NAVBAR_BUTTONS.map((btn) => (
            <Link
              key={btn.path}
              to={btn.path}
              onClick={() => setOpen(false)}
              className="block text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
            >
              {btn.label}
            </Link>
          ))}

        </div>
      )}
    </nav>
  );
}