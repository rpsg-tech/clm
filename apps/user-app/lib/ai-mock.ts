// TODO: Replace mock functions with real API calls when backend AI endpoints are ready

export interface ExtractedMetadata {
    title: string;
    counterpartyName: string;
    counterpartyEmail: string;
    startDate: string;
    endDate: string;
    amount: number | null;
    description: string;
    confidence: number;
}

export async function mockAnalyzeFile(filename: string): Promise<ExtractedMetadata> {
    await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 2000));

    const cleanName = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

    return {
        title: `Agreement - ${cleanName}`,
        counterpartyName: '',
        counterpartyEmail: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        amount: null,
        description: `Uploaded document: ${filename}`,
        confidence: 0.65 + Math.random() * 0.25,
    };
}

export interface AiChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const MOCK_RESPONSES: Record<string, string> = {
    summarize:
        'This contract outlines a service agreement between the parties. Key provisions include scope of work, payment terms, intellectual property rights, confidentiality obligations, and termination clauses. The agreement appears to follow standard commercial contract structure.',
    risk: 'Potential risk areas identified:\n\n1. **Liability Cap** — The limitation of liability clause may need review for adequate protection.\n2. **Termination** — Notice period for termination should be verified against business requirements.\n3. **IP Ownership** — Intellectual property assignment terms should be reviewed by legal.',
    payment:
        'Payment terms summary:\n\n- Payment schedule and amounts should be verified against the specific contract terms.\n- Late payment penalties and interest rates apply as specified.\n- Invoice submission and approval process details are outlined in the payment section.',
    default:
        'I can help you analyze this contract. Try asking about:\n\n- **"Summarize this contract"** for an overview\n- **"Identify risk areas"** for potential issues\n- **"Payment terms"** for financial details\n- **"Termination clauses"** for exit conditions',
};

export async function mockAiChat(query: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    const q = query.toLowerCase();
    if (q.includes('summar')) return MOCK_RESPONSES.summarize;
    if (q.includes('risk') || q.includes('issue')) return MOCK_RESPONSES.risk;
    if (q.includes('payment') || q.includes('amount') || q.includes('financial'))
        return MOCK_RESPONSES.payment;
    return MOCK_RESPONSES.default;
}

// --- Flow 4: Version Management AI stubs ---

export async function mockVersionSummary(versionNumber: number): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

    if (versionNumber === 1) {
        return 'Initial version of the contract. Establishes the core agreement structure including scope of work, payment terms, confidentiality obligations, and standard termination provisions.';
    }
    return `Version ${versionNumber} includes updates to key contract terms. Changes focus on clarifying obligations, adjusting timelines, and refining commercial terms based on negotiation feedback.`;
}

export async function mockChangeSummary(versionNumber: number): Promise<string[]> {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

    if (versionNumber <= 1) return ['Initial version — no prior changes'];

    return [
        'Payment terms adjusted from Net 30 to Net 45',
        'Liability cap increased to 2x annual contract value',
        'Termination notice period extended from 30 to 60 days',
        'Added force majeure clause in Section 8.3',
    ].slice(0, 2 + Math.floor(Math.random() * 3));
}
