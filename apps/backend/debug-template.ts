
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for Third Party Contract template...');
    const template = await prisma.template.findFirst({
        where: {
            OR: [
                { code: 'THIRD_PARTY' },
                { name: 'Third Party Contract' }
            ]
        },
    });

    if (template) {
        console.log('✅ Template FOUND:');
        console.log(JSON.stringify(template, null, 2));
    } else {
        console.log('❌ Template NOT FOUND in database.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
