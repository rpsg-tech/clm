/**
 * Real Use Case: Setup Group Legal Counsel
 * 
 * Scenario: Priya works as Group Legal Counsel and needs to review
 * legal contracts across all RPSG Group entities (CESC, Firstsource, Quest)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupGroupCounsel() {
    console.log('🏢 Setting up Group Legal Counsel use case...\n');

    // 1. Create the Group Legal Counsel user
    const passwordHash = await bcrypt.hash('LegalCounsel@123', 12);

    const priya = await prisma.user.upsert({
        where: { email: 'priya.sharma@rpsg.com' },
        update: {},
        create: {
            email: 'priya.sharma@rpsg.com',
            name: 'Priya Sharma',
            passwordHash,
            mustChangePassword: false,
        }
    });

    console.log('✅ Created user: Priya Sharma (priya.sharma@rpsg.com)');

    // 2. Get all three entity organizations
    const cesc = await prisma.organization.findUnique({ where: { code: 'CESC' } });
    const firstsource = await prisma.organization.findUnique({ where: { code: 'FIRSTSOURCE' } });
    const quest = await prisma.organization.findUnique({ where: { code: 'QUEST' } });

    // 3. Get Legal Head role (highest legal authority)
    const legalHeadRole = await prisma.role.findUnique({ where: { code: 'LEGAL_HEAD' } });

    if (!cesc || !firstsource || !quest || !legalHeadRole) {
        throw new Error('Required organizations or role not found');
    }

    // 4. Assign Priya to all three organizations as Legal Head
    const assignments = [
        { org: cesc, name: 'CESC Limited' },
        { org: firstsource, name: 'Firstsource Solutions' },
        { org: quest, name: 'Quest Properties' },
    ];

    for (const { org, name } of assignments) {
        await prisma.userOrganizationRole.upsert({
            where: {
                userId_organizationId_roleId: {
                    userId: priya.id,
                    organizationId: org.id,
                    roleId: legalHeadRole.id,
                }
            },
            update: {},
            create: {
                userId: priya.id,
                organizationId: org.id,
                roleId: legalHeadRole.id,
            }
        });

        console.log(`✅ Assigned to ${name} as Legal Head`);
    }

    console.log('\n📊 Summary:');
    console.log('─'.repeat(50));
    console.log(`User: ${priya.name} (${priya.email})`);
    console.log(`Password: LegalCounsel@123`);
    console.log(`Role: Legal Head`);
    console.log(`Organizations: 3 (CESC, Firstsource, Quest)`);
    console.log(`Permissions per org:`);
    console.log(`  - View & approve legal contracts`);
    console.log(`  - Escalate approvals`);
    console.log(`  - View audit logs`);
    console.log(`  - Access AI analysis`);
    console.log('─'.repeat(50));

    console.log('\n🎯 What can Priya do now?');
    console.log('1. Login and see organization selector');
    console.log('2. Choose CESC → Review CESC contracts');
    console.log('3. Switch to Firstsource → Review Firstsource contracts');
    console.log('4. Switch to Quest → Review Quest contracts');
    console.log('5. Each org has isolated data\n');
}

setupGroupCounsel()
    .then(() => {
        console.log('✅ Setup complete!\n');
        console.log('Next steps:');
        console.log('1. Login as: priya.sharma@rpsg.com');
        console.log('2. Password: LegalCounsel@123');
        console.log('3. Select organization from dropdown');
        console.log('4. Start reviewing contracts!\n');
    })
    .catch((error) => {
        console.error('❌ Setup failed:', error);
    })
    .finally(() => prisma.$disconnect());
