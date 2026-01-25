'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Spinner } from '@repo/ui';
import { SafeHtml } from '@/components/SafeHtml';

interface Contract {
    id: string;
    reference: string;
    title: string;
    status: string;
    counterpartyName: string | null;
    counterpartyEmail: string | null;
    annexureData: string;
    fieldData: Record<string, unknown>;
    createdAt: string;
    template: { name: string };
    createdByUser: { name: string; email: string };
}

export default function ContractPrintPage() {
    const params = useParams();
    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const data = await api.contracts.get(params.id as string);
                setContract(data as Contract);
            } catch (err) {
                console.error('Failed to fetch contract:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContract();
    }, [params.id]);

    useEffect(() => {
        if (!isLoading && contract) {
            // Auto-trigger print
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [isLoading, contract]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!contract) {
        return <div className="p-8 text-center">Contract not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white print:p-0">
            {/* Print Header */}
            <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold mb-2">{contract.title}</h1>
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span className="font-mono">Ref: {contract.reference}</span>
                    <span>Date: {new Date(contract.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold mb-2">Between:</h3>
                    <p className="font-medium">RPSG Group (CESC Limited)</p>
                    <p className="text-sm text-neutral-600">Represented by: {contract.createdByUser.name}</p>
                </div>
                <div>
                    <h3 className="font-bold mb-2">And:</h3>
                    <p className="font-medium">{contract.counterpartyName || '[Counterparty Name]'}</p>
                    <p className="text-sm text-neutral-600">{contract.counterpartyEmail || '[Counterparty Email]'}</p>
                </div>
            </div>

            {/* Content */}
            <div className="prose max-w-none">
                <SafeHtml html={contract.annexureData} />
            </div>

            {/* Signatures */}
            <div className="mt-16 grid grid-cols-2 gap-12">
                <div className="border-t pt-4">
                    <p className="font-bold mb-8">Role: {contract.createdByUser.name}</p>
                    <p>Signature: ______________________</p>
                    <p className="mt-2 text-sm text-neutral-500">Date: ______________________</p>
                </div>
                <div className="border-t pt-4">
                    <p className="font-bold mb-8">For: {contract.counterpartyName || 'Counterparty'}</p>
                    <p>Signature: ______________________</p>
                    <p className="mt-2 text-sm text-neutral-500">Date: ______________________</p>
                </div>
            </div>

            {/* Print button for non-print view */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 font-medium"
                >
                    Print / Save as PDF
                </button>
            </div>
        </div>
    );
}
