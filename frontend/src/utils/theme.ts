const THEME_KEY = "theme";

export function getTheme(): "System" | "Light" | "Dark" {
  if (typeof window === "undefined") return "System";

  const stored = localStorage.getItem(THEME_KEY) as
    | "System"
    | "Light"
    | "Dark"
    | null;

  return stored ?? "System";
}

export function setTheme(theme: "System" | "Light" | "Dark") {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  const isDark =
    theme === "Dark" ||
    (theme === "System" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);

  localStorage.setItem(THEME_KEY, theme);
}