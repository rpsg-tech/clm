import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailProvider } from './email-provider.interface';
import { EmailPayload, EmailResult } from '../email.service';

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    fromName: string;
}

export class SmtpEmailProvider implements EmailProvider {
    private readonly logger = new Logger(SmtpEmailProvider.name);
    private readonly config: EmailConfig;
    private readonly isDevelopment: boolean;
    private readonly maxRetries = 3;
    private readonly retryDelayMs = 1000;
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.isDevelopment = this.configService.get('NODE_ENV', 'development') !== 'production';

        this.config = {
            host: this.configService.get('SMTP_HOST', 'smtp.example.com'),
            port: this.configService.get('SMTP_PORT', 587),
            secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
            user: this.configService.get('SMTP_USER', ''),
            pass: this.configService.get('SMTP_PASS', ''),
            from: this.configService.get('EMAIL_FROM', 'noreply@clm-enterprise.com'),
            fromName: this.configService.get('EMAIL_FROM_NAME', 'CLM Enterprise'),
        };

        if (!this.isDevelopment) {
            this.validateProductionConfig();
        }

        this.transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: {
                user: this.config.user,
                pass: this.config.pass,
            },
        });
    }

    private validateProductionConfig(): void {
        const required = ['host', 'user', 'pass'];
        const missing = required.filter(field => !this.config[field as keyof EmailConfig]);

        if (missing.length > 0) {
            throw new Error(
                `❌ Email service configuration error in production:\n` +
                `Missing required SMTP fields: ${missing.join(', ')}\n` +
                `Set environment variables: ${missing.map(f => `SMTP_${f.toUpperCase()}`).join(', ')}`
            );
        }
    }

    async verifyConnection(): Promise<void> {
        if (!this.isDevelopment) {
            try {
                await this.transporter.verify();
                this.logger.log('✅ SMTP connection established successfully');
            } catch (err) {
                this.logger.error(`❌ SMTP connection failed: ${(err as Error).message}`);
                throw err;
            }
        } else {
            this.logger.log('✅ SMTP connection skipped in development mode');
        }
    }

    async sendMail(
        payload: EmailPayload,
        subject: string,
        html: string,
        text: string,
        attempt = 1
    ): Promise<EmailResult> {
        try {
            this.logger.log(`Sending email via SMTP (attempt ${attempt}/${this.maxRetries}) to ${payload.to}`);

            let from = `"${this.config.fromName}" <${this.config.from}>`;

            if (payload.from) {
                from = payload.from.includes('<') ? payload.from : `"${this.config.fromName}" <${payload.from}>`;
            }

            const result = await this.transporter.sendMail({
                from: from,
                to: payload.to,
                cc: payload.cc,
                bcc: payload.bcc,
                subject: subject,
                html: html,
                text: text,
                attachments: payload.attachments,
                priority: payload.priority || 'normal',
            });

            this.logger.log(`✅ Email sent successfully (ID: ${result.messageId})`);

            return {
                success: true,
                messageId: result.messageId,
                timestamp: new Date(),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown SMTP error';
            this.logger.warn(`Email send failed (attempt ${attempt}): ${errorMessage}`);

            if (attempt < this.maxRetries) {
                const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
                await this.delay(delay);
                return this.sendMail(payload, subject, html, text, attempt + 1);
            }
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
