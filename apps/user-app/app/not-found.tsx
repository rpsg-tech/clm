import Link from 'next/link';
import { Button } from '@repo/ui';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">

                {/* Abstract 404 Illustration */}
                <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 bg-orange-100 rounded-full animate-pulse" />
                    <div className="absolute inset-4 bg-orange-50 rounded-full border border-orange-200 flex items-center justify-center">
                        <FileQuestion className="w-16 h-16 text-orange-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Page not found</h1>
                    <p className="text-slate-500 text-lg">
                        The contract or page you are looking for has been moved, deleted, or possibly never existed.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/dashboard">
                        <Button size="lg" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                            <Home className="w-4 h-4" />
                            Return Home
                        </Button>
                    </Link>
                    <Link href="javascript:history.back()">
                        <Button variant="outline" size="lg" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </Button>
                    </Link>
                </div>

                <div className="pt-8 border-t border-slate-200">
                    <p className="text-xs text-slate-400">Error Code: 404</p>
                </div>
            </div>
        </div>
    );
}
