import { Link } from "react-router-dom";
import { FOOTER_BUTTONS } from "../config";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
      
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {Object.entries(FOOTER_BUTTONS).map(([section, links]) => (
            <div key={section} className="space-y-3">

              {/* Section title */}
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {section}
              </h3>

              {/* Links */}
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
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
        <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            © {new Date().getFullYear()} Asset Maintenance and Monitoring System. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-500">
            <Link to="/privacy-policy" className="hover:text-zinc-800 dark:hover:text-zinc-200 transition">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-zinc-800 dark:hover:text-zinc-200 transition">
              Terms & Conditions
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}