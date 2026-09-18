import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState, PageTitle, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Gift Boxes" };

export default async function GiftBoxesAdminPage() {
  const boxes = await db.giftBox.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { name: true, price: true } }, variant: { select: { stock: true } } } } },
  });

  return (
    <>
      <PageTitle title="Gift Boxes" description="Curated bundles of existing products sold at a bundle price." action={{ href: "/admin/gift-boxes/new", label: "New gift box" }} />
      {boxes.length === 0 ? (
        <EmptyState>No gift boxes yet.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Gift box</th>
              <th>Price</th>
              <th>Saves</th>
              <th>Available</th>
              <th>Sold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((b) => {
              const separate = b.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
              const stock = b.items.length ? Math.min(...b.items.map((i) => Math.floor(i.variant.stock / i.quantity))) : 0;
              return (
                <tr key={b.id}>
                  <td>
                    <Link href={`/admin/gift-boxes/${b.id}`} className="flex items-center gap-3 hover:text-gold">
                      <span className="relative aspect-4/5 w-10 shrink-0 overflow-hidden rounded-[2px] bg-surface-2">
                        <Image src={b.coverImage} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                      <span>
                        <span className="font-medium">{b.name}</span>
                        <span className="block text-xs text-muted">{b.items.map((i) => i.product.name).join(" · ")}</span>
                      </span>
                    </Link>
                  </td>
                  <td>{formatMoney(b.price)}</td>
                  <td className={separate > b.price ? "text-success" : "text-muted"}>{separate > b.price ? formatMoney(separate - b.price) : "—"}</td>
                  <td className={stock === 0 ? "text-danger" : ""}>{stock}</td>
                  <td>{b.soldCount}</td>
                  <td>
                    <Badge tone={b.published ? "success" : "neutral"}>{b.published ? "Published" : "Draft"}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
