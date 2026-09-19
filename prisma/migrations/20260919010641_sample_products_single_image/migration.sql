-- Sample products keep only their cover photo. Products that have any uploaded
-- (non-sample) photo are not changed.
UPDATE "Product"
SET "images" = "images"[1:1]
WHERE cardinality("images") > 1
  AND NOT EXISTS (SELECT 1 FROM unnest("images") AS img WHERE img NOT LIKE '/samples/%');
