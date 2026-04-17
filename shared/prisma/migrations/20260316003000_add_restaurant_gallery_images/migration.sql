-- CreateTable
CREATE TABLE "restaurant_gallery_images" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "restaurant_gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restaurant_gallery_images_restaurantId_sortOrder_idx"
ON "restaurant_gallery_images"("restaurantId", "sortOrder");

-- AddForeignKey
ALTER TABLE "restaurant_gallery_images"
ADD CONSTRAINT "restaurant_gallery_images_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
