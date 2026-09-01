import { Link } from "react-router-dom";
import { FOOTER_BUTTONS } from "../config";

export default function Footer() {
  return (
    <footer className="border-t border-orange-300 dark:border-orange-900 bg-orange-500 dark:bg-orange-900 text-black dark:text-orange-100">

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {Object.entries(FOOTER_BUTTONS).map(([section, links]) => (
            <div key={section} className="space-y-3">

              {/* Section title */}
              <h3 className="text-sm font-semibold text-black dark:text-orange-100">
                {section}
              </h3>

              {/* Links */}
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-black/80 dark:text-orange-100/80 hover:text-black dark:hover:text-white transition"
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
        <div className="mt-12 pt-6 border-t border-orange-300 dark:border-orange-900 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            © {new Date().getFullYear()} Asset Maintenance and Monitoring System. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-black/70 dark:text-orange-100/70">
            <Link
              to="/privacy-policy"
              className="hover:text-black dark:hover:text-white transition"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-and-conditions"
              className="hover:text-black dark:hover:text-white transition"
            >
              Terms & Conditions
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}