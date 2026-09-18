import { CartDrawer } from "@/components/store/cart-drawer";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { getCustomer } from "@/lib/auth";
import { getNavCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, customer] = await Promise.all([getNavCategories(), getSettings(), getCustomer()]);
  return (
    <div className="flex min-h-dvh flex-col">
      <Header categories={categories} signedIn={!!customer} announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} settings={settings} />
      <CartDrawer />
    </div>
  );
}
