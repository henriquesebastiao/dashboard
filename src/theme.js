import { useState, useEffect } from "react";

/* Shared light/dark theme, persisted so dashboard and agenda stay in sync. */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("dash.theme") || "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("dash.theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}
