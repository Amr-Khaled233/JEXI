"use client";

import { useActionState } from "react";
import { saveCategoryAction } from "@/app/admin/actions/catalog";
import { SingleImageField } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";

type Category = { id: string; name: string; slug: string; description: string | null; image: string | null };

export function CategoryForm({ category, productCount }: { category?: Category; productCount?: number }) {
  const [state, action, pending] = useActionState(saveCategoryAction, undefined);
  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-[8rem_minmax(0,1fr)]" key={category ? category.id : state?.success}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <SingleImageField name="image" defaultValue={category?.image} />
      <div className="grid content-start gap-3 sm:grid-cols-2">
        {state?.error && <Alert tone="error" className="sm:col-span-2">{state.error}</Alert>}
        {state?.success && <Alert tone="success" className="sm:col-span-2">{state.success}</Alert>}
        <Field label="Name" htmlFor={`name-${category?.id ?? "new"}`}>
          <Input id={`name-${category?.id ?? "new"}`} name="name" defaultValue={category?.name} required className="h-10" />
        </Field>
        <Field label="URL slug" htmlFor={`slug-${category?.id ?? "new"}`} hint={productCount != null ? `${productCount} products` : "Leave blank to generate"}>
          <Input id={`slug-${category?.id ?? "new"}`} name="slug" defaultValue={category?.slug} className="h-10" />
        </Field>
        <Field label="Description" htmlFor={`desc-${category?.id ?? "new"}`} className="sm:col-span-2">
          <Input id={`desc-${category?.id ?? "new"}`} name="description" defaultValue={category?.description ?? ""} className="h-10" />
        </Field>
        <div>
          <Button type="submit" variant={category ? "outline" : "primary"} size="sm" loading={pending}>
            {category ? "Save" : "Add category"}
          </Button>
        </div>
      </div>
    </form>
  );
}
