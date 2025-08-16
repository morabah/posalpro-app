-- DropIndex
DROP INDEX "products_isActive_category_idx";

-- CreateIndex
CREATE INDEX "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "products_isActive_price_idx" ON "products"("isActive", "price");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products" USING GIN ("category");

-- CreateIndex
CREATE INDEX "products_tags_idx" ON "products" USING GIN ("tags");
