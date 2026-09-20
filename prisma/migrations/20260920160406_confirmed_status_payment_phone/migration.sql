-- Orders wait for the customer to send the shipping fee, then the admin confirms them.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED' BEFORE 'SHIPPED';

-- Phone or wallet number the shipping fee is sent to.
ALTER TABLE "StoreSettings" ADD COLUMN "paymentPhone" TEXT;
