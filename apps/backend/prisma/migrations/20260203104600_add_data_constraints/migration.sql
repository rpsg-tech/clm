-- Add CHECK constraints for data validation

-- Contract: Ensure end date is after start date
ALTER TABLE "Contract"
ADD CONSTRAINT "Contract_dates_check" 
CHECK ("endDate" IS NULL OR "startDate" IS NULL OR "endDate" > "startDate");

-- Contract: Ensure amount is positive
ALTER TABLE "Contract"
ADD CONSTRAINT "Contract_amount_positive_check" 
CHECK ("amount" IS NULL OR "amount" >= 0);

-- ContractAnalysis: Ensure risk score is between 1 and 10
ALTER TABLE "ContractAnalysis"
ADD CONSTRAINT "ContractAnalysis_risk_score_range_check" 
CHECK ("riskScore" >= 1 AND "riskScore" <= 10);

-- Approval: Ensure actedAt is set when status is not PENDING
ALTER TABLE "Approval"
ADD CONSTRAINT "Approval_acted_at_check" 
CHECK ("status" = 'PENDING' OR "actedAt" IS NOT NULL);

-- ContractAttachment: Ensure file size is positive
ALTER TABLE "ContractAttachment"
ADD CONSTRAINT "ContractAttachment_filesize_check" 
CHECK ("fileSize" IS NULL OR "fileSize" > 0);
