import { Link, useLocation } from "react-router-dom";
import { SIDEBAR_BUTTONS, type UserRole } from "../config";
import { useSelector } from "react-redux";
import type { RootState } from "../config/store";

type Props = {
    open: boolean;
    setOpen: (v: boolean) => void;
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
};

export default function Sidebar({ open, setOpen, collapsed, setCollapsed }: Props) {
    const location = useLocation();

    const user = useSelector((state: RootState) => state.user);

    const showText = !collapsed || open;
    const sidebarWidthClass = open ? "w-64" : collapsed ? "w-20" : "w-64";

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    const SIDEBAR_ITEMS = SIDEBAR_BUTTONS.filter(
        (item) => item.roles.includes(user.role as UserRole)
    );

    return (
        <>
            {/* BACKDROP */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`
                    fixed md:static z-50
                    top-0 left-0 h-screen ${sidebarWidthClass}
                    bg-orange-50 dark:bg-orange-950
                    flex flex-col
                    overflow-y-auto
                    transform transition-all duration-200
                    border-r border-orange-200 dark:border-orange-900
                    ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* HEADER */}
                <div className="relative p-4 pb-8 font-semibold text-neutral-900 dark:text-neutral-100 border-b border-orange-200 dark:border-orange-900">
                    <button
                        onClick={() => setOpen(false)}
                        className="md:hidden absolute right-3 top-3 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:flex items-center justify-center absolute right-3 top-3 p-1 rounded hover:bg-orange-200 dark:hover:bg-orange-900 cursor-pointer"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {collapsed ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* NAVIGATION */}
                <nav className="p-2 space-y-1 flex-1">
                    {SIDEBAR_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpen(false)}
                            className={`
                                flex items-center rounded-md text-sm transition
                                ${showText ? "gap-2 px-3 py-2" : "justify-center px-2 py-2"}
                                ${
                                    isActive(item.path)
                                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                                        : "text-orange-900 dark:text-orange-100 hover:bg-orange-100 dark:hover:bg-orange-900/70"
                                }
                            `}
                        >
                            <span
                                className="w-5 h-5"
                                dangerouslySetInnerHTML={{ __html: item.icon }}
                            />
                            {showText && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>
            </aside>
        </>
    );
}
