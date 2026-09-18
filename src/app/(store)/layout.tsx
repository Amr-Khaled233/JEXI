import { CartDrawer } from "@/components/store/cart-drawer";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { getNavCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([getNavCategories(), getSettings()]);
  return (
    <div className="flex min-h-dvh flex-col">
      <Header categories={categories} announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} settings={settings} />
      <CartDrawer />
    </div>
  );
}
