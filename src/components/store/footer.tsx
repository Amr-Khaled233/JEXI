import Link from "next/link";
import { Logo } from "@/components/logo";
import { FacebookIcon, InstagramIcon, socialUrl, TikTokIcon, WhatsAppIcon } from "@/components/social-icons";
import type { Settings } from "@/lib/settings";
import { freeShippingMessage } from "@/lib/shipping";

export function Footer({ categories, settings }: { categories: { id: string; name: string; slug: string }[]; settings: Settings }) {
  const whatsapp = settings.whatsapp?.replace(/[^\d]/g, "");
  const socials = [
    settings.showInstagram && settings.instagram && { label: "Instagram", href: socialUrl("instagram", settings.instagram), Icon: InstagramIcon },
    settings.showFacebook && settings.facebook && { label: "Facebook", href: socialUrl("facebook", settings.facebook), Icon: FacebookIcon },
    settings.showTiktok && settings.tiktok && { label: "TikTok", href: socialUrl("tiktok", settings.tiktok), Icon: TikTokIcon },
    whatsapp && { label: "WhatsApp", href: `https://wa.me/${whatsapp.startsWith("0") ? `2${whatsapp}` : whatsapp}`, Icon: WhatsAppIcon },
  ].filter(Boolean) as { label: string; href: string; Icon: (p: { className?: string }) => React.ReactNode }[];
  const shippingLine = freeShippingMessage(settings);

  return (
    <footer className="mt-24 bg-[#0e0a07] text-[#d9ccbc]">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-12 py-16 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="col-span-2 flex flex-col items-start gap-5 md:col-span-1">
          <Logo size="md" />
          {settings.tagline && <p className="max-w-xs text-sm leading-relaxed text-[#a8988a]">{settings.tagline}</p>}
          {socials.length > 0 && (
            <ul className="flex gap-2.5">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex size-10 items-center justify-center rounded-full border border-[#c9a27a]/30 text-[#d9b890] transition hover:border-[#e0bf98] hover:text-[#f1e8dc]"
                  >
                    <Icon className="size-4.5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <FooterCol title="Shop">
          <FooterLink href="/shop">Shop All</FooterLink>
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
        {(settings.contactEmail || settings.contactPhone) && (
          <FooterCol title="Contact">
            {settings.contactEmail && <FooterLink href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</FooterLink>}
            {settings.contactPhone && <FooterLink href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</FooterLink>}
          </FooterCol>
        )}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-center text-[0.65rem] tracking-[0.2em] text-[#8a7b6d] uppercase sm:flex-row">
          <span>
            &copy; {new Date().getFullYear()} {settings.storeName}
          </span>
          <span>Cash on delivery{shippingLine ? `, ${shippingLine.toLowerCase()}` : ""}</span>
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
      <Link href={href} className="wrap-break-word transition hover:text-[#e0bf98]" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </Link>
    </li>
  );
}
