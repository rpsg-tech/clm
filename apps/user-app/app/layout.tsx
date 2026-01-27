import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { NotificationsProvider } from '@/lib/notifications-context';
import { CsrfProvider } from '@/components/providers/csrf-provider';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: {
        template: '%s | CLM Enterprise',
        default: 'CLM Enterprise - Contract Lifecycle Management',
    },
    description: 'Secure, scalable, and intelligent contract lifecycle management for the modern enterprise.',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://clm-enterprise.com',
        siteName: 'CLM Enterprise',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'CLM Enterprise Platform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@clmenterprise',
    },
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
                                <Providers>
                                    {children}
                                </Providers>
                            </ToastProvider>
                        </NotificationsProvider>
                    </AuthProvider>
                </CsrfProvider>
            </body>
        </html>
    );
}
