
import { PrismaClient, ContractStatus } from '@prisma/client';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api/v1';
const USER_EMAIL = 'legal@clm.com';
const USER_PASS = 'ChangeMe@123';

async function runHybridSimulation() {
    try {
        console.log('🚀 Starting Hybrid E2E Simulation...');

        // 1. Initial Handshake (Get CSRF Token)
        console.log('\n🤝 Performing Initial Handshake...');
        const healthRes = await axios.get(`${API_URL}/health`);
        const initialCookies = healthRes.headers['set-cookie'];

        let csrfToken = null;
        let cookieHeader = '';

        if (initialCookies) {
            cookieHeader = initialCookies.map((c: string) => c.split(';')[0]).join('; ');
            const csrfCookie = cookieHeader.split(';').find((c: string) => c.trim().startsWith('XSRF-TOKEN='));
            csrfToken = csrfCookie ? csrfCookie.split('=')[1] : null;
            console.log('✅ CSRF Token Obtained');
        }

        // 2. Authenticate
        console.log('\n🔐 Authenticating...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASS
        }, {
            headers: {
                Cookie: cookieHeader,
                'X-CSRF-Token': csrfToken
            }
        });

        // Merge cookies (session + csrf)
        const loginCookies = loginRes.headers['set-cookie'];
        if (loginCookies) {
            const newCookies = loginCookies.map((c: string) => c.split(';')[0]);
            // Simple merge strategy
            const oldCookies = cookieHeader.split('; ').filter(c => !!c);
            cookieHeader = [...oldCookies, ...newCookies].join('; ');

            // Update CSRF if rotated
            const csrfCookie = cookieHeader.split(';').find((c: string) => c.trim().startsWith('XSRF-TOKEN='));
            csrfToken = csrfCookie ? csrfCookie.split('=')[1] : csrfToken;
        }

        const client = axios.create({
            baseURL: API_URL,
            headers: {
                Cookie: cookieHeader,
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken // Add CSRF header
            },
            validateStatus: () => true
        });

        // 2. Data Setup (Prisma)
        console.log('\n⚙️  Setting up test data...');
        const template = await prisma.template.findFirst({ where: { code: 'NDA' } });
        if (!template) throw new Error('Template not found');

        // 3. Create Contract (HTTP) - To test API validation
        console.log('\n📝 Creating Contract (via API)...');
        const createRes = await client.post('/contracts', {
            templateId: template.id,
            title: `E2E Upload Test ${Date.now()}`,
            counterpartyName: 'Test Corp',
            annexureData: '<p>Test</p>',
            fieldData: {},
            startDate: new Date().toISOString(),
        });

        if (createRes.status !== 201) {
            console.error('❌ Create Failed:', createRes.data);
            process.exit(1);
        }
        const contractId = createRes.data.id;
        console.log(`✅ Contract Created: ${createRes.data.reference}`);

        // 4. Force State Transition (Prisma)
        console.log('\n⏭️  Skipping Approvals (Database Update)...');
        await prisma.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.SENT_TO_COUNTERPARTY,
                sentAt: new Date()
            }
        });
        console.log('✅ Contract moved to SENT_TO_COUNTERPARTY status');

        // 5. CRITICAL: Test Upload Flow (HTTP)
        console.log('\n📤 Testing Secure Upload Flow...');

        // Step A: Get URL
        console.log('   A. Requesting Upload URL...');
        const filename = 'test-signed-contract.pdf';
        const contentType = 'application/pdf';

        const urlRes = await client.post(`/contracts/${contractId}/upload-url`, {
            filename,
            contentType
        });

        if (urlRes.status !== 201) {
            console.error('❌ Get URL Failed:', urlRes.data);
            process.exit(1);
        }

        const { uploadUrl, key } = urlRes.data;
        console.log('   ✅ Received Presigned URL');

        // Step B: Upload to S3
        console.log('   B. Uploading "Fake PDF" to S3...');
        const fixturePath = path.resolve(__dirname, 'fixtures/test.pdf');
        if (!fs.existsSync(fixturePath)) throw new Error('Fixture not found');
        const pdfContent = fs.readFileSync(fixturePath);

        const uploadRes = await axios.put(uploadUrl, pdfContent, {
            headers: { 'Content-Type': contentType }
        });

        if (uploadRes.status !== 200) {
            console.error('❌ S3 Upload Failed:', uploadRes.statusText);
            process.exit(1);
        }
        console.log('   ✅ S3 Upload Successful');

        // Step C: Confirm Upload
        console.log('   C. Confirming Upload to Backend...');
        const confirmRes = await client.post(`/contracts/${contractId}/upload-confirm`, {
            key,
            filename
        });

        if (confirmRes.status !== 201) {
            console.error('❌ Confirmation Failed:', confirmRes.data);
            process.exit(1);
        }
        console.log('   ✅ Backend Confirmation Successful');

        // 6. Final Verification
        const finalContract = await prisma.contract.findUnique({ where: { id: contractId } });
        if (finalContract?.status === ContractStatus.ACTIVE) {
            console.log('\n✨ SUCCESS! Contract is ACTIVE.');
        } else {
            console.error('\n❌ Final status mismatch:', finalContract?.status);
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Verification Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runHybridSimulation();
