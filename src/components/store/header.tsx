import Link from "next/link";
import { Search, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartButton } from "@/components/store/cart-button";
import { MobileMenu } from "@/components/store/mobile-menu";

type NavCategory = { id: string; name: string; slug: string };

export function Header({ categories, signedIn, announcement }: { categories: NavCategory[]; signedIn: boolean; announcement?: string | null }) {
  return (
    <>
      {announcement && (
        <div className="bg-[#120d0a] px-4 py-2 text-center text-[0.65rem] tracking-[0.28em] text-[#d9b890] uppercase">{announcement}</div>
      )}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="container-page grid h-18 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          <div className="flex items-center gap-1">
            <MobileMenu categories={categories} signedIn={signedIn} />
            <Link href="/shop" aria-label="Search the shop" className="hidden size-10 items-center justify-center rounded-full hover:text-gold md:inline-flex">
              <Search className="size-[18px]" strokeWidth={1.5} />
            </Link>
          </div>
          <Link href="/" aria-label="JEXI Accessories — home" className="justify-self-center">
            <Logo size="sm" className="md:hidden" />
            <Logo size="md" className="hidden md:inline-flex" />
          </Link>
          <div className="flex items-center justify-end gap-0.5">
            <ThemeToggle />
            <Link
              href="/account"
              aria-label={signedIn ? "My account" : "Sign in"}
              className="hidden size-10 items-center justify-center rounded-full hover:text-gold sm:inline-flex"
            >
              <User className="size-[18px]" strokeWidth={1.5} />
            </Link>
            <CartButton />
          </div>
        </div>
        <nav aria-label="Categories" className="hidden border-t border-border/60 md:block">
          <ul className="container-page flex h-11 items-center justify-center gap-8 text-[0.68rem] tracking-[0.22em] uppercase">
            <li>
              <Link href="/shop" className="transition hover:text-gold">
                Shop All
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="transition hover:text-gold">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/gift-boxes" className="text-gold transition hover:text-gold-strong">
                Gift Boxes
              </Link>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
}
