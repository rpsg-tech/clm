/**
 * Database Seed Script
 * 
 * Populates the database with initial data for development and testing.
 * Run with: npm run db:seed
 */

import { PrismaClient, OrgType, TemplateCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ============ PERMISSIONS ============
    console.log('Creating permissions...');

    const permissionsData = [
        // Contracts
        { name: 'View Contracts', code: 'contract:view', module: 'contracts' },
        { name: 'Create Contract', code: 'contract:create', module: 'contracts' },
        { name: 'Edit Contract', code: 'contract:edit', module: 'contracts' },
        { name: 'Delete Contract', code: 'contract:delete', module: 'contracts' },
        { name: 'Submit Contract', code: 'contract:submit', module: 'contracts' },
        { name: 'Send to Counterparty', code: 'contract:send_counterparty', module: 'contracts' },
        { name: 'Upload Signed Contract', code: 'contract:upload_signed', module: 'contracts' },

        // Approvals
        { name: 'View Legal Approvals', code: 'approval:legal:view', module: 'approvals' },
        { name: 'Act on Legal Approvals', code: 'approval:legal:act', module: 'approvals' },
        { name: 'Escalate Legal Approvals', code: 'approval:legal:escalate', module: 'approvals' },
        { name: 'View Finance Approvals', code: 'approval:finance:view', module: 'approvals' },
        { name: 'Act on Finance Approvals', code: 'approval:finance:act', module: 'approvals' },

        // Templates
        { name: 'View Templates', code: 'template:view', module: 'templates' },
        { name: 'Create Template', code: 'template:create', module: 'templates' },
        { name: 'Edit Template', code: 'template:edit', module: 'templates' },

        // AI
        { name: 'Use AI Analysis', code: 'ai:analyze', module: 'ai' },
        { name: 'Use AI Chat', code: 'ai:chat', module: 'ai' },

        // Audit & Changelogs
        { name: 'View Audit Logs', code: 'audit:view', module: 'audit' },
        { name: 'View Version Changelog', code: 'contract:changelog:view', module: 'contracts' },
        { name: 'Compare Contract Versions', code: 'contract:version:compare', module: 'contracts' },

        // Admin
        { name: 'Manage Organizations', code: 'admin:org:manage', module: 'admin' },
        { name: 'Manage Users', code: 'admin:user:manage', module: 'admin' },
        { name: 'Manage Roles', code: 'admin:role:manage', module: 'admin' },
        { name: 'Govern Templates', code: 'admin:template:govern', module: 'admin' },
        { name: 'Toggle Features', code: 'admin:feature:toggle', module: 'admin' },
        { name: 'View Admin Audit Logs', code: 'admin:audit:view', module: 'admin' },
    ];

    const permissions = await Promise.all(
        permissionsData.map((p) =>
            prisma.permission.upsert({
                where: { code: p.code },
                update: {},
                create: p,
            }),
        ),
    );

    console.log(`✅ Created ${permissions.length} permissions`);

    // ============ ROLES ============
    console.log('Creating roles...');

    const businessUserPerms = ['contract:view', 'contract:create', 'contract:edit', 'contract:submit', 'template:view', 'ai:analyze', 'ai:chat'];
    const legalManagerPerms = [...businessUserPerms, 'approval:legal:view', 'approval:legal:act', 'contract:send_counterparty', 'audit:view', 'contract:changelog:view', 'contract:version:compare'];
    const legalHeadPerms = [...legalManagerPerms, 'approval:legal:escalate'];
    const financeManagerPerms = [...businessUserPerms, 'approval:finance:view', 'approval:finance:act', 'audit:view', 'contract:changelog:view', 'contract:version:compare'];
    const entityAdminPerms = ['admin:user:manage', 'admin:role:manage', 'admin:template:govern', 'admin:audit:view', 'audit:view', 'contract:changelog:view'];
    const superAdminPerms = permissionsData.map((p) => p.code);

    const rolesData = [
        { name: 'Business User', code: 'BUSINESS_USER', permissions: businessUserPerms, isSystem: true },
        { name: 'Legal Manager', code: 'LEGAL_MANAGER', permissions: legalManagerPerms, isSystem: true },
        { name: 'Legal Head', code: 'LEGAL_HEAD', permissions: legalHeadPerms, isSystem: true },
        { name: 'Finance Manager', code: 'FINANCE_MANAGER', permissions: financeManagerPerms, isSystem: true },
        { name: 'Entity Admin', code: 'ENTITY_ADMIN', permissions: entityAdminPerms, isSystem: true },
        { name: 'Super Admin', code: 'SUPER_ADMIN', permissions: superAdminPerms, isSystem: true },
    ];

    for (const roleData of rolesData) {
        const role = await prisma.role.upsert({
            where: { code: roleData.code },
            update: {},
            create: {
                name: roleData.name,
                code: roleData.code,
                isSystem: roleData.isSystem,
                description: `${roleData.name} role with predefined permissions`,
            },
        });

        // Assign permissions to role
        for (const permCode of roleData.permissions) {
            const perm = permissions.find((p) => p.code === permCode);
            if (perm) {
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: { roleId: role.id, permissionId: perm.id },
                    },
                    update: {},
                    create: { roleId: role.id, permissionId: perm.id },
                });
            }
        }
    }

    console.log(`✅ Created ${rolesData.length} roles with permissions`);

    // ============ ORGANIZATIONS ============
    console.log('Creating organizations...');

    const parentOrg = await prisma.organization.upsert({
        where: { code: 'RPSG' },
        update: {},
        create: {
            name: 'RPSG Group',
            code: 'RPSG',
            type: OrgType.PARENT,
            settings: { aiEnabled: true, maxContractsPerMonth: 1000 },
        },
    });

    const entities = [
        { name: 'CESC Limited', code: 'CESC' },
        { name: 'Firstsource Solutions', code: 'FIRSTSOURCE' },
        { name: 'Quest Properties', code: 'QUEST' },
    ];

    for (const entity of entities) {
        await prisma.organization.upsert({
            where: { code: entity.code },
            update: {},
            create: {
                name: entity.name,
                code: entity.code,
                type: OrgType.ENTITY,
                parentId: parentOrg.id,
                settings: { aiEnabled: true },
            },
        });
    }

    console.log(`✅ Created 1 parent org + ${entities.length} entity orgs`);

    // ============ USERS ============
    console.log('Creating demo users...');

    const seedPassword = process.env.SEED_PASSWORD || 'ChangeMe@123';
    const passwordHash = await bcrypt.hash(seedPassword, 12);

    const usersData = [
        { email: 'admin@clm.com', name: 'System Admin', role: 'SUPER_ADMIN' },
        { email: 'legal@clm.com', name: 'Legal Manager', role: 'LEGAL_MANAGER' },
        { email: 'finance@clm.com', name: 'Finance Manager', role: 'FINANCE_MANAGER' },
        { email: 'user@clm.com', name: 'Business User', role: 'BUSINESS_USER' },
    ];

    const cescOrg = await prisma.organization.findUnique({ where: { code: 'CESC' } });

    for (const userData of usersData) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {
                // Ensure existing users also get the new password if re-seeded
                // But typically we might want to preserve existing passwords.
                // For demo/dev environment reset, updating hash is fine.
            },
            create: {
                email: userData.email,
                name: userData.name,
                passwordHash,
                mustChangePassword: true, // Force password change on first login
            },
        });

        // Assign role to user in CESC org
        const role = await prisma.role.findUnique({ where: { code: userData.role } });
        if (role && cescOrg) {
            await prisma.userOrganizationRole.upsert({
                where: {
                    userId_organizationId_roleId: {
                        userId: user.id,
                        organizationId: cescOrg.id,
                        roleId: role.id,
                    },
                },
                update: {},
                create: {
                    userId: user.id,
                    organizationId: cescOrg.id,
                    roleId: role.id,
                },
            });
        }
    }

    console.log(`✅ Created ${usersData.length} demo users`);

    // ============ TEMPLATES ============
    console.log('Creating templates...');

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@clm.com' } });

    const templatesData = [
        {
            name: 'Non-Disclosure Agreement',
            code: 'NDA',
            category: TemplateCategory.NDA,
            description: 'Standard NDA template for confidential information sharing',
            baseContent: `<h1>Non-Disclosure Agreement</h1>
<p>This Non-Disclosure Agreement ("Agreement") is entered into by and between the parties.</p>
<h2>1. Definition of Confidential Information</h2>
<p>For purposes of this Agreement, "Confidential Information" shall include all information...</p>`,
            isGlobal: true,
        },
        {
            name: 'Service Level Agreement',
            code: 'SLA',
            category: TemplateCategory.SERVICE_AGREEMENT,
            description: 'Standard SLA for service providers',
            baseContent: `<h1>Service Level Agreement</h1>
<p>This Service Level Agreement ("SLA") is made between the parties for the provision of services.</p>
<h2>1. Service Description</h2>
<p>The Service Provider agrees to provide the following services...</p>`,
            isGlobal: true,
        },
        {
            name: 'Vendor Agreement',
            code: 'VENDOR',
            category: TemplateCategory.VENDOR_AGREEMENT,
            description: 'Agreement for vendor onboarding and engagement',
            baseContent: `<h1>Vendor Agreement</h1>
<p>This Vendor Agreement is entered into for the purpose of establishing a vendor relationship.</p>
<h2>1. Scope of Services</h2>
<p>The Vendor shall provide the following products/services...</p>`,
            isGlobal: false,
        },
    ];

    for (const template of templatesData) {
        const created = await prisma.template.upsert({
            where: { code: template.code },
            update: {},
            create: {
                ...template,
                createdByUserId: adminUser!.id,
            },
        });

        // Create annexure for each template
        await prisma.annexure.upsert({
            where: {
                id: `${created.id}-annexure-1`,
            },
            update: {},
            create: {
                id: `${created.id}-annexure-1`,
                templateId: created.id,
                name: 'Annexure I',
                title: 'Party Details',
                content: `<h3>Party Details</h3>
<p>Party Name: {{partyName}}</p>
<p>Address: {{partyAddress}}</p>
<p>Contact Person: {{contactPerson}}</p>
<p>Email: {{contactEmail}}</p>`,
                fieldsConfig: JSON.stringify([
                    { key: 'partyName', label: 'Party Name', type: 'text', required: true },
                    { key: 'partyAddress', label: 'Address', type: 'textarea', required: true },
                    { key: 'contactPerson', label: 'Contact Person', type: 'text', required: true },
                    { key: 'contactEmail', label: 'Contact Email', type: 'text', required: true },
                ]),
                order: 1,
            },
        });

        // Enable non-global templates for CESC
        if (!template.isGlobal && cescOrg) {
            await prisma.templateOrganization.upsert({
                where: {
                    templateId_organizationId: {
                        templateId: created.id,
                        organizationId: cescOrg.id,
                    },
                },
                update: {},
                create: {
                    templateId: created.id,
                    organizationId: cescOrg.id,
                    isEnabled: true,
                },
            });
        }
    }

    console.log(`✅ Created ${templatesData.length} templates with annexures`);

    // ============ FEATURE FLAGS ============
    console.log('Creating feature flags...');

    const orgs = await prisma.organization.findMany({ where: { type: OrgType.ENTITY } });

    for (const org of orgs) {
        await prisma.featureFlag.upsert({
            where: {
                organizationId_featureCode: { organizationId: org.id, featureCode: 'AI_ANALYSIS' },
            },
            update: {},
            create: {
                organizationId: org.id,
                featureCode: 'AI_ANALYSIS',
                isEnabled: true,
                config: { maxRequestsPerDay: 100 },
            },
        });

        await prisma.featureFlag.upsert({
            where: {
                organizationId_featureCode: { organizationId: org.id, featureCode: 'OCR' },
            },
            update: {},
            create: {
                organizationId: org.id,
                featureCode: 'OCR',
                isEnabled: false,
            },
        });
    }

    console.log(`✅ Created feature flags for ${orgs.length} organizations`);

    console.log('\n🎉 Database seeding complete!');
    if (!process.env.SEED_PASSWORD) {
        console.log('\n⚠️  Using default seed password: ChangeMe@123');
        console.log('   Please set SEED_PASSWORD env var for custom password.');
    }
    console.log('   All users require password change on first login.\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
