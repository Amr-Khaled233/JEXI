"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";

export function MobileMenu({ categories, signedIn }: { categories: { id: string; name: string; slug: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
          <div className="animate-slide-in-left absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col bg-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Logo size="sm" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 hover:text-gold">
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-4">
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
            <div className="space-y-1 border-t border-border px-5 py-4 text-xs tracking-[0.18em] uppercase">
              <Link href="/track" className="block py-2 hover:text-gold">
                Track your order
              </Link>
              <Link href="/account" className="block py-2 hover:text-gold">
                {signedIn ? "My account" : "Sign in / Register"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
