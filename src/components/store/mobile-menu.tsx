"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, PackageSearch, X } from "lucide-react";
import { Logo } from "@/components/logo";

export function MobileMenu({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    { href: "/shop", label: "Shop All" },
    ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
    { href: "/gift-boxes", label: "Gift Boxes" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full hover:text-gold md:hidden"
      >
        <Menu className="size-5" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="animate-fade-in absolute inset-0 bg-overlay" onClick={() => setOpen(false)} />
          <div className="animate-slide-in-right absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Logo size="sm" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 hover:text-gold">
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-2">
              <ul className="divide-y divide-border/60">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block py-3.5 font-serif text-xl transition hover:text-gold">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-border px-5 py-4">
              <Link href="/track" className="flex items-center gap-3 py-2 text-xs tracking-[0.18em] uppercase hover:text-gold">
                <PackageSearch className="size-4" strokeWidth={1.5} /> Track your order
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
