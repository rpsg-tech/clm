
import { AiService } from './src/ai/ai.service';

// Mock Config Service
const mockConfigService = {
    get: (key: string) => {
        if (key === 'GEMINI_API_KEY') return process.env.GEMINI_API_KEY || 'dummy_gemini_key';
        if (key === 'OPENAI_API_KEY') return process.env.OPENAI_API_KEY || 'dummy_openai_key';
        if (key === 'AI_MOCK_MODE') return 'false';
        return null;
    }
} as any;

async function runTest() {
    console.log('🧪 Testing AI Service (Standalone)...');

    const aiService = new AiService(mockConfigService);

    const contractContent = "This is a test contract for termination clauses.";

    // Test 1: Mock (Explicit)
    console.log('\n--- 1. Testing Default (Mock Fallback) ---');
    // Pass invalid provider to force mock? Or just check default behavior
    const mockResult = await aiService.analyzeContract(contractContent, 'Test', { provider: 'mock' } as any);
    console.log('Result:', mockResult.summary.substring(0, 50) + '...');

    // Test 2: Gemini
    console.log('\n--- 2. Testing Gemini Logic ---');
    try {
        // We expect this to fail if key is dummy, but we want to see it TRY to use Gemini
        await aiService.analyzeContract(contractContent, 'Test', { provider: 'google', model: 'gemini-1.5-flash' });
        console.log('✅ Gemini Success (Live Key Used)');
    } catch (e: any) {
        if (e.message?.includes('API key') || e.toString().includes('GoogleGenerativeAI Error')) {
            console.log('✅ Gemini Routing Confirmed (Failed on Authorization as expected with dummy key)');
        } else {
            console.log('❌ Gemini Error:', e.message);
        }
    }

    // Test 3: OpenAI
    console.log('\n--- 3. Testing OpenAI Logic ---');
    try {
        await aiService.analyzeContract(contractContent, 'Test', { provider: 'openai', model: 'gpt-3.5-turbo' });
        console.log('✅ OpenAI Success (Live Key Used)');
    } catch (e: any) {
        if (e.message?.includes('API key') || e.toString().includes('401')) {
            console.log('✅ OpenAI Routing Confirmed (Failed on Authorization as expected with dummy key)');
        } else {
            console.log('❌ OpenAI Error:', e.message);
        }
    }
}

runTest();
