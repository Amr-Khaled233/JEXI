import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PromoForm } from "@/components/admin/promo-form";
import { PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { fromMinor } from "@/lib/money";

export const metadata: Metadata = { title: "Edit promo code" };

export default async function EditPromoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [promo, categories, products] = await Promise.all([
    db.promoCode.findUnique({ where: { id }, include: { categories: { select: { id: true } }, products: { select: { id: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!promo) notFound();

  return (
    <>
      <Link href="/admin/promo-codes" className="mb-4 inline-flex items-center gap-1.5 text-xs tracking-[0.14em] text-muted uppercase hover:text-gold">
        <ArrowLeft className="size-3.5" /> Promo Codes
      </Link>
      <PageTitle title={promo.code} description={`Used ${promo.usedCount}/${promo.usageLimit ?? "∞"}`} />
      <PromoForm
        categories={categories}
        products={products}
        initial={{
          id: promo.id,
          code: promo.code,
          description: promo.description ?? "",
          discountType: promo.discountType,
          value: String(promo.discountType === "PERCENTAGE" ? promo.value : fromMinor(promo.value)),
          startsAt: promo.startsAt.toISOString(),
          endsAt: promo.endsAt.toISOString(),
          usageLimit: promo.usageLimit?.toString() ?? "",
          perCustomerLimit: promo.perCustomerLimit?.toString() ?? "",
          minOrderValue: promo.minOrderValue != null ? String(fromMinor(promo.minOrderValue)) : "",
          scope: promo.scope,
          categoryIds: promo.categories.map((c) => c.id),
          productIds: promo.products.map((p) => p.id),
          active: promo.active,
          usedCount: promo.usedCount,
        }}
      />
    </>
  );
}
