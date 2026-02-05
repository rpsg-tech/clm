import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(request: NextRequest) {
    try {
        // Get all cookies and CSRF token to forward to backend
        const cookieHeader = request.headers.get('cookie') || '';
        const csrfToken = request.headers.get('x-csrf-token') || '';

        const headers: Record<string, string> = {
            'Cookie': cookieHeader
        };

        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await fetch(`${BACKEND_URL}/oracle/usage`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Oracle usage error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
