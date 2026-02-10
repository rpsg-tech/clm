
import { PrismaClient, TemplateCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding "Third Party Contract" template...');

    // 1. Get a valid user to assign as creator
    const adminUser = await prisma.user.findFirst();
    if (!adminUser) {
        console.error('❌ No user found to assign as creator!');
        process.exit(1);
    }

    const template = await prisma.template.upsert({
        where: { code: 'THIRD_PARTY' },
        update: {},
        create: {
            name: 'Third Party Contract',
            code: 'THIRD_PARTY',
            category: 'OTHER',
            description: 'Generic template for imported third-party contracts',
            baseContent: `<p>This contract was uploaded from an external source.</p>`,
            isGlobal: true,
            createdByUserId: adminUser.id
        }
    });

    console.log(`✅ Upserted template: ${template.name} (${template.code})`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
