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
        // ============ CORE MODULES ============

        // Contracts
        { name: 'View Contracts', code: 'contract:view', module: 'Contracts', description: 'View list and details of all contracts.' },
        { name: 'Create Contracts', code: 'contract:create', module: 'Contracts', description: 'Create new contracts from templates.' },
        { name: 'Edit Contracts', code: 'contract:edit', module: 'Contracts', description: 'Modify contract details and draft content.' },
        { name: 'Delete Contracts', code: 'contract:delete', module: 'Contracts', description: 'Permanently remove contracts.' },
        { name: 'Submit for Approval', code: 'contract:submit', module: 'Contracts', description: 'Submit drafted contracts for internal review.' },
        { name: 'Send to Counterparty', code: 'contract:send', module: 'Contracts', description: 'Email contracts to external parties for signing.' },
        { name: 'Upload Signed Copy', code: 'contract:upload', module: 'Contracts', description: 'Upload final signed documents.' },
        { name: 'Download Contract', code: 'contract:download', module: 'Contracts', description: 'Download contract documents as PDF/Word.' },
        { name: 'View History & Versions', code: 'contract:history', module: 'Contracts', description: 'View audit trail and previous versions.' },

        // Templates
        { name: 'View Templates', code: 'template:view', module: 'Templates', description: 'Browse available contract templates.' },
        { name: 'Create Templates', code: 'template:create', module: 'Templates', description: 'Design new contract templates with variables.' },
        { name: 'Edit Templates', code: 'template:edit', module: 'Templates', description: 'Modify existing templates.' },
        { name: 'Delete Templates', code: 'template:delete', module: 'Templates', description: 'Remove templates from the library.' },
        { name: 'Publish Templates', code: 'template:publish', module: 'Templates', description: 'Make templates available for general use.' },

        // Approvals (Workflows)
        { name: 'Legal Review: View', code: 'approval:legal:view', module: 'Approvals', description: 'View contracts pending legal review.' },
        { name: 'Legal Review: Act', code: 'approval:legal:act', module: 'Approvals', description: 'Approve or reject contracts as Legal.' },
        { name: 'Finance Review: View', code: 'approval:finance:view', module: 'Approvals', description: 'View contracts pending finance review.' },
        { name: 'Finance Review: Act', code: 'approval:finance:act', module: 'Approvals', description: 'Approve or reject contracts as Finance.' },
        { name: 'Request Finance Review', code: 'approval:finance:request', module: 'Approvals', description: 'Manually trigger a finance review.' },

        // ============ INTELLIGENCE ============

        // AI
        { name: 'AI Analysis', code: 'ai:analyze', module: 'Intelligence', description: 'Run AI risk analysis on contracts.' },
        { name: 'AI Assistant', code: 'ai:chat', module: 'Intelligence', description: 'Use AI chatbot for contract queries.' },
        { name: 'View Analytics', code: 'analytics:view', module: 'Intelligence', description: 'Access dashboard charts and metrics.' },

        // ============ ADMINISTRATION ============

        // Identity (Users & Roles)
        { name: 'View Users', code: 'user:view', module: 'Identity Management', description: 'View list of organization users.' },
        { name: 'Manage Users', code: 'user:manage', module: 'Identity Management', description: 'Invite, edit, or deactivate users.' },
        { name: 'View Roles', code: 'role:view', module: 'Identity Management', description: 'View defined roles and permissions.' },
        { name: 'Manage Roles', code: 'role:manage', module: 'Identity Management', description: 'Create and edit custom roles.' },

        // Organization
        { name: 'View Organization', code: 'org:view', module: 'Organization', description: 'View organization details.' },
        { name: 'Create Organization', code: 'org:create', module: 'Organization', description: 'Create new organization.' },
        { name: 'Edit Organization', code: 'org:edit', module: 'Organization', description: 'Edit organization details.' },
        { name: 'Delete Organization', code: 'org:delete', module: 'Organization', description: 'Deactivate or remove organization.' },
        { name: 'Manage Organization', code: 'org:manage', module: 'Organization', description: 'Edit server settings and profile.' },

        // System
        { name: 'View Audit Logs', code: 'system:audit', module: 'System', description: 'Access global system activity logs.' },
        { name: 'Manage System Settings', code: 'system:settings', module: 'System', description: 'Configure general system settings.' },
        { name: 'Configure Modules', code: 'admin:config_modules', module: 'System', description: 'Enable/Disable AI, OCR, and other modules.' },
    ];

    // Extract codes for the "perfect" list
    const validCodes = permissionsData.map(p => p.code);

    // 1. Delete obsolete permissions (cleanup)
    const deleted = await prisma.permission.deleteMany({
        where: {
            code: { notIn: validCodes }
        }
    });
    console.log(`🗑️  Cleaned up ${deleted.count} obsolete permissions`);

    // 2. Upsert valid permissions
    const permissions = await Promise.all(
        permissionsData.map((p) =>
            prisma.permission.upsert({
                where: { code: p.code },
                update: {
                    name: p.name,
                    module: p.module,
                    description: p.description
                },
                create: p,
            }),
        ),
    );

    console.log(`✅ Created ${permissions.length} permissions`);

    // ============ ROLES ============
    console.log('Creating roles...');

    // 1. Business User (NO Admin Access)
    const businessUserPerms = [
        'contract:view', 'contract:create', 'contract:edit', 'contract:submit', 'contract:history',
        'template:view',
        'ai:analyze', 'ai:chat'
    ];

    // 2. Legal Manager
    const legalManagerPerms = [
        'contract:view', 'contract:edit', 'contract:send', 'contract:upload', 'contract:history', 'contract:download',
        'approval:legal:view', 'approval:legal:act', 'approval:finance:request',
        'system:audit',
        'template:view', 'template:create', 'template:edit',
        'analytics:view'
    ];

    // 3. Finance Manager
    const financeManagerPerms = [
        'contract:view', 'contract:history', 'contract:download',
        'approval:finance:view', 'approval:finance:act',
        'system:audit',
        'analytics:view'
    ];

    // 4. Organization Admin
    const entityAdminPerms = [
        'org:view', 'org:manage',
        'user:view', 'user:manage',
        'role:view', 'role:manage',
        'template:view', 'template:create', 'template:edit', 'template:publish',
        'system:audit', 'analytics:view', 'system:settings', 'admin:config_modules',
        // Can also view contracts to manage them
        'contract:view', 'contract:history'
    ];

    // 5. Super Admin (God Mode)
    const superAdminPerms = permissionsData.map((p) => p.code); // All Permissions

    const rolesData = [
        { name: 'Business User', code: 'BUSINESS_USER', permissions: businessUserPerms, isSystem: true },
        { name: 'Legal Manager', code: 'LEGAL_MANAGER', permissions: legalManagerPerms, isSystem: true },
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
        { email: 'admin@cesc.com', name: 'CESC Admin', role: 'ENTITY_ADMIN' },
        { email: 'legal@clm.com', name: 'Legal Manager', role: 'LEGAL_MANAGER' },
        { email: 'finance@clm.com', name: 'Finance Manager', role: 'FINANCE_MANAGER' },
        { email: 'user@clm.com', name: 'Business User', role: 'BUSINESS_USER' },
    ];

    const cescOrg = await prisma.organization.findUnique({ where: { code: 'CESC' } });
    const rpsgOrg = await prisma.organization.findUnique({ where: { code: 'RPSG' } });

    for (const userData of usersData) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                email: userData.email,
                name: userData.name,
                passwordHash,
                mustChangePassword: true,
            },
        });

        // Determine target org based on user role
        // Super Admin -> RPSG (Parent)
        // Others -> CESC (Subsidiary)
        let targetOrg = cescOrg;
        if (userData.role === 'SUPER_ADMIN') {
            targetOrg = rpsgOrg;
        }

        const role = await prisma.role.findUnique({ where: { code: userData.role } });

        if (role && targetOrg) {
            await prisma.userOrganizationRole.upsert({
                where: {
                    userId_organizationId_roleId: {
                        userId: user.id,
                        organizationId: targetOrg.id,
                        roleId: role.id,
                    },
                },
                update: {},
                create: {
                    userId: user.id,
                    organizationId: targetOrg.id,
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
        {
            name: 'Third Party Contract',
            code: 'THIRD_PARTY',
            category: TemplateCategory.OTHER, // Using OTHER as a generic fallback
            description: 'Generic template for imported third-party contracts',
            baseContent: `<p>This contract was uploaded from an external source.</p>`,
            isGlobal: true,
        },
    ];

    for (const template of templatesData) {
        console.log(`Processing template: ${template.name} (${template.code})`);
        const created = await prisma.template.upsert({
            where: { code: template.code },
            update: {
                name: template.name,
                category: template.category,
                description: template.description,
                baseContent: template.baseContent,
                isGlobal: template.isGlobal,
                isActive: true, // Force active
            },
            create: {
                ...template,
                createdByUserId: adminUser!.id,
                isActive: true,
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
