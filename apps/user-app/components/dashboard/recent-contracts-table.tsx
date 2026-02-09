import { useRouter } from 'next/navigation';
import {
    Card,
    Badge,
    Button,
    Skeleton,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@repo/ui';
import {
    FileText,
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    Mail,
    Download,
    ArrowRight,
    Briefcase
} from 'lucide-react';

interface RecentContract {
    id: string;
    title: string;
    contractCode?: string; // Add this if available or derive
    reference?: string;
    status: string;
    createdAt: string;
    amount?: number;
    counterpartyName?: string;
    template?: { name: string };
}

interface RecentContractsTableProps {
    contracts: RecentContract[];
    isLoading: boolean;
    canViewContracts: boolean;
    canEditContract?: boolean;
    canDeleteContract?: boolean;
}

export function RecentContractsTable({
    contracts,
    isLoading,
    canViewContracts,
    canEditContract,
    canDeleteContract
}: RecentContractsTableProps) {
    const router = useRouter();

    const getStatusStyles = (status: string) => {
        const statusMap: Record<string, string> = {
            DRAFT: 'bg-slate-100 text-slate-600',
            SENT_TO_LEGAL: 'bg-blue-50 text-blue-700',
            SENT_TO_FINANCE: 'bg-amber-50 text-amber-700',
            ACTIVE: 'bg-emerald-50 text-emerald-700',
            SIGNED: 'bg-indigo-50 text-indigo-700',
            REJECTED: 'bg-rose-50 text-rose-700',
            CANCELLED: 'bg-slate-50 text-slate-500 line-through',
            REVISION_REQUESTED: 'bg-rose-50 text-rose-700'
        };
        return statusMap[status] || 'bg-slate-50 text-slate-500';
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Recent Contracts</h2>
                {canViewContracts && (
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/contracts')}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold text-sm"
                    >
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                )}
            </div>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-visible">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-[15%]">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-[25%]">Title</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-[20%]">Counterparty</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-[15%]">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-[15%]">Created</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest w-[10%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="inline-flex p-4 bg-slate-50 rounded-full mb-3">
                                            <Briefcase className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No recent contracts found.</p>
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract) => (
                                    <tr key={contract.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                            {contract.reference || contract.contractCode || '---'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span
                                                    className="font-bold text-slate-900 text-sm cursor-pointer hover:text-indigo-600 transition-colors line-clamp-1"
                                                    onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                                >
                                                    {contract.title}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                                                    {contract.template?.name || 'GENERIC CONTRACT'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {contract.counterpartyName || 'External Vendor'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="secondary"
                                                className={`px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-wide border-0 ${getStatusStyles(contract.status)}`}
                                            >
                                                {formatStatus(contract.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                            {new Date(contract.createdAt).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-1 bg-white rounded-xl border border-slate-100 shadow-xl z-[50]">
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/contracts/${contract.id}`)} className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer outline-none">
                                                        <Eye className="w-4 h-4 mr-3 text-slate-400" />
                                                        Review
                                                    </DropdownMenuItem>
                                                    {canEditContract && (
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)} className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer outline-none">
                                                            <Edit2 className="w-4 h-4 mr-3 text-slate-400" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer outline-none">
                                                        <Download className="w-4 h-4 mr-3 text-slate-400" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    {canDeleteContract && (
                                                        <>
                                                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                                            <DropdownMenuItem className="flex items-center px-3 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer outline-none">
                                                                <Trash2 className="w-4 h-4 mr-3" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
