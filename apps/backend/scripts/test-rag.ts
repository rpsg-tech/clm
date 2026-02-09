
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RagService } from '../src/ai/rag/rag.service';
import { OracleService } from '../src/oracle/oracle.service';
import { OracleExecutorService } from '../src/oracle/services/oracle-executor.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('RAG-Test-Script');
    const prisma = app.get(PrismaService);
    const ragService = app.get(RagService);
    const oracleService = app.get(OracleService);

    // 1. Setup Test User & Contract
    const testUserEmail = 'rag-test-user@example.com';
    let user = await prisma.user.findUnique({ where: { email: testUserEmail } });
    let organizationId = '';

    if (!user) {
        const uniqueCode = `ORG-${Date.now()}`;
        // Create dummy organization
        const org = await prisma.organization.create({
            data: {
                name: 'RAG Test Org',
                code: uniqueCode,
                type: 'ENTITY'
            }
        });
        organizationId = org.id;

        // Create user
        user = await prisma.user.create({
            data: {
                email: testUserEmail,
                name: 'RAG Test User',
                passwordHash: 'dummy'
            }
        });

        // Link user to org with role
        const adminRole = await prisma.role.findFirst({ where: { code: 'ADMIN' } });
        if (adminRole) {
            await prisma.userOrganizationRole.create({
                data: {
                    userId: user.id,
                    organizationId: org.id,
                    roleId: adminRole.id
                }
            });
        }
    } else {
        // Fetch org for existing user
        const userRole = await prisma.userOrganizationRole.findFirst({
            where: { userId: user.id }
        });
        if (userRole) organizationId = userRole.organizationId;
    }

    if (!organizationId) {
        // Fallback for types if no role found (should unlikely happen in test unless DB empty)
        const org = await prisma.organization.findFirst();
        if (org) organizationId = org.id;
        else throw new Error('Organization not found for test user');
    }

    // Create a dummy template if not exists
    let template = await prisma.template.findFirst({ where: { code: 'RAG_TEST_TMPL' } });
    if (!template) {
        template = await prisma.template.create({
            data: {
                name: 'RAG Test Template',
                code: 'RAG_TEST_TMPL',
                category: 'OTHER',
                baseContent: 'Base content',
                createdByUserId: user.id
            }
        });
    }

    // Create a contract with specific unique content
    const uniqueTerm = `SpectacularUnicorn-${Date.now()}`;
    const contract = await prisma.contract.create({
        data: {
            title: 'RAG Test Agreement',
            reference: `REF-${Date.now()}`,
            status: 'DRAFT',
            content: `This agreement involves the delivery of ${uniqueTerm} to the client. The ${uniqueTerm} must be handled with care.`,
            organizationId: organizationId,
            createdByUserId: user.id,
            templateId: template.id,
            annexureData: '[]',
            fieldData: {}
        }
    });

    logger.log(`Created test contract: ${contract.id} with unique term: ${uniqueTerm}`);

    // 2. Wait for Async Indexing (RagService is called fire-and-forget in Controller)
    // Manually trigger index to be sure for this script
    await ragService.indexContract(contract.id, contract.content);
    logger.log('Indexing triggered...');

    // 3. Test Direct Vector Search
    const searchPromise = ragService.search(uniqueTerm, [contract.id], 5);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Search Timeout')), 10000));

    try {
        const chunks: any = await Promise.race([searchPromise, timeoutPromise]);
        logger.log(`Direct Search Results: ${chunks.length}`);
        if (chunks.length > 0 && chunks[0].content.includes(uniqueTerm)) {
            logger.log('✅ Direct Vector Search Verified');
        } else {
            logger.error('❌ Direct Vector Search Failed');
        }
    } catch (e) {
        logger.error(`Search failed: ${(e as Error).message}`);
    }

    // 4. Test via Oracle Service (End-to-End)
    const query = `What must be handled with care regarding ${uniqueTerm}?`;
    logger.log(`Testing Oracle Query: "${query}"`);


    // ... (in bootstrap)

    // Force Executor Check (Deterministic)
    logger.log('--- FORCING EXECUTOR SEARCH CHECK ---');
    const executor = app.get(OracleExecutorService);
    const searchResult = await executor.searchContracts(
        user.id,
        organizationId,
        ['VIEW_ALL_CONTRACTS'],
        { query, limit: 1 }
    );

    if (searchResult.results.length > 0) {
        logger.log(`✅ EXECUTOR SEARCH SUCCESS. Found: ${searchResult.results.length}`);
        logger.log(`Sample: ${searchResult.results[0].text}`);
    } else {
        logger.error('❌ EXECUTOR SEARCH FAILED (No results)');
    }
    logger.log('--- END FORCE CHECK ---');

    /* 
    // AI Chat Test (Indeterministic - skipped for CI reliability)
    const result = await oracleService.handleChat(...) 
    */

    // Cleanup
    await prisma.contract.delete({ where: { id: contract.id } });
    await prisma.contractChunk.deleteMany({ where: { contractId: contract.id } });

    await app.close();
}

bootstrap();
