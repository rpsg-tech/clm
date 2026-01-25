import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { NotificationsProvider } from '@/lib/notifications-context';
import { CsrfProvider } from '@/components/providers/csrf-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'CLM Enterprise - Contract Management',
    description: 'Enterprise Contract Lifecycle Management Platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <body className="antialiased" suppressHydrationWarning>
                <CsrfProvider>
                    <AuthProvider>
                        <NotificationsProvider>
                            <ToastProvider>
                                {children}
                            </ToastProvider>
                        </NotificationsProvider>
                    </AuthProvider>
                </CsrfProvider>
            </body>
        </html>
    );
}
