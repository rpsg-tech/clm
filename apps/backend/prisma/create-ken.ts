import * as dotenv from 'dotenv';
import * as path from 'path';

// Explicitly load .env from apps/backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'ken@clm.com';
    const name = 'Ken';
    const password = 'ChangeMe@123';
    const roleCode = 'BUSINESS_USER';
    const orgCode = 'CESC'; // Default entity org from seed

    console.log(`Creating user ${name} (${email})...`);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name,
            passwordHash,
            mustChangePassword: true,
            status: 'ACTIVE',
        },
    });

    console.log(`User created/updated: ${user.id}`);

    const org = await prisma.organization.findUnique({ where: { code: orgCode } });
    if (!org) throw new Error(`Org ${orgCode} not found`);

    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new Error(`Role ${roleCode} not found`);

    await prisma.userOrganizationRole.upsert({
        where: {
            userId_organizationId_roleId: {
                userId: user.id,
                organizationId: org.id,
                roleId: role.id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            organizationId: org.id,
            roleId: role.id,
        },
    });

    console.log(`Assigned role ${role.name} in org ${org.name} to ${name}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
