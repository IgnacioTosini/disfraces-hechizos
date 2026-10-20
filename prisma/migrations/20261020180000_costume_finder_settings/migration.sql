-- Store configurable assistant labels separately from catalog categories.
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'store',
    "costumeFinderOptions" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Costume"
ADD COLUMN "assistantTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
