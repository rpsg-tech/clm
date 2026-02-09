
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Maximum execution time for serverless function (optional config, Vercel default is 10s-60s)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { html } = await req.json();

        if (!html) {
            return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
        }

        type ChromiumRuntime = {
            args: string[];
            defaultViewport?: { width: number; height: number } | null;
            executablePath: () => Promise<string>;
            headless?: boolean | 'new';
        };

        const chromiumRuntime = chromium as ChromiumRuntime;

        let browser;

        // Determine environment and launch appropriate browser
        if (process.env.NODE_ENV === 'development') {
            // LOCAL DEVELOPMENT: Use local Chrome installation
            // macOS standard path. Update if necessary for other OS or custom installs.
            const localExecutablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

            browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: localExecutablePath,
                headless: true,
            });
        } else {
            // PRODUCTION (Vercel): Use sparticuz/chromium
            const headlessMode =
                chromiumRuntime.headless === 'new' ? true : chromiumRuntime.headless;

            browser = await puppeteer.launch({
                args: chromiumRuntime.args,
                defaultViewport: chromiumRuntime.defaultViewport,
                executablePath: await chromiumRuntime.executablePath(),
                headless: headlessMode,
            });
        }

        const page = await browser.newPage();

        // setContent with waitUntil 'networkidle0' ensures fonts and images are loaded
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            displayHeaderFooter: false, // Can be enabled if needed
        });

        await browser.close();

        // Return PDF stream
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(pdfBuffer);
                controller.close();
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="contract.pdf"',
            },
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
