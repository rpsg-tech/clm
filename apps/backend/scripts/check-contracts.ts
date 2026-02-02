
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const counts = await prisma.contract.groupBy({
            by: ['status'],
            _count: true,
            _sum: {
                amount: true
            }
        });

        console.log('Contract Counts by Status:');
        console.table(counts);

        const activeSum = await prisma.contract.aggregate({
            _sum: { amount: true },
            where: {
                status: { in: ['ACTIVE', 'COUNTERSIGNED', 'APPROVED'] }
            }
        });
        console.log('Active Value Sum (ACTIVE, COUNTERSIGNED, APPROVED):', activeSum._sum.amount);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
