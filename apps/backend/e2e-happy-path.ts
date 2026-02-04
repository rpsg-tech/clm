
import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './src/contracts/contracts.service';
import { ApprovalsService } from './src/approvals/approvals.service';
import { PrismaService } from './src/prisma/prisma.service';
import { UsersService } from './src/users/users.service';
import { ContractStatus } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';
import { ContractsModule } from './src/contracts/contracts.module';
import { ApprovalsModule } from './src/approvals/approvals.module';
import { UsersModule } from './src/users/users.module';
import { PrismaModule } from './src/prisma/prisma.module';
import { CommonModule } from './src/common/common.module';
import { NotificationsModule } from './src/notifications/notifications.module';
import { StorageModule } from './src/common/storage/storage.module';
import { AuditModule } from './src/audit/audit.module';

async function runE2E() {
    console.log('🚀 Starting E2E Happy Path Verification (Isolated Module)...');

    const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            PrismaModule,
            CommonModule,
            StorageModule, // Ensuring StorageService is available if CommonModule doesn't export it
            AuditModule,
            NotificationsModule,
            UsersModule,
            ContractsModule,
            ApprovalsModule
        ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const contractsService = moduleRef.get<ContractsService>(ContractsService);
    const approvalsService = moduleRef.get<ApprovalsService>(ApprovalsService);
    const prisma = moduleRef.get<PrismaService>(PrismaService);
    const usersService = moduleRef.get<UsersService>(UsersService);

    // 1. Setup Data (Users & Org)
    console.log('\n--- Step 1: Bootstrap Test Data ---');
    // Assume we have an Organization and Users from seeding.
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No Organization found. Seed DB first.');
    console.log(`Using Org: ${org.name} (${org.id})`);

    // Find targeted users
    const creator = await prisma.user.findFirst({ where: { email: { contains: 'admin' } } });
    const legalUser = await prisma.user.findFirst({ where: { email: { contains: 'legal' } } });
    const financeUser = await prisma.user.findFirst({ where: { email: { contains: 'finance' } } });

    if (!creator || !legalUser || !financeUser) throw new Error('Missing test users (admin, legal, finance). Seed DB first.');
    console.log(`Creator: ${creator.email}`);
    console.log(`Legal: ${legalUser.email}`);
    console.log(`Finance: ${financeUser.email}`);

    // 2. Create Contract (DRAFT)
    console.log('\n--- Step 2: Create Contract (DRAFT) ---');
    const template = await prisma.template.findFirst();
    if (!template) throw new Error('No templates found.');

    const contract = await contractsService.create(org.id, creator.id, {
        templateId: template.id,
        title: 'E2E Test Contract ' + Date.now(),
        amount: 50000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 365).toISOString(),
        counterpartyName: 'OmniCorp',
        counterpartyEmail: 'test@omnicorp.com',
        fieldData: {},
        annexureData: '[]'
    });
    console.log(`Contract Created: ${contract.id} (${contract.title}) - Status: ${contract.status}`);

    if (contract.status !== ContractStatus.DRAFT) throw new Error('Contract should be DRAFT');

    // 3. Submit for Approval
    console.log('\n--- Step 3: Submit for Approval ---');
    // Ensure Finance workflow is ON for this test
    await prisma.featureFlag.upsert({
        where: { organizationId_featureCode: { organizationId: org.id, featureCode: 'FINANCE_WORKFLOW' } },
        update: { isEnabled: true },
        create: { organizationId: org.id, featureCode: 'FINANCE_WORKFLOW', isEnabled: true }
    });

    const submitted = await contractsService.submitForApproval(contract.id, org.id);
    if (!submitted) throw new Error('Submission returned null contract');

    console.log(`Contract Submitted. Status: ${submitted.status}`);

    if (submitted.status !== ContractStatus.IN_REVIEW) throw new Error('Contract should be IN_REVIEW');
    const approvals1 = await prisma.approval.findMany({ where: { contractId: contract.id } });
    console.log(`Pending Approvals: ${approvals1.map(a => `${a.type}:${a.status}`).join(', ')}`);
    if (approvals1.length < 2) throw new Error('Should have Legal AND Finance approvals generated');

    // 4. Legal Approval
    console.log('\n--- Step 4: Legal Approval ---');
    const legalApproval = approvals1.find(a => a.type === 'LEGAL');
    if (!legalApproval) throw new Error('No Legal approval found');

    await approvalsService.approve(legalApproval.id, legalUser.id, org.id, 'Looks good from Legal');

    // Verify status is NOT yet fully approved (waiting for Finance)
    const contractAfterLegal = await contractsService.findById(contract.id, org.id);
    console.log(`Status after Legal: ${contractAfterLegal.status}`);

    if (contractAfterLegal.status === ContractStatus.APPROVED) throw new Error('Should NOT be APPROVED yet (waiting for Finance)');

    // 5. Finance Approval
    console.log('\n--- Step 5: Finance Approval ---');
    const approvals2 = await prisma.approval.findMany({ where: { contractId: contract.id } });
    const financeApproval = approvals2.find(a => a.type === 'FINANCE');
    if (!financeApproval) throw new Error('No Finance approval found');

    await approvalsService.approve(financeApproval.id, financeUser.id, org.id, 'Budget approved');

    // Verify Status (APPROVED)
    const contractApproved = await contractsService.findById(contract.id, org.id);
    console.log(`Status after Finance: ${contractApproved.status}`);
    if (contractApproved.status !== ContractStatus.APPROVED) throw new Error('Contract SHOULD be APPROVED now');

    // 6. Send to Counterparty
    console.log('\n--- Step 6: Send to Counterparty ---');
    await contractsService.sendToCounterparty(contract.id, org.id);
    const contractSent = await contractsService.findById(contract.id, org.id);
    console.log(`Status after Send: ${contractSent.status}`);
    if (contractSent.status !== ContractStatus.SENT_TO_COUNTERPARTY) throw new Error('Contract SHOULD be SENT_TO_COUNTERPARTY');

    // 7. Counterparty Signs (Simulate)
    console.log('\n--- Step 7: Simulate Counterparty Signature ---');
    const mockKey = `organizations/${org.id}/contracts/${contract.id}/signed/signed_contract.pdf`;
    await contractsService.confirmSignedContractUpload(contract.id, org.id, mockKey);

    const contractActive = await contractsService.findById(contract.id, org.id);
    console.log(`Final Status: ${contractActive.status}`);
    if (contractActive.status !== ContractStatus.ACTIVE) throw new Error('Contract SHOULD be ACTIVE');

    console.log('\n✅ E2E Happy Path Verified Successfully!');
    await app.close();
    process.exit(0);
}

runE2E().catch(err => {
    console.error('❌ E2E Failed:', err);
    process.exit(1);
});
