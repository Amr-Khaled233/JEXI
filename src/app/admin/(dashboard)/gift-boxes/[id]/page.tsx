import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GiftBoxForm } from "@/components/admin/gift-box-form";
import { PageTitle } from "@/components/admin/ui";
import { getGiftBoxProductOptions } from "@/lib/admin-data";
import { db } from "@/lib/db";
import { fromMinor } from "@/lib/money";

export const metadata: Metadata = { title: "Edit gift box" };

export default async function EditGiftBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [box, products] = await Promise.all([db.giftBox.findUnique({ where: { id }, include: { items: true } }), getGiftBoxProductOptions()]);
  if (!box) notFound();

  return (
    <>
      <Link href="/admin/gift-boxes" className="mb-4 inline-flex items-center gap-1.5 text-xs tracking-[0.14em] text-muted uppercase hover:text-gold">
        <ArrowLeft className="size-3.5" /> Gift Boxes
      </Link>
      <PageTitle title={box.name} />
      <GiftBoxForm
        products={products}
        initial={{
          id: box.id,
          name: box.name,
          description: box.description,
          coverImage: box.coverImage,
          price: String(fromMinor(box.price)),
          published: box.published,
          items: box.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }}
      />
    </>
  );
}
