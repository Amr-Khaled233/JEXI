-- Shipping is now charged only from each governorate's fee in Shipping Zones (blank = free).
ALTER TABLE "StoreSettings" DROP COLUMN "defaultShippingFee";
