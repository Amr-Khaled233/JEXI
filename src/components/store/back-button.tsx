"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const PREV_KEY = "jexi-prev-path";
const CURRENT_KEY = "jexi-current-path";

function storage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Remembers the previous page inside the store (rendered once in the store layout). */
export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const s = storage();
    if (!s) return;
    const current = s.getItem(CURRENT_KEY);
    if (current && current !== pathname) s.setItem(PREV_KEY, current);
    s.setItem(CURRENT_KEY, pathname);
  }, [pathname]);
  return null;
}

/**
 * Goes back to the page the visitor came from (with its scroll position) when that
 * page was inside the store. Visitors who arrived directly go to the fallback page
 * instead, so the button never takes them off the site.
 */
export function BackButton({ fallbackHref, label = "Back" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button
      type="button"
      onClick={() => {
        const prev = storage()?.getItem(PREV_KEY);
        if (prev && prev !== pathname) router.back();
        else router.push(fallbackHref);
      }}
      className="group mb-5 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-muted uppercase transition hover:text-gold"
    >
      <span className="flex size-8 items-center justify-center rounded-full border border-border transition group-hover:border-gold">
        <ArrowLeft className="size-4" strokeWidth={1.5} />
      </span>
      {label}
    </button>
  );
}
