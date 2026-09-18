import type { Metadata } from "next";
import { GiftBoxForm } from "@/components/admin/gift-box-form";
import { PageTitle } from "@/components/admin/ui";
import { getGiftBoxProductOptions } from "@/lib/admin-data";

export const metadata: Metadata = { title: "New gift box" };

export default async function NewGiftBoxPage() {
  const products = await getGiftBoxProductOptions();
  return (
    <>
      <PageTitle title="New gift box" />
      <GiftBoxForm products={products} initial={{ name: "", description: "", coverImage: "", price: "", published: false, items: [] }} />
    </>
  );
}
