/**
 * Email Service
 * 
 * Enterprise-grade email service following best practices:
 * - Configurable SMTP settings via environment
 * - Template-based emails with consistent branding
 * - Async queue support (mock for now, can integrate with Bull/Redis)
 * - Retry logic with exponential backoff
 * - Logging for all email operations
 * - Support for multiple email types (notifications, approvals, contracts)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';

// Email template types
export enum EmailTemplate {
    // Auth
    WELCOME = 'WELCOME',
    PASSWORD_RESET = 'PASSWORD_RESET',

    // Contracts
    CONTRACT_CREATED = 'CONTRACT_CREATED',
    CONTRACT_SUBMITTED = 'CONTRACT_SUBMITTED',
    CONTRACT_SENT_TO_COUNTERPARTY = 'CONTRACT_SENT_TO_COUNTERPARTY',
    CONTRACT_SIGNED = 'CONTRACT_SIGNED',
    CONTRACT_EXPIRING = 'CONTRACT_EXPIRING',

    // Approvals
    APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
    APPROVAL_APPROVED = 'APPROVAL_APPROVED',
    APPROVAL_REJECTED = 'APPROVAL_REJECTED',
    APPROVAL_ESCALATED = 'APPROVAL_ESCALATED',

    // Notifications
    // Notifications
    GENERIC_NOTIFICATION = 'GENERIC_NOTIFICATION',
    REVISION_REQUESTED = 'REVISION_REQUESTED',
    COUNTERPARTY_UPLOADED_DOCUMENT = 'COUNTERPARTY_UPLOADED_DOCUMENT',
}

// Email payload interface
export interface EmailPayload {
    to: string;
    cc?: string[];
    bcc?: string[];
    from?: string; // override FROM address
    subject: string;
    template: EmailTemplate;
    data: Record<string, unknown>;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        contentType?: string;
    }>;
    priority?: 'high' | 'normal' | 'low';
}

// Email result interface
export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp: Date;
}

// Email configuration
interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    fromName: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly config: EmailConfig;
    private readonly isDevelopment: boolean;
    private readonly maxRetries = 3;
    private readonly retryDelayMs = 1000;
    private transporter: nodemailer.Transporter;

    constructor(
        private configService: ConfigService,
        @InjectQueue('email') private emailQueue: Queue,
    ) {
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

        // CRITICAL: Validate SMTP config in production
        if (!this.isDevelopment) {
            this.validateProductionConfig();
        }

        // Initialize Nodemailer transporter
        this.transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: {
                user: this.config.user,
                pass: this.config.pass,
            },
        });

        // Verify connection configuration
        if (!this.isDevelopment) {
            this.transporter.verify()
                .then(() => this.logger.log('✅ SMTP connection established successfully'))
                .catch((err) => this.logger.error(`❌ SMTP connection failed: ${err.message}`));
        }

        this.logger.log(`Email service initialized (mode: ${this.isDevelopment ? 'development' : 'production'})`);
    }

    /**
     * Validate SMTP configuration in production mode
     * Throws error if required fields are missing
     */
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

        this.logger.log('✅ Email service SMTP configuration validated');
    }

    /**
     * Send email using template
     */
    async send(payload: EmailPayload): Promise<EmailResult> {
        try {
            await this.emailQueue.add('send', payload, {
                priority: payload.priority === 'high' ? 1 : 2,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true,
            });

            this.logger.log(`Queued email: ${payload.template} to ${payload.to}`);

            return {
                success: true,
                messageId: 'queued',
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Failed to queue email: ${(error as Error).message}`);
            // Fallback: Try sending directly if queue fails? 
            // Or just throw. For now throw.
            throw error;
        }
    }

    /**
     * Process email (called by worker)
     */
    async processEmail(payload: EmailPayload): Promise<EmailResult> {
        const startTime = Date.now();

        this.logger.log(`📧 Processing email direct: ${payload.template} to ${payload.to}`);

        try {
            // Build email content from template
            const { subject, html, text } = this.buildEmailContent(payload);

            // In development check
            if (this.isDevelopment) {
                return this.mockSend(payload, subject, html);
            }

            // In production, send via SMTP with retry
            return await this.sendWithRetry(payload, subject, html, text);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email to ${payload.to}: ${errorMessage}`);
            throw error; // Throw so BullMQ knows it failed
        }
    }

    /**
     * Send email with retry logic
     */
    /**
     * Send email with retry logic
     */
    private async sendWithRetry(
        payload: EmailPayload,
        subject: string,
        html: string,
        text: string,
        attempt = 1,
    ): Promise<EmailResult> {
        try {
            this.logger.log(`Sending email via SMTP (attempt ${attempt}/${this.maxRetries})`);

            // Use payload.from if provided, otherwise config default
            // If payload.from is just email "foo@bar.com", wrap it: "Service Name <foo@bar.com>"
            // Or assume caller provides full format if needed. 
            // Better: use config.fromName with provided email if it's just an email.
            let from = `"${this.config.fromName}" <${this.config.from}>`;

            if (payload.from) {
                // If payload.from contains name/angle brackets, use as is. 
                // If simple email, wrap with Org Name if possible, or just use it.
                // For now, trust the caller to format it or just pass the email.
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
                const delay = this.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
                await this.delay(delay);
                return this.sendWithRetry(payload, subject, html, text, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Mock send for development
     */
    private mockSend(payload: EmailPayload, subject: string, html: string): EmailResult {
        this.logger.log('─'.repeat(60));
        this.logger.log(`📨 [DEV] Email would be sent:`);
        this.logger.log(`   To: ${payload.to}`);
        if (payload.cc?.length) this.logger.log(`   CC: ${payload.cc.join(', ')}`);
        this.logger.log(`   Subject: ${subject}`);
        this.logger.log(`   Template: ${payload.template}`);
        this.logger.log(`   Data: ${JSON.stringify(payload.data, null, 2)}`);
        this.logger.log('─'.repeat(60));

        return {
            success: true,
            messageId: `dev-${Date.now()}`,
            timestamp: new Date(),
        };
    }

    /**
     * Build email content from template
     */
    private buildEmailContent(payload: EmailPayload): { subject: string; html: string; text: string } {
        const templates = this.getTemplates();
        const template = templates[payload.template];

        if (!template) {
            throw new Error(`Unknown email template: ${payload.template}`);
        }

        // Replace variables in subject and body
        let subject = payload.subject || template.subject;
        let html = template.html;
        let text = template.text;

        // Replace template variables {{variableName}}
        Object.entries(payload.data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const strValue = String(value);
            subject = subject.replace(regex, strValue);
            html = html.replace(regex, strValue);
            text = text.replace(regex, strValue);
        });

        // Wrap in base template
        html = this.wrapInBaseTemplate(html);

        return { subject, html, text };
    }

    /**
     * Get email templates
     */
    private getTemplates(): Record<EmailTemplate, { subject: string; html: string; text: string }> {
        return {
            [EmailTemplate.WELCOME]: {
                subject: 'Welcome to CLM Enterprise',
                html: `
                    <h1>Welcome to CLM Enterprise!</h1>
                    <p>Hello {{userName}},</p>
                    <p>Your account has been created successfully. You can now log in and start managing your contracts.</p>
                    <p><a href="{{loginUrl}}" class="button">Log In Now</a></p>
                `,
                text: 'Welcome to CLM Enterprise! Your account has been created.',
            },

            [EmailTemplate.PASSWORD_RESET]: {
                subject: 'Reset Your Password - CLM Enterprise',
                html: `
                    <h1>Password Reset Request</h1>
                    <p>Hello {{userName}},</p>
                    <p>You requested a password reset. Click the button below to set a new password:</p>
                    <p><a href="{{resetUrl}}" class="button">Reset Password</a></p>
                    <p><small>This link expires in 1 hour. If you didn't request this, please ignore this email.</small></p>
                `,
                text: 'Password reset requested. Visit {{resetUrl}} to reset your password.',
            },

            [EmailTemplate.CONTRACT_CREATED]: {
                subject: 'New Contract Created: {{contractTitle}}',
                html: `
                    <h1>Contract Created</h1>
                    <p>A new contract has been created:</p>
                    <div class="info-box">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Reference:</strong> {{contractReference}}</p>
                        <p><strong>Created by:</strong> {{createdBy}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">View Contract</a></p>
                `,
                text: 'New contract created: {{contractTitle}} ({{contractReference}})',
            },

            [EmailTemplate.CONTRACT_SUBMITTED]: {
                subject: 'Contract Submitted for Approval: {{contractTitle}}',
                html: `
                    <h1>Contract Submitted</h1>
                    <p>A contract has been submitted for approval:</p>
                    <div class="info-box">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Reference:</strong> {{contractReference}}</p>
                        <p><strong>Submitted by:</strong> {{submittedBy}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">Review Contract</a></p>
                `,
                text: 'Contract submitted for approval: {{contractTitle}} ({{contractReference}})',
            },

            [EmailTemplate.CONTRACT_SENT_TO_COUNTERPARTY]: {
                subject: 'Contract for Your Review: {{contractTitle}}',
                html: `
                    <h1>Contract Ready for Review</h1>
                    <p>Dear {{counterpartyName}},</p>
                    <p>A contract has been sent for your review and signature:</p>
                    <div class="info-box">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Reference:</strong> {{contractReference}}</p>
                        <p><strong>From:</strong> {{organizationName}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">Review Contract</a></p>
                    <p><small>Please review and respond within {{daysToRespond}} business days.</small></p>
                `,
                text: 'A contract is ready for your review: {{contractTitle}}',
            },

            [EmailTemplate.CONTRACT_SIGNED]: {
                subject: 'Contract Fully Executed: {{contractTitle}}',
                html: `
                    <h1>Contract Signed</h1>
                    <p>Great news! The following contract has been fully executed:</p>
                    <div class="info-box">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Reference:</strong> {{contractReference}}</p>
                        <p><strong>Signed on:</strong> {{signedDate}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">View Contract</a></p>
                `,
                text: 'Contract signed: {{contractTitle}} ({{contractReference}})',
            },

            [EmailTemplate.CONTRACT_EXPIRING]: {
                subject: '⚠️ Contract Expiring Soon: {{contractTitle}}',
                html: `
                    <h1>Contract Expiring Soon</h1>
                    <p>The following contract is expiring soon:</p>
                    <div class="info-box warning">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Reference:</strong> {{contractReference}}</p>
                        <p><strong>Expires on:</strong> {{expiryDate}}</p>
                        <p><strong>Days remaining:</strong> {{daysRemaining}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">View Contract</a></p>
                `,
                text: 'Contract expiring soon: {{contractTitle}} expires on {{expiryDate}}',
            },

            [EmailTemplate.APPROVAL_REQUIRED]: {
                subject: '🔔 Approval Required: {{contractTitle}}',
                html: `
                    <h1>Approval Required</h1>
                    <p>A contract requires your approval:</p>
                    <div class="info-box">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Reference:</strong> {{contractReference}}</p>
                        <p><strong>Approval Type:</strong> {{approvalType}}</p>
                        <p><strong>Requested by:</strong> {{requestedBy}}</p>
                    </div>
                    <p><a href="{{approvalUrl}}" class="button">Review & Approve</a></p>
                `,
                text: 'Approval required for: {{contractTitle}}. Review at {{approvalUrl}}',
            },

            [EmailTemplate.APPROVAL_APPROVED]: {
                subject: '✅ Contract Approved: {{contractTitle}}',
                html: `
                    <h1>Contract Approved</h1>
                    <p>Your contract has been approved:</p>
                    <div class="info-box success">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Approved by:</strong> {{approverName}}</p>
                        <p><strong>Comment:</strong> {{comment}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">View Contract</a></p>
                `,
                text: 'Contract approved: {{contractTitle}} by {{approverName}}',
            },

            [EmailTemplate.APPROVAL_REJECTED]: {
                subject: '❌ Contract Rejected: {{contractTitle}}',
                html: `
                    <h1>Contract Rejected</h1>
                    <p>Your contract has been rejected:</p>
                    <div class="info-box error">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Rejected by:</strong> {{approverName}}</p>
                        <p><strong>Reason:</strong> {{reason}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">View Contract</a></p>
                `,
                text: 'Contract rejected: {{contractTitle}}. Reason: {{reason}}',
            },

            [EmailTemplate.APPROVAL_ESCALATED]: {
                subject: '⬆️ Approval Escalated: {{contractTitle}}',
                html: `
                    <h1>Approval Escalated</h1>
                    <p>An approval has been escalated to you:</p>
                    <div class="info-box">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Escalated by:</strong> {{escalatedBy}}</p>
                        <p><strong>Original Approver:</strong> {{originalApprover}}</p>
                    </div>
                    <p><a href="{{approvalUrl}}" class="button">Review & Approve</a></p>
                `,
                text: 'Approval escalated for: {{contractTitle}}',
            },

            [EmailTemplate.GENERIC_NOTIFICATION]: {
                subject: '{{subject}}',
                html: `
                    <h1>{{title}}</h1>
                    <p>{{message}}</p>
                    {{#if actionUrl}}
                    <p><a href="{{actionUrl}}" class="button">{{actionText}}</a></p>
                    {{/if}}
                `,
                text: '{{title}}: {{message}}',
            },

            // @ts-ignore - dynamic enum addition or missing in interface above (will fix if needed)
            'REVISION_REQUESTED': {
                subject: '✏️ Revision Requested: {{contractTitle}}',
                html: `
                    <h1>Revision Requested</h1>
                    <p>A revision has been requested for your contract:</p>
                    <div class="info-box warning">
                        <p><strong>Title:</strong> {{contractTitle}}</p>
                        <p><strong>Requested by:</strong> {{requestedBy}}</p>
                        <p><strong>Comments:</strong> {{comment}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">Edit Contract</a></p>
                `,
                text: 'Revision requested for: {{contractTitle}}. Comment: {{comment}}',
            },
            [EmailTemplate.COUNTERPARTY_UPLOADED_DOCUMENT]: {
                subject: '📎 Signed Document Received: {{contractTitle}}',
                html: `
                    <h1>Document Uploaded</h1>
                    <p>Great news! {{counterpartyName}} has uploaded a signed copy:</p>
                    <div class="info-box success">
                        <p><strong>Contract:</strong> {{contractTitle}}</p>
                        <p><strong>Reference:</strong> {{contractReference}}</p>
                        <p><strong>Uploaded:</strong> {{uploadDate}}</p>
                    </div>
                    <p><a href="{{contractUrl}}" class="button">Review Document</a></p>
                    <p>Next steps: Review the document and activate the contract.</p>
                `,
                text: 'Signed document received for {{contractTitle}}',
            },
        };
    }

    /**
     * Wrap content in base email template with branding
     */
    private wrapInBaseTemplate(content: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CLM Enterprise</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1a1a1a;
            margin-bottom: 20px;
            font-size: 24px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 10px 0;
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #6366f1;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box.success { border-left-color: #10b981; }
        .info-box.warning { border-left-color: #f59e0b; }
        .info-box.error { border-left-color: #ef4444; }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 12px;
            color: #888;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
        <div class="footer">
            <p>© ${new Date().getFullYear()} CLM Enterprise. All rights reserved.</p>
            <p>This is an automated message. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Helper: Delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============ Convenience Methods ============

    /**
     * Send approval request email
     */
    async sendApprovalRequest(
        to: string,
        contractTitle: string,
        contractReference: string,
        approvalType: string,
        requestedBy: string,
        approvalUrl: string,
        from?: string,
    ): Promise<EmailResult> {
        return this.send({
            to,
            from,
            template: EmailTemplate.APPROVAL_REQUIRED,
            subject: `🔔 Approval Required: ${contractTitle}`,
            data: {
                contractTitle,
                contractReference,
                approvalType,
                requestedBy,
                approvalUrl,
            },
            priority: 'high',
        });
    }

    /**
     * Send contract to counterparty (Enhanced with custom fields)
     */
    async sendContractToCounterparty(
        to: string | string[],
        counterpartyName: string,
        contractTitle: string,
        contractReference: string,
        organizationName: string,
        contractUrl: string,
        options?: {
            cc?: string[];
            subject?: string;
            body?: string;
            daysToRespond?: number;
            from?: string;
        }
    ): Promise<EmailResult> {
        // Convert to array if string
        const toAddresses = Array.isArray(to) ? to : [to];
        const primaryRecipient = toAddresses[0];

        // Use custom subject or default
        const emailSubject = options?.subject || `Contract for Your Review: ${contractTitle}`;

        // ✅ FIX: Use custom body if provided
        let htmlContent: string;
        let plainText: string;

        if (options?.body) {
            // User provided custom HTML, wrap in base template
            htmlContent = this.wrapInBaseTemplate(options.body);
            plainText = options.body.replace(/<[^>]*>?/gm, ''); // Simple fallback for text version
        } else {
            // Use default template
            const content = this.buildEmailContent({
                to: primaryRecipient,
                template: EmailTemplate.CONTRACT_SENT_TO_COUNTERPARTY,
                subject: emailSubject,
                data: {
                    counterpartyName,
                    contractTitle,
                    contractReference,
                    organizationName,
                    contractUrl,
                    daysToRespond: options?.daysToRespond || 10,
                },
            });
            htmlContent = content.html;
            plainText = content.text;
        }

        // Send using the direct processing method to respect our local htmlContent
        if (this.isDevelopment) {
            return this.mockSend({ to: primaryRecipient, template: EmailTemplate.CONTRACT_SENT_TO_COUNTERPARTY, data: {}, subject: emailSubject }, emailSubject, htmlContent);
        }

        return await this.sendWithRetry(
            { to: primaryRecipient, template: EmailTemplate.CONTRACT_SENT_TO_COUNTERPARTY, data: {}, subject: emailSubject },
            emailSubject,
            htmlContent,
            plainText
        );
    }


    /**
     * Send approval result notification
     */
    async sendApprovalResult(
        to: string,
        approved: boolean,
        contractTitle: string,
        approverName: string,
        comment: string,
        contractUrl: string,
        from?: string,
    ): Promise<EmailResult> {
        return this.send({
            to,
            from,
            template: approved ? EmailTemplate.APPROVAL_APPROVED : EmailTemplate.APPROVAL_REJECTED,
            subject: approved
                ? `✅ Contract Approved: ${contractTitle}`
                : `❌ Contract Rejected: ${contractTitle}`,
            data: {
                contractTitle,
                approverName,
                comment: comment || (approved ? 'No comment' : 'No reason provided'),
                reason: comment,
                contractUrl,
            },
        });
    }

    /**
     * Send notification that counterparty uploaded a document
     */
    async sendCounterpartyUploadNotification(
        to: string,
        counterpartyName: string,
        contractTitle: string,
        contractReference: string,
        contractUrl: string,
    ): Promise<EmailResult> {
        return this.send({
            to,
            template: EmailTemplate.COUNTERPARTY_UPLOADED_DOCUMENT,
            subject: `📎 Signed Document Received: ${contractTitle}`,
            data: {
                counterpartyName,
                contractTitle,
                contractReference,
                uploadDate: new Date().toLocaleDateString(),
                contractUrl,
            },
            priority: 'high',
        });
    }
}
