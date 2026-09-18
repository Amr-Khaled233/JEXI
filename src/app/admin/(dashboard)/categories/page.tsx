import type { Metadata } from "next";
import { ArrowDown, ArrowUp } from "lucide-react";
import { deleteCategoryAction, moveCategoryAction } from "@/app/admin/actions/catalog";
import { CategoryForm } from "@/components/admin/category-form";
import { PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <PageTitle title="Categories" description="The order here is the order of the store navigation." />
      <div className="space-y-4">
        {categories.map((c, i) => (
          <Panel key={c.id}>
            <div className="flex gap-4">
              <div className="flex flex-col gap-1">
                <form action={moveCategoryAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={i === 0} className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-gold disabled:opacity-30" aria-label="Move up">
                    <ArrowUp className="size-4" />
                  </button>
                </form>
                <form action={moveCategoryAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={i === categories.length - 1} className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-gold disabled:opacity-30" aria-label="Move down">
                    <ArrowDown className="size-4" />
                  </button>
                </form>
              </div>
              <div className="min-w-0 flex-1">
                <CategoryForm category={c} productCount={c._count.products} />
                <form action={deleteCategoryAction} className="mt-3">
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="text-xs tracking-[0.14em] text-muted uppercase hover:text-danger">
                    Delete category
                  </button>
                </form>
              </div>
            </div>
          </Panel>
        ))}
        <Panel title="Add a category">
          <CategoryForm />
        </Panel>
      </div>
    </>
  );
}
