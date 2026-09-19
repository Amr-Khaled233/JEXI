"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgePercent, Gift, House, LayoutDashboard, Package, Settings, ShoppingCart, Tags, Ticket, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/home-page", label: "Home Page", icon: House },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/gift-boxes", label: "Gift Boxes", icon: Gift },
  { href: "/admin/categories", label: "Categories & Colors", icon: Tags },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Ticket },
  { href: "/admin/free-shipping", label: "Free Shipping", icon: BadgePercent },
  { href: "/admin/shipping", label: "Shipping Zones", icon: Truck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-[3px] px-3 py-2 text-sm transition",
              active ? "bg-gold/15 text-gold" : "text-fg/80 hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
