/*
  Warnings:

  - The values [PENDING_LEGAL,PENDING_FINANCE,FINANCE_APPROVED] on the enum `ContractStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContractStatus_new" AS ENUM ('DRAFT', 'SENT_TO_LEGAL', 'LEGAL_REVIEW_IN_PROGRESS', 'SENT_TO_FINANCE', 'FINANCE_REVIEW_IN_PROGRESS', 'IN_REVIEW', 'REVISION_REQUESTED', 'LEGAL_APPROVED', 'FINANCE_REVIEWED', 'APPROVED', 'SENT_TO_COUNTERPARTY', 'COUNTERSIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'REJECTED', 'CANCELLED', 'EXECUTED');
ALTER TABLE "public"."Contract" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Contract" ALTER COLUMN "status" TYPE "ContractStatus_new" USING ("status"::text::"ContractStatus_new");
ALTER TYPE "ContractStatus" RENAME TO "ContractStatus_old";
ALTER TYPE "ContractStatus_new" RENAME TO "ContractStatus";
DROP TYPE "public"."ContractStatus_old";
ALTER TABLE "Contract" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
