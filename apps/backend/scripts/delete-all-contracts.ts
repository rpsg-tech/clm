
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting cleanup of all contracts...');

        // 1. Delete AuditLogs associated with contracts
        // (Required because AuditLog -> Contract relation does not have onDelete: Cascade)
        const deletedLogs = await prisma.auditLog.deleteMany({
            where: {
                contractId: {
                    not: null
                }
            }
        });
        console.log(`Deleted ${deletedLogs.count} contract-related audit logs.`);

        // 2. Delete all Contracts
        // (Cascade will handle Versions, Approvals, Attachments, Analyses, Chunks)
        const deletedContracts = await prisma.contract.deleteMany({});
        console.log(`Deleted ${deletedContracts.count} contracts.`);

        console.log('✅ Successfully removed all contracts.');
    } catch (error) {
        console.error('❌ Error deleting contracts:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
