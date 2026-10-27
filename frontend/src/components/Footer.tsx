import { Link } from "react-router-dom";
import { FOOTER_BUTTONS } from "../config";

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-neutral-900 text-black dark:text-white">

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {Object.entries(FOOTER_BUTTONS).map(([section, links]) => (
            <div key={section} className="space-y-3">

              {/* Section title */}
              <h3 className="text-sm font-semibold text-black dark:text-white">
                {section}
              </h3>

              {/* Links */}
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-black dark:text-white transition"
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
        <div className="mt-12 pt-6 border-t border-neutral-300 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-sm text-black dark:text-white">
            © {new Date().getFullYear()} Asset Maintenance and Monitoring System. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-white/70 dark:text-neutral-500">
            <Link
              to="/privacy-policy"
              className="text-black dark:text-white transition"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-and-conditions"
              className="text-black dark:text-white transition"
            >
              Terms & Conditions
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}
