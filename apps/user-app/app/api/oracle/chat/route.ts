import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function POST(request: NextRequest) {
    try {
        // Get all cookies and CSRF token to forward to backend
        const cookieHeader = request.headers.get('cookie') || '';
        const csrfToken = request.headers.get('x-csrf-token') || '';

        const body = await request.json();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Cookie': cookieHeader
        };

        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await fetch(`${BACKEND_URL}/oracle/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Oracle chat error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
