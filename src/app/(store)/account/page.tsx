import type { Metadata } from "next";
import Link from "next/link";
import { deleteAddressAction, logoutAction, setDefaultAddressAction } from "@/app/actions/account";
import { AddressForm } from "@/components/store/auth-forms";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const customer = await requireCustomer();
  const [orders, addresses, zones] = await Promise.all([
    db.order.findMany({
      where: { OR: [{ customerId: customer.id }, { email: customer.email }] },
      orderBy: { createdAt: "desc" },
      select: { id: true, orderNumber: true, accessToken: true, status: true, total: true, createdAt: true, _count: { select: { items: true } } },
      take: 50,
    }),
    db.address.findMany({ where: { customerId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    db.shippingZone.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { name: true } }),
  ]);

  return (
    <div className="container-page max-w-5xl py-10 md:py-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">My account</p>
          <h1 className="text-4xl md:text-5xl">Hello, {customer.name.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-muted">{customer.email}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className={buttonClasses("outline", "sm")}>
            Sign out
          </button>
        </form>
      </div>

      <section className="mb-14">
        <h2 className="mb-5 text-2xl">Order history</h2>
        {orders.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="text-muted">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className={buttonClasses("primary", "md", "mt-5")}>
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/order/${encodeURIComponent(o.orderNumber)}?t=${o.accessToken}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-2/60"
              >
                <div>
                  <p className="font-medium tracking-wide">{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {formatDate(o.createdAt)} · {o._count.items} {o._count.items === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge tone={o.status === "CANCELLED" ? "danger" : o.status === "DELIVERED" ? "success" : "gold"}>{ORDER_STATUSES[o.status].label}</Badge>
                  <span className="text-sm font-medium">{formatMoney(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-5 text-2xl">Saved addresses</h2>
        {addresses.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div key={a.id} className="card p-5 text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-medium">{a.label || a.fullName}</span>
                  {a.isDefault && <Badge tone="gold">Default</Badge>}
                </div>
                <p className="text-fg/80">{a.fullName} · {a.phone}</p>
                <p className="text-fg/80">{a.address}</p>
                <p className="text-fg/80">
                  {a.area}, {a.governorate}
                </p>
                <div className="mt-4 flex gap-4 text-xs tracking-[0.14em] uppercase">
                  {!a.isDefault && (
                    <form action={setDefaultAddressAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-muted hover:text-gold">
                        Make default
                      </button>
                    </form>
                  )}
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-muted hover:text-danger">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
        <details className="card p-5" open={addresses.length === 0}>
          <summary className="cursor-pointer text-sm tracking-[0.14em] uppercase">Add a new address</summary>
          <div className="mt-5">
            <AddressForm governorates={zones.map((z) => z.name)} />
          </div>
        </details>
      </section>
    </div>
  );
}
