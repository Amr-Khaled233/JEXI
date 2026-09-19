"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteColorAction, saveColorAction } from "@/app/admin/actions/catalog";
import { Table } from "@/components/admin/ui";
import { ColorSwatch } from "@/components/color-swatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

type Color = { id: string; name: string; hex: string; variantCount: number };

function ColorFields({ color, onDone }: { color?: Color; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveColorAction, undefined);
  const [hex, setHex] = useState(color?.hex ?? "#c9a24a");
  return (
    <form
      action={async (fd) => {
        await action(fd);
        onDone?.();
      }}
      className="flex flex-wrap items-center gap-3"
      key={state?.success}
    >
      {color && <input type="hidden" name="id" value={color.id} />}
      <input type="hidden" name="hex" value={hex} />
      <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} aria-label="Pick the color" className="size-10 cursor-pointer rounded-[3px] border border-border bg-surface p-1" />
      <Input name="name" defaultValue={color?.name} placeholder="Color name" required className="h-10 w-48 min-w-0 flex-1" />
      <Button type="submit" variant={color ? "primary" : "outline"} size="sm" className="h-10" loading={pending}>
        {color ? "Save" : "Add color"}
      </Button>
      {state?.error && <p className="w-full text-xs text-danger">{state.error}</p>}
    </form>
  );
}

function DeleteColor({ color }: { color: Color }) {
  const [state, action, pending] = useActionState(deleteColorAction, undefined);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete the color "${color.name}"?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={color.id} />
      <Button type="submit" variant="ghost" size="sm" className="text-danger hover:text-danger" loading={pending} aria-label={`Delete ${color.name}`}>
        <Trash2 className="size-3.5" />
      </Button>
      {state?.error && <p className="mt-1 max-w-56 text-xs text-danger">{state.error}</p>}
    </form>
  );
}

export function ColorsManager({ colors }: { colors: Color[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <Table compact>
        <thead>
          <tr>
            <th className="w-20">Swatch</th>
            <th>Color</th>
            <th className="w-32">Used by</th>
            <th className="w-44">Actions</th>
          </tr>
        </thead>
        <tbody>
          {colors.map((c) => (
            <tr key={c.id}>
              <td>
                <ColorSwatch hex={c.hex} className="size-9" />
              </td>
              <td>{editing === c.id ? <ColorFields color={c} onDone={() => setEditing(null)} /> : <span className="font-medium">{c.name}</span>}</td>
              <td className="text-muted tabular-nums">
                {c.variantCount} {c.variantCount === 1 ? "product" : "products"}
              </td>
              <td>
                <div className="flex flex-wrap items-start gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(editing === c.id ? null : c.id)}>
                    <Pencil className="size-3.5" /> {editing === c.id ? "Close" : "Edit"}
                  </Button>
                  <DeleteColor color={c} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="mb-3 text-xs tracking-[0.14em] text-muted uppercase">Add a new color</p>
        <ColorFields />
      </div>
    </div>
  );
}
