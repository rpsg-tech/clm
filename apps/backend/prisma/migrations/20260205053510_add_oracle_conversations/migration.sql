-- CreateTable
CREATE TABLE "OracleConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OracleConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tier" INTEGER,
    "tokensUsed" INTEGER,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "functionCalled" TEXT,
    "dataScope" TEXT,
    "contractsAccessed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OracleConversation_userId_createdAt_idx" ON "OracleConversation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OracleConversation_organizationId_createdAt_idx" ON "OracleConversation"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OracleConversation_isActive_idx" ON "OracleConversation"("isActive");

-- CreateIndex
CREATE INDEX "OracleMessage_conversationId_createdAt_idx" ON "OracleMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "OracleMessage_tier_idx" ON "OracleMessage"("tier");

-- AddForeignKey
ALTER TABLE "OracleConversation" ADD CONSTRAINT "OracleConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleConversation" ADD CONSTRAINT "OracleConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleMessage" ADD CONSTRAINT "OracleMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "OracleConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
