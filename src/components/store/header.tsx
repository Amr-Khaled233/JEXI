import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartButton } from "@/components/store/cart-button";
import { MobileMenu } from "@/components/store/mobile-menu";

type NavCategory = { id: string; name: string; slug: string };

function NavLinks({ categories, className }: { categories: NavCategory[]; className?: string }) {
  return (
    <ul className={className}>
      <li>
        <Link href="/shop" className="whitespace-nowrap transition hover:text-gold">
          Shop All
        </Link>
      </li>
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/category/${c.slug}`} className="whitespace-nowrap transition hover:text-gold">
            {c.name}
          </Link>
        </li>
      ))}
      <li>
        <Link href="/gift-boxes" className="whitespace-nowrap text-gold transition hover:text-gold-strong">
          Gift Boxes
        </Link>
      </li>
    </ul>
  );
}

export function Header({ categories, announcement }: { categories: NavCategory[]; announcement?: string | null }) {
  const iconLink = "inline-flex size-10 items-center justify-center rounded-full transition hover:text-gold";
  return (
    <>
      {announcement && (
        <div className="bg-[#120d0a] px-4 py-2 text-center text-[0.6rem] tracking-[0.24em] text-[#d9b890] uppercase sm:text-[0.65rem] sm:tracking-[0.28em]">
          {announcement}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-6 md:h-20">
          <Link href="/" aria-label="JEXI Accessories home" className="shrink-0">
            <Logo size="sm" className="md:hidden" />
            <Logo size="md" className="hidden md:inline-flex" />
          </Link>

          <nav aria-label="Categories" className="hidden min-w-0 flex-1 justify-center xl:flex">
            <NavLinks categories={categories} className="flex items-center gap-7 text-[0.68rem] tracking-[0.2em] uppercase" />
          </nav>

          <div className="flex shrink-0 items-center gap-0.5">
            <ThemeToggle />
            <Link href="/track" aria-label="Track your order" title="Track your order" className={iconLink}>
              <PackageSearch className="size-4.75" strokeWidth={1.5} />
            </Link>
            <CartButton />
            <MobileMenu categories={categories} />
          </div>
        </div>

        <nav aria-label="Categories" className="hidden border-t border-border/60 md:block xl:hidden">
          <NavLinks categories={categories} className="container-page scrollbar-none flex h-11 items-center justify-center gap-6 overflow-x-auto text-[0.65rem] tracking-[0.2em] uppercase lg:gap-8" />
        </nav>
      </header>
    </>
  );
}
