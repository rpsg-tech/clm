
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuditLogs() {
    try {
        const logs = await prisma.auditLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        });

        console.log('Total Audit Logs found:', logs.length);
        console.log(JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error fetching logs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAuditLogs();
