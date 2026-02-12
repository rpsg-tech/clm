
import { PrismaClient, ContractStatus, ApprovalStatus, ApprovalType } from '@prisma/client';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api/v1';

// Users
const MANAGER_EMAIL = 'legal.manager.test@clm.com';
const MANAGER_PASS = 'ChangeMe@123';
const HEAD_EMAIL = 'legal.head@clm.com';
const HEAD_PASS = 'ChangeMe@123';

async function setupUsers() {
    console.log('👤 Setting up Test Users...');

    // 1. Ensure Organization
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No organization found');

    // 2. Ensure Permissions exist
    const escalatePermCode = 'contract:escalate';
    let escalatePerm = await prisma.permission.findUnique({ where: { code: escalatePermCode } });
    if (!escalatePerm) {
        console.log('⚠️ Permission contract:escalate not found. Creating it...');
        escalatePerm = await prisma.permission.create({
            data: {
                code: escalatePermCode,
                name: 'Escalate Contract',
                module: 'contracts',
                description: 'Escalate to Legal Head'
            }
        });
    }

    // 3. Ensure Legal Manager Role & Permission
    let managerRole = await prisma.role.findUnique({ where: { code: 'LEGAL_MANAGER' } });
    if (!managerRole) {
        managerRole = await prisma.role.create({
            data: {
                code: 'LEGAL_MANAGER',
                name: 'Legal Manager',
                isSystem: false
            }
        });
    }

    const existingLink = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: managerRole.id, permissionId: escalatePerm.id } }
    });
    if (!existingLink) {
        await prisma.rolePermission.create({
            data: { roleId: managerRole.id, permissionId: escalatePerm.id }
        });
        console.log('✅ Added contract:escalate to LEGAL_MANAGER');
    }

    // 4. Create Manager User
    const passwordHash = await bcrypt.hash(MANAGER_PASS, 10);
    const manager = await prisma.user.upsert({
        where: { email: MANAGER_EMAIL },
        update: { passwordHash, isActive: true },
        create: {
            email: MANAGER_EMAIL,
            name: 'Test Legal Manager',
            passwordHash,
            isActive: true
        }
    });

    await prisma.userOrganizationRole.upsert({
        where: { userId_organizationId_roleId: { userId: manager.id, organizationId: org.id, roleId: managerRole.id } },
        update: {},
        create: { userId: manager.id, organizationId: org.id, roleId: managerRole.id }
    });

    // 5. Ensure Legal Head
    let headRole = await prisma.role.findUnique({ where: { code: 'LEGAL_HEAD' } });
    if (!headRole) {
        headRole = await prisma.role.create({
            data: { code: 'LEGAL_HEAD', name: 'Legal Head', isSystem: false }
        });
    }

    const head = await prisma.user.upsert({
        where: { email: HEAD_EMAIL },
        update: { passwordHash, isActive: true },
        create: {
            email: HEAD_EMAIL,
            name: 'Group Legal Head',
            passwordHash,
            isActive: true
        }
    });

    await prisma.userOrganizationRole.upsert({
        where: { userId_organizationId_roleId: { userId: head.id, organizationId: org.id, roleId: headRole.id } },
        update: {},
        create: { userId: head.id, organizationId: org.id, roleId: headRole.id }
    });

    // 6. Ensure LEGAL_HEAD has approval:legal:act
    const approveLegalPermCode = 'approval:legal:act';
    let approveLegalPerm = await prisma.permission.findUnique({ where: { code: approveLegalPermCode } });
    if (approveLegalPerm && headRole) {
        const existingHeadPerm = await prisma.rolePermission.findUnique({
            where: { roleId_permissionId: { roleId: headRole.id, permissionId: approveLegalPerm.id } }
        });
        if (!existingHeadPerm) {
            await prisma.rolePermission.create({
                data: { roleId: headRole.id, permissionId: approveLegalPerm.id }
            });
            console.log('✅ Added approval:legal:act to LEGAL_HEAD');
        }
    }

    console.log(`✅ Users Ready: Manager(${manager.id}), Head(${head.id})`);
    return { manager, head, orgId: org.id };
}

async function login(email: string, pass: string) {
    console.log(`🔐 Logging in as ${email}...`);
    const healthRes = await axios.get(`${API_URL}/health`);
    let cookieHeader = (healthRes.headers['set-cookie'] || []).map((c: string) => c.split(';')[0]).join('; ');
    let csrfToken = cookieHeader.split(';').find((c: string) => c.trim().startsWith('XSRF-TOKEN='))?.split('=')[1];

    const res = await axios.post(`${API_URL}/auth/login`, { email, password: pass }, {
        headers: { Cookie: cookieHeader, 'X-CSRF-Token': csrfToken }
    });

    const loginCookies = res.headers['set-cookie'];
    if (loginCookies) {
        const newCookies = loginCookies.map((c: string) => c.split(';')[0]);
        const oldStart = cookieHeader ? cookieHeader.split('; ') : [];
        cookieHeader = [...oldStart, ...newCookies].join('; ');
        const csrfCookie = cookieHeader.split(';').find((c: string) => c.trim().startsWith('XSRF-TOKEN='));
        csrfToken = csrfCookie ? csrfCookie.split('=')[1] : csrfToken;
    }

    return axios.create({
        baseURL: API_URL,
        headers: {
            Cookie: cookieHeader,
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json'
        },
        validateStatus: () => true
    });
}

async function run() {
    try {
        console.log('🚀 Starting Legal Escalation E2E Verification...');

        const { manager, head, orgId } = await setupUsers();

        const template = await prisma.template.findFirst();
        if (!template) throw new Error("No template found");

        // 1. Create Contract
        console.log('\n📝 Creating Test Contract (SENT_TO_LEGAL)...');
        const contract = await prisma.contract.create({
            data: {
                title: `Escalation Test ${Date.now()}`,
                status: ContractStatus.SENT_TO_LEGAL,
                reference: `ESC-${Date.now()}`,
                templateId: template.id,
                organizationId: orgId,
                createdByUserId: manager.id,
                content: 'Test content',
                annexureData: '{}',
                fieldData: {}
            }
        });
        console.log(`✅ Contract Created: ${contract.id}`);

        // 2. Login as Manager
        const managerClient = await login(MANAGER_EMAIL, MANAGER_PASS);

        // 3. Escalate
        console.log('\n🔼 Escalating to Legal Head...');
        const escalateRes = await managerClient.post(`/approvals/contracts/${contract.id}/escalate-to-legal-head`, {
            reason: 'Integration Test Escalation'
        });

        if (escalateRes.status !== 201 && escalateRes.status !== 200) {
            console.error('❌ Escalation Failed:', escalateRes.data);
            process.exit(1);
        }

        // Verify Status
        const escalatedContract = await prisma.contract.findUnique({
            where: { id: contract.id },
            include: { approvals: true }
        });

        if (escalatedContract?.status !== ContractStatus.PENDING_LEGAL_HEAD) {
            console.error(`❌ Status Mismatch. Expected ${ContractStatus.PENDING_LEGAL_HEAD}, got ${escalatedContract?.status}`);
            process.exit(1);
        }
        console.log('✅ Status updated to PENDING_LEGAL_HEAD');

        // Verify Approval by Checking Role of Actor
        const headApproval = escalatedContract.approvals.find(a =>
            a.status === ApprovalStatus.PENDING &&
            a.type === ApprovalType.LEGAL
        );

        if (!headApproval) {
            console.error('❌ No Pending Legal Approval found');
            process.exit(1);
        }

        // Verify if assigned actor is indeed a Legal Head
        if (!headApproval.actorId) {
            console.error('❌ Approval has no actorId');
            process.exit(1);
        }

        const assignedActor = await prisma.user.findUnique({
            where: { id: headApproval.actorId },
            include: {
                organizationRoles: {
                    include: { role: true }
                }
            }
        });

        const isLegalHead = assignedActor?.organizationRoles.some(r => r.role.code === 'LEGAL_HEAD');
        if (!isLegalHead) {
            console.error(`❌ Assigned actor ${headApproval.actorId} does NOT have LEGAL_HEAD role!`);
            console.log('Actor Roles:', assignedActor?.organizationRoles.map(r => r.role.code));
            process.exit(1);
        }

        console.log(`✅ Approval Assigned to Legal Head User: ${assignedActor?.email} (${assignedActor?.id})`);

        // 4. Force Logic for login
        // If the assigned actor is NOT the one we have credentials for (generic HEAD_EMAIL),
        // we might not be able to log in as them easily unless we reset their password.
        // BUT, given this is a test env, we can try to reset the password of the assigned actor to allow login.

        let headClient;
        if (assignedActor?.email === HEAD_EMAIL) {
            headClient = await login(HEAD_EMAIL, HEAD_PASS);
        } else {
            console.log(`⚠️ Assigned actor is NOT ${HEAD_EMAIL}. Resetting password for ${assignedActor?.email} to proceed...`);
            const newPass = await bcrypt.hash(HEAD_PASS, 10);
            await prisma.user.update({
                where: { id: assignedActor!.id },
                data: { passwordHash: newPass }
            });
            headClient = await login(assignedActor!.email, HEAD_PASS);
        }

        // 5. Approve
        console.log(`\n✅ Approving as Legal Head (${headApproval.id})...`);
        const approveRes = await headClient.post(`/approvals/${headApproval.id}/approve`, {
            comment: 'LGTM via E2E Script'
        });

        if (approveRes.status !== 201 && approveRes.status !== 200) {
            console.error('❌ Head Approval Failed:', approveRes.data);
            process.exit(1);
        }

        // 6. Final Verification
        const finalContract = await prisma.contract.findUnique({ where: { id: contract.id } });
        console.log(`\n🏁 Final Status: ${finalContract?.status}`);

        if (finalContract?.status === ContractStatus.APPROVED_LEGAL_HEAD || finalContract?.status === ContractStatus.APPROVED) {
            console.log('✨ SUCCESS! Contract approved.');
        } else {
            console.error('❌ Unexpected Final Status');
            process.exit(1);
        }

    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

run();
