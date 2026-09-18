"use client";

import Image from "next/image";
import { Fragment, useState } from "react";
import { ArrowDown, ArrowUp, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCategoryAction, moveCategoryAction } from "@/app/admin/actions/catalog";
import { CategoryForm } from "@/components/admin/category-form";
import { Panel, Table } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string; description: string | null; image: string | null; productCount: number };

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding((a) => !a)}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      {adding && (
        <Panel title="New category">
          <CategoryForm onDone={() => setAdding(false)} />
        </Panel>
      )}

      <Table>
        <thead>
          <tr>
            <th className="w-20">Order</th>
            <th className="w-32">Image</th>
            <th>Category</th>
            <th className="w-28">Products</th>
            <th className="w-44">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c, i) => (
            <Fragment key={c.id}>
              <tr>
                <td>
                  <div className="flex flex-col items-center gap-1">
                    <form action={moveCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button type="submit" disabled={i === 0} className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-gold disabled:opacity-25" aria-label={`Move ${c.name} up`}>
                        <ArrowUp className="size-4" />
                      </button>
                    </form>
                    <form action={moveCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button type="submit" disabled={i === categories.length - 1} className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-gold disabled:opacity-25" aria-label={`Move ${c.name} down`}>
                        <ArrowDown className="size-4" />
                      </button>
                    </form>
                  </div>
                </td>
                <td>
                  <div className="relative aspect-square w-24 overflow-hidden rounded-md bg-surface-2 ring-1 ring-border">
                    {c.image ? (
                      <Image src={c.image} alt="" fill sizes="96px" className="object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted">
                        <ImageOff className="size-5" strokeWidth={1.5} />
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <p className="font-serif text-xl">{c.name}</p>
                  {c.description && <p className="mt-1 max-w-md text-xs text-muted">{c.description}</p>}
                </td>
                <td className="tabular-nums">{c.productCount}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditing(editing === c.id ? null : c.id)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <form
                      action={deleteCategoryAction}
                      onSubmit={(e) => {
                        if (!confirm(`Delete "${c.name}"? Its ${c.productCount} products stay in the store but won't be listed under this category.`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-danger hover:text-danger" aria-label={`Delete ${c.name}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
              {editing === c.id && (
                <tr>
                  <td colSpan={5} className="bg-surface-2/40">
                    <div className="py-2">
                      <CategoryForm category={c} onDone={() => setEditing(null)} />
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-muted">
                No categories yet.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
