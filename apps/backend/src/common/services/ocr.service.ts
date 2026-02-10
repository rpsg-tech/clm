import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';

@Injectable()
export class OcrService {
    private readonly logger = new Logger(OcrService.name);

    /**
     * Extract text from a buffer (Image or PDF)
     */
    async extractText(buffer: Buffer, mimetype?: string, language = 'eng'): Promise<string> {
        this.logger.debug(`Starting text extraction (${buffer.length} bytes, type: ${mimetype})`);

        // 1. Handle PDF
        if (mimetype === 'application/pdf') {
            try {
                // Dynamic import for pdf-parse if needed, or standard import if treating as server-side only
                // using require to avoid strict type checks on default export if issues arise
                const pdfModule = require('pdf-parse');
                this.logger.debug(`pdf-parse loaded. Type: ${typeof pdfModule}. IsFunc: ${typeof pdfModule === 'function'}. Keys: ${Object.keys(pdfModule)}`);

                const pdf = typeof pdfModule === 'function' ? pdfModule : (pdfModule.default || pdfModule);

                if (typeof pdf !== 'function') {
                    this.logger.error(`Resolved pdf parser is not a function: ${typeof pdf}`);
                    // Inspect if it has other properties
                    this.logger.error(`Structure: ${JSON.stringify(pdfModule)}`);
                    throw new Error('pdf-parse library parsing failed');
                }

                const data = await pdf(buffer);
                this.logger.debug(`PDF extraction completed: ${data.text.length} characters`);
                return data.text;
            } catch (error) {
                this.logger.error('PDF extraction failed:', error);
                throw new Error('Failed to extract text from PDF');
            }
        }

        // 2. Handle Images (Tesseract)
        let worker;
        try {
            worker = await createWorker(language);
            const { data: { text } } = await worker.recognize(buffer);

            this.logger.debug(`OCR completed: extracted ${text.length} characters`);
            return text;
        } catch (error) {
            this.logger.error('OCR extraction failed:', error);
            // If it was supposed to be an image but failed, or unknown type
            throw new Error('Failed to extract text from image');
        } finally {
            if (worker) {
                await worker.terminate();
            }
        }
    }

    /**
     * Check if MIME type is supported for OCR/Text Extraction
     */
    isSupported(mimetype: string): boolean {
        const supportedTypes = [
            'image/jpeg',
            'image/png',
            'image/bmp',
            'image/webp',
            'application/pdf'
        ];
        return supportedTypes.includes(mimetype);
    }
}
