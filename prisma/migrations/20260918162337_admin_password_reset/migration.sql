-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AdminPasswordReset" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminPasswordReset_tokenHash_key" ON "AdminPasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminPasswordReset_adminId_idx" ON "AdminPasswordReset"("adminId");

-- AddForeignKey
ALTER TABLE "AdminPasswordReset" ADD CONSTRAINT "AdminPasswordReset_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
