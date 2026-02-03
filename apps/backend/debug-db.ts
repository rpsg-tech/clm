
import { PrismaClient, TemplateCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🐞 Starting Database Debug...');

    // 1. Connection Test
    try {
        const count = await prisma.user.count();
        console.log(`✅ DB Connection OK. User count: ${count}`);
    } catch (e) {
        console.error('❌ DB Connection FAILED:', e);
        return;
    }

    // 2. Upsert Check
    console.log('🔄 Attempting template upsert...');

    // Find an admin user first
    const adminUser = await prisma.user.findFirst();
    if (!adminUser) {
        console.error('❌ No user found to assign as creator.');
        return;
    }

    const templateData = {
        name: 'Third Party Contract',
        code: 'THIRD_PARTY',
        category: TemplateCategory.OTHER,
        description: 'Generic template for imported third-party contracts',
        baseContent: `<p>This contract was uploaded from an external source.</p>`,
        isGlobal: true,
        isActive: true, // Force active
    };

    try {
        const created = await prisma.template.upsert({
            where: { code: templateData.code },
            update: {
                name: templateData.name,
                category: templateData.category,
                description: templateData.description,
                baseContent: templateData.baseContent,
                isGlobal: templateData.isGlobal,
                isActive: true,
            },
            create: {
                ...templateData,
                createdByUserId: adminUser.id,
            },
        });
        console.log('✅ Template Upsert Success:', created);
    } catch (error) {
        console.error('❌ Template Upsert Failed:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
