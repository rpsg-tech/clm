
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'http://localhost:3001/api/v1';
const USER_EMAIL = 'legal@clm.com';
const USER_PASS = 'ChangeMe@123'; // Default seed password

async function runSimulation() {
    try {
        console.log('🚀 Starting CLM LifeCycle Simulation...');

        // 1. Authenticate
        console.log('\n🔐 Authenticating...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASS
        });

        // We need to capture the cookie manually if using axios in node
        const cookies = loginRes.headers['set-cookie'];
        if (!cookies) throw new Error('No cookies received');
        const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

        // Helper for authorized requests
        const client = axios.create({
            baseURL: API_URL,
            headers: {
                Cookie: cookieHeader,
                'Content-Type': 'application/json'
            },
            validateStatus: () => true // Don't throw on errors immediately
        });

        // 2. Get Organization Context
        const meRes = await client.get('/auth/me');
        const orgId = meRes.data.currentOrg.id;
        console.log(`✅ Logged in as: ${meRes.data.user.name} (Org: ${meRes.data.currentOrg.name})`);

        // 3. Get a Template
        console.log('\n📄 Fetching Templates...');
        const templatesRes = await client.get('/templates');
        const template = templatesRes.data.data.find((t: any) => t.code === 'NDA');
        if (!template) throw new Error('NDA Template not found. Did you seed?');
        console.log(`✅ Using Template: ${template.name}`);

        // 4. Create Contract
        console.log('\n📝 Creating Contract...');
        const createRes = await client.post('/contracts', {
            templateId: template.id,
            title: `E2E Test Contract ${Date.now()}`,
            counterpartyName: 'Acme Corp',
            counterpartyEmail: 'partner@acme.com',
            annexureData: '<p>Standard Terms...</p>',
            fieldData: {},
            startDate: new Date().toISOString(),
        });

        if (createRes.status !== 201) {
            console.error('Create Failed:', createRes.data);
            process.exit(1);
        }
        const contractId = createRes.data.id;
        console.log(`✅ Contract Created! ID: ${contractId} (Ref: ${createRes.data.reference})`);

        // 5. Submit for Approval
        console.log('\n📤 Submitting for Approval...');
        await client.post(`/contracts/${contractId}/submit`);

        // --- HACK: Force Approve via DB Access is tricky in HTTP script ---
        // INSTEAD: We will assume we can "Send to Counterparty" only after approval.
        // Since we logged in as LEGAL_MANAGER, let's see if we can self-approve or skip.
        // Wait, the rule is: APPROVED status required to send.
        // For this E2E test to effectively run "Sample Upload", we need the contract in SENT_TO_COUNTERPARTY.
        // As an AI agent, I will use a special direct-DB update via script logic if needed, 
        // OR I can use the Approvals API if I am authorized.
        // Legal Manager has 'approval:legal:act'.

        // 5b. Find Pending Approvals and Approve
        console.log('   Finding approvals...');
        const contractRes = await client.get(`/contracts/${contractId}`);
        const approvals = contractRes.data.approvals;

        for (const app of approvals) {
            console.log(`   Approving as ${app.type}...`);
            // In real app, FINANCE would be a different user. 
            // Here, if permissions allow, we try. If not, we might fail here.
            // Seed data says LEGAL_MANAGER has 'approval:legal:act' but NOT finance.
            // This is a blocker for pure HTTP simulation.

            // WORKAROUND: I will update the contract status via a separate pure-Prisma script logic 
            // OR simpler: rely on a "backdoor" or just skip to upload if feasible (it's not, guards prevent it).

            // Better approach: Login as Super Admin? 
            // Seed says Super Admin has ALL permissions.
        }
    } catch (error) {
        console.error('❌ Simulation Failed:', error);
    }
}
// ... wait, re-writing strategy ...
