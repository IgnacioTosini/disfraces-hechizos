ALTER TABLE "CostumeVariant" DROP CONSTRAINT "CostumeVariant_costumeId_fkey";

ALTER TABLE "CostumeVariant"
ADD CONSTRAINT "CostumeVariant_costumeId_fkey"
FOREIGN KEY ("costumeId") REFERENCES "Costume"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
