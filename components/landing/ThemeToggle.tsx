"use client";

import { useTheme } from "next-themes";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-black/5 text-[#241C14] transition-colors duration-300 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-[#F2EAE0] dark:hover:bg-white/10"
      }
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        aria-hidden
        className="dark:hidden"
      >
        <path
          d="M13 9.5A6 6 0 0 1 5.5 2 6 6 0 1 0 13 9.5Z"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        aria-hidden
        className="hidden dark:block"
      >
        <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.1" />
        <path
          d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M12.1 2.9l-1.06 1.06M3.96 11.04 2.9 12.1M12.1 12.1l-1.06-1.06M3.96 3.96 2.9 2.9"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
