"use client";

import { useActionState, useEffect } from "react";
import { saveCategoryAction } from "@/app/admin/actions/catalog";
import { SingleImageField } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Textarea } from "@/components/ui/field";

type Category = { id: string; name: string; description: string | null; image: string | null };

export function CategoryForm({ category, onDone }: { category?: Category; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveCategoryAction, undefined);
  useEffect(() => {
    if (state?.success) onDone?.();
  }, [state, onDone]);

  const idp = category?.id ?? "new";
  return (
    <form action={action} className="grid grid-cols-1 gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]" key={category ? category.id : state?.success}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <div>
        <p className="mb-1.5 text-xs font-medium tracking-[0.14em] text-muted uppercase">Image</p>
        <SingleImageField name="image" defaultValue={category?.image} className="max-w-none" />
      </div>
      <div className="grid content-start gap-4">
        {state?.error && <Alert tone="error">{state.error}</Alert>}
        {state?.success && !onDone && <Alert tone="success">{state.success}</Alert>}
        <Field label="Name" htmlFor={`name-${idp}`}>
          <Input id={`name-${idp}`} name="name" defaultValue={category?.name} required />
        </Field>
        <Field label="Description" htmlFor={`desc-${idp}`} hint="Shown at the top of the category page.">
          <Textarea id={`desc-${idp}`} name="description" rows={2} defaultValue={category?.description ?? ""} className="min-h-0" />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>
            {category ? "Save changes" : "Add category"}
          </Button>
          {onDone && (
            <Button type="button" variant="ghost" size="sm" onClick={onDone}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
