/**
 * Database Cleanup Script
 * 
 * Removes transactional data while preserving Users, Organizations, Roles, and core configuration.
 * Run with: npx ts-node prisma/cleanup.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting database cleanup...');

    // 1. Audit Logs (Standalone, no dependencies to block deletion)
    console.log('Deleting Audit Logs...');
    await prisma.auditLog.deleteMany({});

    // 2. Notifications
    console.log('Deleting Notifications...');
    await prisma.notification.deleteMany({});

    // 3. Oracle Conversations & Messages (AI Chat)
    console.log('Deleting AI Conversations...');
    // Messages cascade delete from Conversation
    await prisma.oracleConversation.deleteMany({});

    // 4. Contracts (The Big One)
    console.log('Deleting Contracts...');
    // Cascades to: Versions, Approvals, Analysis, Attachments, Chunks
    await prisma.contract.deleteMany({});

    // 5. Templates (Except Global defaults if needed, but requests asked to remove templates)
    console.log('Deleting Templates...');
    // Cascades to: Annexures, TemplateOrganization
    await prisma.template.deleteMany({});

    // 6. Saved Searches (Optional, but good for clean slate)
    console.log('Deleting Saved Searches...');
    await prisma.savedSearch.deleteMany({});

    console.log('\n✅ Cleanup complete!');
    console.log('   Preserved: Users, Organizations, Roles, Permissions, Feature Flags.');
}

main()
    .catch((e) => {
        console.error('❌ Cleanup failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
