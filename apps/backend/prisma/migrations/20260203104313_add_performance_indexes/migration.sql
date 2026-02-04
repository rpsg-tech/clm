-- CreateIndex
CREATE INDEX "Approval_contractId_status_idx" ON "Approval"("contractId", "status");

-- CreateIndex
CREATE INDEX "Approval_type_status_idx" ON "Approval"("type", "status");

-- CreateIndex
CREATE INDEX "Approval_status_createdAt_idx" ON "Approval"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_templateId_status_idx" ON "Contract"("templateId", "status");

-- CreateIndex
CREATE INDEX "Contract_status_updatedAt_idx" ON "Contract"("status", "updatedAt");
