
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createLegalHead() {
    console.log('⚖️  Setting up Generic Legal Head User...\n');

    // 1. Get ALL Organizations
    const orgs = await prisma.organization.findMany();
    if (orgs.length === 0) {
        throw new Error('❌ No organizations found in database. Please seed the database first.');
    }
    console.log(`🏢 Found ${orgs.length} Organizations: ${orgs.map(o => o.name).join(', ')}`);

    // 2. Ensure Legal Head role exists
    const legalHeadRole = await prisma.role.upsert({
        where: { code: 'LEGAL_HEAD' },
        update: {},
        create: {
            code: 'LEGAL_HEAD',
            name: 'Group Legal Head',
            description: 'Head of Legal with cross-entity oversight'
        }
    });
    console.log(`✅ Role Verified: ${legalHeadRole.name}`);

    // 3. Create/Update Legal Head User
    const email = 'legal.head@clm.com';
    const password = 'ChangeMe@123';
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            isActive: true, // Ensure active
        },
        create: {
            email,
            name: 'Legal Head (Generic)',
            passwordHash,
            mustChangePassword: false,
            isActive: true,
        }
    });
    console.log(`👤 User Verified: ${user.name} (${user.email})`);

    // 4. Assign Role to User for ALL Organizations
    for (const org of orgs) {
        await prisma.userOrganizationRole.upsert({
            where: {
                userId_organizationId_roleId: {
                    userId: user.id,
                    organizationId: org.id,
                    roleId: legalHeadRole.id,
                }
            },
            update: {},
            create: {
                userId: user.id,
                organizationId: org.id,
                roleId: legalHeadRole.id,
            }
        });
        console.log(`✅ Assigned 'Legal Head' role to user for organization '${org.name}'`);
    }

    console.log('\n🎉 Setup Complete!');
    console.log('Login Credentials:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Orgs:     All`);
}

createLegalHead()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
