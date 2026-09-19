-- CreateTable
CREATE TABLE "HomePage" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "heroImage" TEXT,
    "heroTagline" TEXT NOT NULL DEFAULT 'Timeless pieces, made to be worn every day.',
    "heroPrimaryLabel" TEXT NOT NULL DEFAULT 'Shop the collection',
    "heroPrimaryHref" TEXT NOT NULL DEFAULT '/shop',
    "heroSecondaryLabel" TEXT NOT NULL DEFAULT 'Gift boxes',
    "heroSecondaryHref" TEXT NOT NULL DEFAULT '/gift-boxes',
    "showCategories" BOOLEAN NOT NULL DEFAULT true,
    "showBestSellers" BOOLEAN NOT NULL DEFAULT true,
    "bestSellersEyebrow" TEXT NOT NULL DEFAULT 'Most loved',
    "bestSellersTitle" TEXT NOT NULL DEFAULT 'Best Sellers',
    "bestSellerIds" TEXT[],
    "showGiftBox" BOOLEAN NOT NULL DEFAULT true,
    "featuredGiftBoxId" TEXT,
    "showNewArrivals" BOOLEAN NOT NULL DEFAULT true,
    "newArrivalsEyebrow" TEXT NOT NULL DEFAULT 'Just in',
    "newArrivalsTitle" TEXT NOT NULL DEFAULT 'New Arrivals',
    "newArrivalIds" TEXT[],
    "showPromises" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePage_pkey" PRIMARY KEY ("id")
);
