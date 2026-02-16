
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const contractId = '6729d8ad-cdbe-47f1-9cfa-e5ae56a873e7';

    const v1 = await prisma.contractVersion.findFirst({
        where: { contractId, versionNumber: 1 },
    });

    const v2 = await prisma.contractVersion.findFirst({
        where: { contractId, versionNumber: 2 },
    });

    console.log('--- VERSION 1 ---');
    if (v1) {
        console.log('ID:', v1.id);
        console.log('ChangeLog (Raw):', JSON.stringify(v1.changeLog, null, 2));
        try {
            const snap = JSON.parse(v1.contentSnapshot as string);
            console.log('Snapshot Keys:', Object.keys(snap));
            console.log('Main Content Length:', snap.main?.length);
        } catch (e) {
            console.log('Snapshot (Raw String Length):', (v1.contentSnapshot as string)?.length);
        }
    } else {
        console.log('NOT FOUND');
    }

    console.log('\n--- VERSION 2 ---');
    if (v2) {
        console.log('ID:', v2.id);
        console.log('ChangeLog (Raw):', JSON.stringify(v2.changeLog, null, 2));
        try {
            const snap = JSON.parse(v2.contentSnapshot as string);
            console.log('Snapshot Keys:', Object.keys(snap));
            console.log('Main Content Length:', snap.main?.length);
            console.log('OCR Status:', snap.ocrStatus);
        } catch (e) {
            console.log('Snapshot (Raw String Length):', (v2.contentSnapshot as string)?.length);
        }
    } else {
        console.log('NOT FOUND');
    }
}

main().finally(() => prisma.$disconnect());
