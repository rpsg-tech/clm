-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "ContractChunk" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractChunk_contractId_idx" ON "ContractChunk"("contractId");

-- CreateIndex
CREATE INDEX "ContractChunk_model_version_idx" ON "ContractChunk"("model_version");

-- AddForeignKey
ALTER TABLE "ContractChunk" ADD CONSTRAINT "ContractChunk_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
