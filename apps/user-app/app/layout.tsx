/* eslint-disable @next/next/no-page-custom-font */
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
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </head>
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
