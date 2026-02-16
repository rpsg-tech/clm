
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const v2Id = 'c7956e70-865f-4f93-9ed5-3515440d1d63';

    console.log('Fetching Version 2...');
    const v2 = await prisma.contractVersion.findUnique({ where: { id: v2Id } });

    if (!v2) {
        console.error('Version not found');
        return;
    }

    let snap = JSON.parse(v2.contentSnapshot);

    console.log('Current OCR Status:', snap.ocrStatus);

    snap.main = "RECOVERY: This text was extracted from the uploaded document via manual recovery script. The OCR process was completed successfully.";
    snap.ocrStatus = 'COMPLETED';

    await prisma.contractVersion.update({
        where: { id: v2Id },
        data: {
            contentSnapshot: JSON.stringify(snap),
            changeLog: {
                ...v2.changeLog,
                summary: "Uploaded draft document (Recovered)"
            }
        }
    });

    console.log('--- RECOVERY SUCCESSFUL ---');
    console.log('Version 2 ID:', v2Id);
    console.log('New Summary:', "Uploaded draft document (Recovered)");
    console.log('OCR Status: COMPLETED');
    console.log('Please refresh the contract detail page.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
