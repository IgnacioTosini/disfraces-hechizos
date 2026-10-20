CREATE TABLE "AvailabilityAlert" (
    "id" TEXT NOT NULL,
    "fromDate" DATE NOT NULL,
    "throughDate" DATE NOT NULL,
    "contactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    CONSTRAINT "AvailabilityAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AvailabilityAlert_contactedAt_createdAt_idx" ON "AvailabilityAlert"("contactedAt", "createdAt");
CREATE INDEX "AvailabilityAlert_variantId_fromDate_throughDate_idx" ON "AvailabilityAlert"("variantId", "fromDate", "throughDate");

ALTER TABLE "AvailabilityAlert" ADD CONSTRAINT "AvailabilityAlert_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AvailabilityAlert" ADD CONSTRAINT "AvailabilityAlert_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "CostumeVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
