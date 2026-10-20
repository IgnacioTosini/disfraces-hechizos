-- Add the Cloudinary public ID alongside each category image URL so the asset
-- can be safely replaced or removed later.
ALTER TABLE "Category" ADD COLUMN "imagePublicId" TEXT;
