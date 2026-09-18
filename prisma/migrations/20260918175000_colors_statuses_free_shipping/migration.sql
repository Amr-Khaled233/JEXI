-- Simplify order statuses to Pending, Shipped, Delivered, Cancelled.
-- Confirmed/Processing orders become Pending; their history entries are dropped.
UPDATE "Order" SET "status" = 'PENDING' WHERE "status"::text IN ('CONFIRMED', 'PROCESSING');
DELETE FROM "OrderStatusHistory" WHERE "status"::text IN ('CONFIRMED', 'PROCESSING');

BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TABLE "OrderStatusHistory" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- Colors: fixed enum becomes a managed table. The three existing colors are kept.
-- The old enum type is renamed first: a table's row type would clash with it.
ALTER TYPE "Color" RENAME TO "Color_old";
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Color_name_key" ON "Color"("name");
CREATE UNIQUE INDEX "Color_slug_key" ON "Color"("slug");
INSERT INTO "Color" ("id", "name", "slug", "hex", "sortOrder") VALUES
  ('color_gold', 'Gold', 'gold', '#d4af37', 0),
  ('color_silver', 'Silver', 'silver', '#c0c0c0', 1),
  ('color_rose_gold', 'Rose Gold', 'rose-gold', '#b76e79', 2);

ALTER TABLE "Variant" ADD COLUMN "colorId" TEXT;
UPDATE "Variant" SET "colorId" = CASE "color"::text
  WHEN 'GOLD' THEN 'color_gold'
  WHEN 'SILVER' THEN 'color_silver'
  WHEN 'ROSE_GOLD' THEN 'color_rose_gold'
END;
ALTER TABLE "Variant" ALTER COLUMN "colorId" SET NOT NULL;
DROP INDEX "Variant_productId_color_key";
DROP INDEX "Variant_sku_key";
ALTER TABLE "Variant" DROP COLUMN "color", DROP COLUMN "sku";
CREATE UNIQUE INDEX "Variant_productId_colorId_key" ON "Variant"("productId", "colorId");
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Order items keep a snapshot of the color name.
ALTER TABLE "OrderItem" ADD COLUMN "colorName" TEXT;
UPDATE "OrderItem" SET "colorName" = CASE "color"::text
  WHEN 'GOLD' THEN 'Gold'
  WHEN 'SILVER' THEN 'Silver'
  WHEN 'ROSE_GOLD' THEN 'Rose Gold'
END;
UPDATE "OrderItem" SET "contents" = replace(replace(replace("contents"::text,
  '"ROSE_GOLD"', '"Rose Gold"'), '"GOLD"', '"Gold"'), '"SILVER"', '"Silver"')::jsonb
WHERE "contents" IS NOT NULL AND jsonb_typeof("contents") = 'array';
ALTER TABLE "OrderItem" DROP COLUMN "color", DROP COLUMN "sku";
DROP TYPE "Color_old";

-- SKUs are no longer used.
DROP INDEX "Product_sku_key";
ALTER TABLE "Product" DROP COLUMN "sku";

-- Promo codes always apply to the whole order.
ALTER TABLE "_PromoCategories" DROP CONSTRAINT "_PromoCategories_A_fkey";
ALTER TABLE "_PromoCategories" DROP CONSTRAINT "_PromoCategories_B_fkey";
ALTER TABLE "_PromoProducts" DROP CONSTRAINT "_PromoProducts_A_fkey";
ALTER TABLE "_PromoProducts" DROP CONSTRAINT "_PromoProducts_B_fkey";
DROP TABLE "_PromoCategories";
DROP TABLE "_PromoProducts";
ALTER TABLE "PromoCode" DROP COLUMN "scope";
DROP TYPE "PromoScope";

-- Free-shipping offer window.
ALTER TABLE "StoreSettings" ADD COLUMN "freeShippingStartsAt" TIMESTAMP(3), ADD COLUMN "freeShippingEndsAt" TIMESTAMP(3);
