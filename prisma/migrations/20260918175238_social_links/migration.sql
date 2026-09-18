-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "showFacebook" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInstagram" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showTiktok" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tiktok" TEXT;
