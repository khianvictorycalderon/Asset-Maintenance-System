import { Link } from "react-router-dom";
import { FOOTER_BUTTONS } from "../config";

export default function Footer() {
  return (
    <footer className="border-t border-orange-400/30 dark:border-t-2 dark:border-orange-500/70 bg-orange-600 dark:bg-zinc-950 text-white">

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {Object.entries(FOOTER_BUTTONS).map(([section, links]) => (
            <div key={section} className="space-y-3">

              {/* Section title */}
              <h3 className="text-sm font-semibold text-white dark:text-orange-50">
                {section}
              </h3>

              {/* Links */}
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-white/80 dark:text-zinc-400 hover:text-white dark:hover:text-orange-400 transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

            </div>
          ))}

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-orange-400/30 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-sm text-white dark:text-zinc-300">
            © {new Date().getFullYear()} Asset Maintenance and Monitoring System. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-white/70 dark:text-zinc-500">
            <Link
              to="/privacy-policy"
              className="hover:text-white dark:hover:text-orange-400 transition"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-and-conditions"
              className="hover:text-white dark:hover:text-orange-400 transition"
            >
              Terms & Conditions
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}
