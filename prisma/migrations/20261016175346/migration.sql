-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('ADULT', 'CHILD', 'UNISEX');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Costume" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "audience" "Audience" NOT NULL DEFAULT 'UNISEX',
    "rentalPrice" DECIMAL(10,2),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Costume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostumeImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "costumeId" TEXT NOT NULL,

    CONSTRAINT "CostumeImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostumeVariant" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "costumeId" TEXT NOT NULL,

    CONSTRAINT "CostumeVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalRequest" (
    "id" TEXT NOT NULL,
    "pickupDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalItem" (
    "id" TEXT NOT NULL,
    "costumeName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2),
    "rentalRequestId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "RentalItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Costume_slug_key" ON "Costume"("slug");

-- CreateIndex
CREATE INDEX "Costume_categoryId_isActive_idx" ON "Costume"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "Costume_audience_isActive_idx" ON "Costume"("audience", "isActive");

-- CreateIndex
CREATE INDEX "CostumeImage_costumeId_sortOrder_idx" ON "CostumeImage"("costumeId", "sortOrder");

-- CreateIndex
CREATE INDEX "CostumeVariant_size_idx" ON "CostumeVariant"("size");

-- CreateIndex
CREATE UNIQUE INDEX "CostumeVariant_costumeId_size_key" ON "CostumeVariant"("costumeId", "size");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "RentalRequest_status_pickupDate_idx" ON "RentalRequest"("status", "pickupDate");

-- CreateIndex
CREATE INDEX "RentalRequest_customerId_createdAt_idx" ON "RentalRequest"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "RentalItem_rentalRequestId_idx" ON "RentalItem"("rentalRequestId");

-- CreateIndex
CREATE INDEX "RentalItem_variantId_idx" ON "RentalItem"("variantId");

-- AddForeignKey
ALTER TABLE "Costume" ADD CONSTRAINT "Costume_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostumeImage" ADD CONSTRAINT "CostumeImage_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "Costume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostumeVariant" ADD CONSTRAINT "CostumeVariant_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "Costume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "CostumeVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
