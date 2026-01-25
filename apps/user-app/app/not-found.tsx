import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@repo/ui';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
            <div className="w-24 h-24 bg-neutral-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-neutral-100 animate-in zoom-in-50 duration-500">
                <FileQuestion className="w-12 h-12 text-neutral-400" />
            </div>

            <h1 className="text-4xl font-bold text-neutral-900 tracking-tight mb-2">Page Not Found</h1>
            <p className="text-neutral-500 max-w-md mb-8">
                Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
            </p>

            <Link href="/dashboard">
                <Button className="pl-4 pr-5 shadow-lg shadow-primary-500/20">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
    );
}
