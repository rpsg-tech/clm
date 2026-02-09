import { Badge, Button, Card } from '@repo/ui';
import { Calendar, FileText, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ContractCardProps {
    contract: {
        id: string;
        reference: string;
        title: string;
        status: string;
        counterpartyName: string | null;
        createdAt: string;
        amount?: number;
        template: { name: string; category: string };
        createdByUser: { name: string; email: string };
    };
    statusColors: Record<string, string>;
}

export function ContractCard({ contract, statusColors }: ContractCardProps) {
    const statusClass = statusColors[contract.status.toUpperCase()] || 'bg-gray-100 text-gray-700';

    return (
        <Card className="hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
            <div className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-mono">{contract.reference}</span>
                            <h3 className="font-semibold text-slate-900 line-clamp-1" title={contract.title}>
                                {contract.title}
                            </h3>
                        </div>
                    </div>
                    <Badge className={statusClass}>
                        {contract.status.replace(/_/g, ' ')}
                    </Badge>
                </div>

                {/* Details */}
                <div className="space-y-3 flex-1">
                    <div className="flex items-center text-sm text-slate-600">
                        <User className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="truncate">{contract.counterpartyName || 'Internal / No Counterparty'}</span>
                    </div>

                    <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
                    </div>

                    {contract.amount ? (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs text-slate-500">Value</span>
                            <span className="font-semibold text-slate-900">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(contract.amount)}
                            </span>
                        </div>
                    ) : (
                        <div className="mt-2 pt-2 border-t border-slate-100 h-[26px]"></div> /* Spacer */
                    )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-0">
                    <Link href={`/dashboard/contracts/${contract.id}`} className="w-full inline-block">
                        <Button variant="outline" className="w-full justify-between group">
                            View Details
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
}
