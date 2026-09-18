import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

type SlugModel = "product" | "giftBox" | "category" | "color";

async function taken(model: SlugModel, slug: string, excludeId?: string) {
  const where = { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) };
  switch (model) {
    case "product":
      return (await db.product.count({ where })) > 0;
    case "giftBox":
      return (await db.giftBox.count({ where })) > 0;
    case "category":
      return (await db.category.count({ where })) > 0;
    case "color":
      return (await db.color.count({ where })) > 0;
  }
}

/**
 * URL slugs are generated from the name and never shown in the dashboard.
 * Adds "-2", "-3"... when the slug is already used by another record.
 */
export async function uniqueSlug(model: SlugModel, name: string, excludeId?: string) {
  const base = slugify(name) || `${model.toLowerCase()}-${Date.now().toString(36)}`;
  let slug = base;
  for (let n = 2; await taken(model, slug, excludeId); n++) slug = `${base}-${n}`;
  return slug;
}
