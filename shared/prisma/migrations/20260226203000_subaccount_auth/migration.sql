-- AlterTable
ALTER TABLE "restaurant_sub_accounts"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- Backfill temporary password hash marker for existing rows
UPDATE "restaurant_sub_accounts"
SET "passwordHash" = '$2a$10$8mIh9drB3mFf2QhJisJYwO4x9KpsF4j5Y7gF9mI.2mM4dA0x3x3m2'
WHERE "passwordHash" IS NULL;

-- Enforce not null
ALTER TABLE "restaurant_sub_accounts"
ALTER COLUMN "passwordHash" SET NOT NULL;

-- Unique email for login
CREATE UNIQUE INDEX "restaurant_sub_accounts_email_key" ON "restaurant_sub_accounts"("email");
