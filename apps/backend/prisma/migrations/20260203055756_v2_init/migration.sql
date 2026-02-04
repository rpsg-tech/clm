-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContractStatus" ADD VALUE 'LEGAL_REVIEW_IN_PROGRESS';
ALTER TYPE "ContractStatus" ADD VALUE 'FINANCE_REVIEW_IN_PROGRESS';
ALTER TYPE "ContractStatus" ADD VALUE 'IN_REVIEW';
ALTER TYPE "ContractStatus" ADD VALUE 'REVISION_REQUESTED';
ALTER TYPE "ContractStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "ContractStatus" ADD VALUE 'EXECUTED';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "amount" DECIMAL(15,2),
ADD COLUMN     "content" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ContractAttachment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "ContractAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractAttachment_contractId_idx" ON "ContractAttachment"("contractId");

-- CreateIndex
CREATE INDEX "ContractAttachment_category_idx" ON "ContractAttachment"("category");

-- CreateIndex
CREATE INDEX "Contract_updatedAt_idx" ON "Contract"("updatedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Organization_updatedAt_idx" ON "Organization"("updatedAt");

-- CreateIndex
CREATE INDEX "Role_updatedAt_idx" ON "Role"("updatedAt");

-- CreateIndex
CREATE INDEX "Template_updatedAt_idx" ON "Template"("updatedAt");

-- AddForeignKey
ALTER TABLE "ContractAttachment" ADD CONSTRAINT "ContractAttachment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
