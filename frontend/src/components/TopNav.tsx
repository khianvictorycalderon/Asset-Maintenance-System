import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { BUILT_IN_API_URLS, NAVBAR_HEADER } from "../config";
import { getTheme, setTheme } from "../utils/theme";
import { clearUser } from "../slices/userSlice";
import type { RootState } from "../config/store";
import assetMaintenanceLogo from "/public/images/asset-maintenance-logo.png";

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
        <nav className="h-14 flex items-center px-4 dark:border-b dark:border-zinc-800 bg-orange-600 dark:bg-zinc-900">

            {/* Left: Hamburger */}
            <button
                onClick={onMenuClick}
                className="md:hidden p-2 rounded hover:bg-orange-500 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="Open sidebar"
            >
                <svg
                    className="w-6 h-6 text-white dark:text-neutral-100"
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
            <div className="ml-2 flex items-center gap-2 min-w-0">
           <img
             src={assetMaintenanceLogo}
             alt="Asset Maintenance System Logo"
             className="h-15 w-15 object-contain shrink-0"
                />
            <div className="ml-2 font-semibold text-white dark:text-neutral-100 truncate">
                {NAVBAR_HEADER}
            </div>
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
                    className="cursor-pointer flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-orange-500 dark:hover:bg-zinc-800 transition"
                >
                    <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-white text-orange-600 dark:bg-orange-500 dark:text-white text-xs font-semibold">
                        {initials}
                    </span>

                    <span className="hidden sm:block max-w-[10rem] truncate text-sm font-medium text-white dark:text-neutral-100">
                        {fullName}
                    </span>

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="hidden sm:block w-4 h-4 text-orange-100 dark:text-neutral-400"
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
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden z-50">

                        {/* Account */}
                        <Link
                            to="/account"
                            onClick={closeProfileMenu}
                            className="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-orange-50 dark:hover:bg-zinc-800 transition"
                        >
                            Account
                        </Link>

                        {/* Theme */}
                        <button
                            onClick={() => setThemeOpen((v) => !v)}
                            className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition"
                        >
                            <span>Theme</span>
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                                {theme} ▾
                            </span>
                        </button>

                        {/* Theme submenu */}
                        {themeOpen && (
                            <div className="border-t border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950">
                                {THEMES.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => changeTheme(t)}
                                        className="cursor-pointer w-full text-left pl-6 pr-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-orange-50 dark:hover:bg-zinc-800 transition"
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
                            className="cursor-pointer w-full text-left px-3 py-2 text-sm text-red-500 dark:text-red-400 border-t border-neutral-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                            Logout
                        </button>

                    </div>
                )}

            </div>

        </nav>
    );
}