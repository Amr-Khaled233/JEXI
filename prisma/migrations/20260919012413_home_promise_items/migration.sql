-- AlterTable
ALTER TABLE "HomePage" ADD COLUMN     "promiseCod" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promiseGift" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promiseShipping" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promiseSupport" BOOLEAN NOT NULL DEFAULT true;
