
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const contracts = await prisma.contract.findMany({
        where: { title: { contains: 'IT Security Audit Agreement', mode: 'insensitive' } },
        select: { id: true, title: true, reference: true },
        take: 5
    });
    console.log(JSON.stringify(contracts, null, 2));
}
main().finally(() => prisma.$disconnect());
