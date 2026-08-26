import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { BUILT_IN_API_URLS, TOPNAV_HEADER } from "../config";
import { getTheme, setTheme } from "../utils/theme";
import { clearUser } from "../slices/userSlice";
import type { RootState } from "../config/store";

type Props = {
    onMenuClick: () => void;
};

export default function TopNav({ onMenuClick }: Props) {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector((state: RootState) => state.user);

    const [profileOpen, setProfileOpen] = useState(false);
    const [themeOpen, setThemeOpen] = useState(false);
    const [theme, setThemeState] = useState<"System" | "Light" | "Dark">(
        getTheme()
    );

    const profileRef = useRef<HTMLDivElement>(null);

    const THEMES = ["System", "Light", "Dark"] as const;

    const initials = (
        (user.first_name?.charAt(0) || "") +
        (user.last_name?.charAt(0) || "")
    ).toUpperCase();

    const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");

    const changeTheme = (t: "System" | "Light" | "Dark") => {
        setTheme(t);
        setThemeState(t);
        setThemeOpen(false);
        setProfileOpen(false);
    };

    const closeProfileMenu = () => {
        setProfileOpen(false);
        setThemeOpen(false);
    };

    const handleLogout = async () => {
        try {
            await axios.delete(BUILT_IN_API_URLS.logout, {
                withCredentials: true,
            });

            navigate("/login");
            dispatch(clearUser()); // Clears existing user
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // Close the dropdown when clicking outside of it.
    useEffect(() => {
        if (!profileOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target as Node)
            ) {
                closeProfileMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileOpen]);

    return (
        <nav className="h-14 flex items-center px-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">

            {/* Left: Hamburger */}
            <button
                onClick={onMenuClick}
                className="md:hidden p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                aria-label="Open sidebar"
            >
                <svg
                    className="w-6 h-6 text-neutral-900 dark:text-neutral-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            {/* Title */}
            <div className="ml-2 font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {TOPNAV_HEADER}
            </div>

            {/* Right side */}
            <div className="ml-auto relative" ref={profileRef}>

                {/* Profile */}
                <button
                    onClick={() => {
                        setProfileOpen((v) => !v);
                        if (profileOpen) {
                            setThemeOpen(false);
                        }
                    }}
                    className="cursor-pointer flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                >
                    <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold">
                        {initials}
                    </span>

                    <span className="hidden sm:block max-w-[10rem] truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {fullName}
                    </span>

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="hidden sm:block w-4 h-4 text-neutral-500 dark:text-neutral-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                    </svg>
                </button>

                {/* Profile menu */}
                {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden z-50">

                        {/* Account */}
                        <Link
                            to="/account"
                            onClick={closeProfileMenu}
                            className="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            Account
                        </Link>

                        {/* Theme */}
                        <button
                            onClick={() => setThemeOpen((v) => !v)}
                            className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            <span>Theme</span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {theme} ▾
                            </span>
                        </button>

                        {/* Theme submenu */}
                        {themeOpen && (
                            <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40">
                                {THEMES.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => changeTheme(t)}
                                        className="cursor-pointer w-full text-left pl-6 pr-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Logout */}
                        <button
                            onClick={() => {
                                closeProfileMenu();
                                handleLogout();
                            }}
                            className="cursor-pointer w-full text-left px-3 py-2 text-sm text-red-500 border-t border-neutral-100 dark:border-neutral-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                        >
                            Logout
                        </button>

                    </div>
                )}

            </div>

        </nav>
    );
}
