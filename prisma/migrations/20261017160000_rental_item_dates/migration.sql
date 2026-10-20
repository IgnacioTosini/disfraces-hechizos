ALTER TABLE "RentalItem"
ADD COLUMN "pickupDate" DATE,
ADD COLUMN "returnDate" DATE;

UPDATE "RentalItem" AS item
SET "pickupDate" = request."pickupDate",
    "returnDate" = request."returnDate"
FROM "RentalRequest" AS request
WHERE item."rentalRequestId" = request."id";

ALTER TABLE "RentalItem"
ALTER COLUMN "pickupDate" SET NOT NULL,
ALTER COLUMN "returnDate" SET NOT NULL;
