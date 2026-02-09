'use client';

import { use } from 'react';
import { useContract } from '@/lib/hooks/use-contract';
import { EditWorkspace } from '@/components/contracts/edit-workspace';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Skeleton } from '@repo/ui';
import Link from 'next/link';
import type { Contract } from '@repo/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ContractEditPage({ params }: PageProps) {
    const { id } = use(params);
    const { data: contract, isLoading, error } = useContract(id);

    if (isLoading) {
        return (
            <div className="-m-6 flex h-[calc(100vh-4rem)]">
                <div className="w-72 border-r border-neutral-200 bg-white p-4 space-y-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <div className="mt-8 space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 rounded-lg" />
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-8">
                    <Skeleton className="h-10 w-full mb-4" />
                    <Skeleton className="h-96 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="text-center py-16">
                <MaterialIcon name="error_outline" size={40} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500 mb-2">
                    {error instanceof Error ? error.message : 'Contract not found.'}
                </p>
                <Link href="/dashboard/contracts" className="text-sm text-primary-700 font-medium">
                    Back to Contracts
                </Link>
            </div>
        );
    }

    const contractData = contract as Contract;
    return <EditWorkspace contract={contractData} />;
}
