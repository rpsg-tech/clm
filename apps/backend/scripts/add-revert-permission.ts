
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Permission Migration: contract:revert');

    // 1. Create or Find the Permission
    const permissionCode = 'contract:revert';

    const permission = await prisma.permission.upsert({
        where: { code: permissionCode },
        update: {},
        create: {
            name: 'Revert Contract Status',
            code: permissionCode,
            module: 'Contracts',
            description: 'Allows reverting an Active contract back to Negotiation phase.',
        },
    });

    console.log(`✅ Permission ensured: ${permission.code}`);

    // 2. Assign to Roles: SUPER_ADMIN, ENTITY_ADMIN, LEGAL_HEAD
    const targetRoleCodes = ['SUPER_ADMIN', 'ENTITY_ADMIN', 'LEGAL_HEAD'];

    for (const roleCode of targetRoleCodes) {
        const role = await prisma.role.findUnique({ where: { code: roleCode } });

        if (role) {
            // Check if already assigned
            const existing = await prisma.rolePermission.findUnique({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: permission.id
                    }
                }
            });

            if (!existing) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: role.id,
                        permissionId: permission.id
                    }
                });
                console.log(`➕ Assigned to role: ${roleCode}`);
            } else {
                console.log(`ℹ️ Already assigned to: ${roleCode}`);
            }
        } else {
            console.warn(`⚠️ Role not found: ${roleCode}`);
        }
    }

    console.log('✅ Migration completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
