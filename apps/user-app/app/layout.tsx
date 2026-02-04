import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from './providers';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { NotificationsProvider } from '@/lib/notifications-context';
import { CsrfProvider } from '@/components/providers/csrf-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: {
        template: '%s | CLM Enterprise',
        default: 'CLM Enterprise - Contract Lifecycle Management',
    },
    description: 'Secure, scalable, and intelligent contract lifecycle management for the modern enterprise.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <body className="antialiased" suppressHydrationWarning>
                <ReactQueryProvider>
                    <CsrfProvider>
                        <AuthProvider>
                            <NotificationsProvider>
                                <ToastProvider>
                                    {children}
                                </ToastProvider>
                            </NotificationsProvider>
                        </AuthProvider>
                    </CsrfProvider>
                </ReactQueryProvider>
            </body>
        </html>
    );
}
