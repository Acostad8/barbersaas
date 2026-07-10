"use client";

import { useState } from "react";

type FaqItem = { q: string; a: string };

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div
            key={item.q}
            className="rounded-[1.5rem] border border-black/10 bg-white p-1.5 shadow-[0_16px_40px_-28px_rgba(38,28,20,0.35)] dark:border-white/10 dark:bg-[#16120E] dark:shadow-none"
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 rounded-[calc(1.5rem-0.375rem)] px-5 py-4 text-left"
            >
              <span className="font-heading text-[15px] font-medium text-[#241C14] dark:text-[#F2EAE0]">
                {item.q}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 transition-transform duration-500 dark:border-white/15 dark:bg-white/5 ${EASE} ${
                  open ? "rotate-45" : ""
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M6 1v10M1 6h10"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    className="text-[#241C14]/70 dark:text-[#F2EAE0]/70"
                  />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-500 ${EASE} ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
