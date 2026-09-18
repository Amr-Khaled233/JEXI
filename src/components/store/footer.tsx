import Link from "next/link";
import { Logo } from "@/components/logo";
import type { Settings } from "@/lib/settings";

export function Footer({ categories, settings }: { categories: { id: string; name: string; slug: string }[]; settings: Settings }) {
  const whatsapp = settings.whatsapp?.replace(/[^\d]/g, "");
  return (
    <footer className="mt-24 bg-[#0e0a07] text-[#d9ccbc]">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-start gap-5">
          <Logo size="md" />
          <p className="max-w-xs text-sm leading-relaxed text-[#a8988a]">{settings.tagline}</p>
        </div>
        <FooterCol title="Shop">
          {categories.map((c) => (
            <FooterLink key={c.id} href={`/category/${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
          <FooterLink href="/gift-boxes">Gift Boxes</FooterLink>
        </FooterCol>
        <FooterCol title="Help">
          <FooterLink href="/track">Track your order</FooterLink>
          <FooterLink href="/cart">Your cart</FooterLink>
        </FooterCol>
        <FooterCol title="Contact">
          {settings.contactEmail && <FooterLink href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</FooterLink>}
          {settings.contactPhone && <FooterLink href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</FooterLink>}
          {whatsapp && <FooterLink href={`https://wa.me/${whatsapp.startsWith("0") ? `2${whatsapp}` : whatsapp}`}>WhatsApp</FooterLink>}
          {settings.instagram && <FooterLink href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}>Instagram</FooterLink>}
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-[0.65rem] tracking-[0.2em] text-[#8a7b6d] uppercase sm:flex-row">
          <span>© {new Date().getFullYear()} {settings.storeName}</span>
          <span>Cash on delivery · Free shipping across Egypt</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 font-sans text-[0.68rem] tracking-[0.3em] text-[#c9a27a] uppercase">{title}</h3>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <li>
      <Link href={href} className="transition hover:text-[#e0bf98]" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </Link>
    </li>
  );
}
