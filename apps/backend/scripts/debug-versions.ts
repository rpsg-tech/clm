
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const contractId = '874302f4-45ca-4903-b517-14cb98f88bb1';
    console.log(`Checking versions for contract: ${contractId}`);

    const versions = await prisma.contractVersion.findMany({
        where: { contractId },
        orderBy: { versionNumber: 'asc' }
    });

    console.log(`Found ${versions.length} versions.`);

    versions.forEach(v => {
        console.log(`\n--- Version ${v.versionNumber} ---`);
        console.log(`ID: ${v.id}`);
        console.log(`Created At: ${v.createdAt}`);

        let snapshot = v.contentSnapshot;
        if (typeof snapshot === 'string') {
            try {
                snapshot = JSON.parse(snapshot);
                console.log('Snapshot (Parsed JSON):', snapshot);
            } catch {
                console.log('Snapshot (String):', snapshot?.substring(0, 100) + '...');
            }
        } else {
            console.log('Snapshot (Object):', snapshot);
        }

        // specialized check for structure
        if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
            const s = snapshot as any;
            console.log('Main Content Length:', s.main?.length);
            console.log('Annexures Length:', s.annexures?.length);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
