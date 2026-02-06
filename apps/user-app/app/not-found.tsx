import Link from 'next/link';
import { Button } from '@repo/ui';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <div className="max-w-md w-full text-center space-y-4">
                <h2 className="text-2xl font-semibold text-neutral-900">Page Not Found</h2>
                <p className="text-neutral-600">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link href="/dashboard">
                    <Button>Go to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
}
