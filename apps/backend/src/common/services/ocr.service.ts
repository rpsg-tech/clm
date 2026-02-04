import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';

@Injectable()
export class OcrService {
    private readonly logger = new Logger(OcrService.name);

    /**
     * Extract text from an image buffer
     * Supports PNG, JPG, BMP, PBM
     */
    async extractText(imageBuffer: Buffer, language = 'eng'): Promise<string> {
        this.logger.debug(`Starting OCR text extraction (${imageBuffer.length} bytes)`);

        let worker;
        try {
            worker = await createWorker(language);

            const { data: { text } } = await worker.recognize(imageBuffer);

            this.logger.debug(`OCR completed: extracted ${text.length} characters`);
            return text;
        } catch (error) {
            this.logger.error('OCR extraction failed:', error);
            throw new Error('Failed to extract text from image');
        } finally {
            if (worker) {
                await worker.terminate();
            }
        }
    }

    /**
     * Check if MIME type is supported for OCR
     */
    isSupported(mimetype: string): boolean {
        const supportedTypes = [
            'image/jpeg',
            'image/png',
            'image/bmp',
            'image/webp'
        ];
        return supportedTypes.includes(mimetype);
    }
}
