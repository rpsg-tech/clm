'use client';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child components and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@repo/ui';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <div className="text-5xl mb-4">⚠️</div>
                            <CardTitle className="text-error">Something went wrong</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-neutral-600">
                                An unexpected error occurred. Please try again or contact support if the problem persists.
                            </p>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <pre className="mt-4 p-3 bg-neutral-100 rounded-lg text-left text-xs text-neutral-600 overflow-auto">
                                    {this.state.error.message}
                                </pre>
                            )}
                            <div className="flex justify-center gap-3">
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    Reload Page
                                </Button>
                                <Button onClick={this.handleRetry}>
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Page-level error boundary with navigation
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                    <Card className="max-w-md w-full mx-4">
                        <CardHeader className="text-center">
                            <div className="text-6xl mb-4">🔧</div>
                            <CardTitle>Page Error</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-neutral-600">
                                This page encountered an error. Try going back or refreshing.
                            </p>
                            <div className="flex justify-center gap-3">
                                <Button variant="outline" onClick={() => window.history.back()}>
                                    ← Go Back
                                </Button>
                                <Button onClick={() => window.location.reload()}>
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}
