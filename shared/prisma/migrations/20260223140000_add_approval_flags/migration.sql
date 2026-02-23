-- Add approval flags for restaurateurs and livreurs
ALTER TABLE "restaurateurs" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "restaurateurs" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "livreurs" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "livreurs" ADD COLUMN "approvedAt" TIMESTAMP(3);
