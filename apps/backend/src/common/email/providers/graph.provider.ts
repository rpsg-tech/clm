import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfidentialClientApplication, Configuration as MsalConfiguration } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch'; // Required for graph client in node
import { EmailProvider } from './email-provider.interface';
import { EmailPayload, EmailResult } from '../email.service';

export class GraphEmailProvider implements EmailProvider {
    private readonly logger = new Logger(GraphEmailProvider.name);
    private msalClient: ConfidentialClientApplication;
    private graphClient: Client;
    private readonly maxRetries = 3;
    private readonly retryDelayMs = 1000;

    // The mailbox we are sending from (e.g. no-reply@contoso.com or a specific user)
    private readonly fromAddress: string;

    constructor(private readonly configService: ConfigService) {
        const tenantId = this.configService.get<string>('MS_GRAPH_TENANT_ID');
        const clientId = this.configService.get<string>('MS_GRAPH_CLIENT_ID');
        const clientSecret = this.configService.get<string>('MS_GRAPH_CLIENT_SECRET');

        // This is usually the default sending address configured in your system
        this.fromAddress = this.configService.get<string>('EMAIL_FROM', 'noreply@clm-enterprise.com');

        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Missing Microsoft Graph configuration in environment variables.');
        }

        const msalConfig: MsalConfiguration = {
            auth: {
                clientId,
                clientSecret,
                authority: `https://login.microsoftonline.com/${tenantId}`,
            }
        };

        this.msalClient = new ConfidentialClientApplication(msalConfig);

        this.initializeGraphClient();
    }

    private initializeGraphClient() {
        this.graphClient = Client.init({
            authProvider: async (done) => {
                try {
                    // Re-authenticate silently to get a fresh token before each request
                    const tokenResponse = await this.msalClient.acquireTokenByClientCredential({
                        scopes: ['https://graph.microsoft.com/.default']
                    });

                    if (tokenResponse?.accessToken) {
                        done(null, tokenResponse.accessToken);
                    } else {
                        done(new Error("Failed to acquire access token"), null);
                    }
                } catch (error) {
                    done(error, null);
                }
            }
        });
    }

    async verifyConnection(): Promise<void> {
        try {
            // Attempt to get a token as a quick verification
            await this.msalClient.acquireTokenByClientCredential({
                scopes: ['https://graph.microsoft.com/.default']
            });
            this.logger.log('✅ Microsoft Graph API connection established and authenticated successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`❌ Microsoft Graph API authentication failed: ${errorMessage}`);
            throw new Error(`Graph Connection failed: ${errorMessage}`);
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
            this.logger.log(`Sending email via MS Graph (attempt ${attempt}/${this.maxRetries}) to ${payload.to}`);

            // MS Graph message syntax
            const message: any = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: html // Can also send text: { contentType: 'Text', content: text }
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: payload.to
                        }
                    }
                ],
                // Importance mapping (low | normal | high, graph uses: low | normal | high)
                importance: payload.priority ? payload.priority : 'normal'
            };

            // CC and BCC mapping
            if (payload.cc && payload.cc.length > 0) {
                message.ccRecipients = payload.cc.map(email => ({ emailAddress: { address: email } }));
            }
            if (payload.bcc && payload.bcc.length > 0) {
                message.bccRecipients = payload.bcc.map(email => ({ emailAddress: { address: email } }));
            }

            // Optional attachments mapping
            if (payload.attachments && payload.attachments.length > 0) {
                message.attachments = payload.attachments.map(att => {
                    let contentBytes: string;
                    // Handle buffer vs base64 strings
                    if (Buffer.isBuffer(att.content)) {
                        contentBytes = att.content.toString('base64');
                    } else {
                        // Attempt to extract pure base64 if it's a data UI string, else just send it
                        contentBytes = att.content.includes('base64,')
                            ? att.content.split('base64,')[1]
                            : att.content;
                    }

                    return {
                        '@odata.type': '#microsoft.graph.fileAttachment',
                        name: att.filename,
                        contentType: att.contentType || 'application/octet-stream',
                        contentBytes: contentBytes
                    };
                });
            }

            // Using App permissions (Client Credentials flow). 
            // We must specify the user (mailbox) we are sending FROM in the URL
            // Ensure this mailbox exists in your tenant and has a license.
            const targetMailbox = payload.from || this.fromAddress;

            await this.graphClient
                .api(`/users/${targetMailbox}/sendMail`)
                .post({ message, saveToSentItems: true });

            this.logger.log(`✅ Email sent successfully via MS Graph to ${payload.to}`);

            return {
                success: true,
                messageId: `graph-${Date.now()}`,
                timestamp: new Date()
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown MS Graph error';
            this.logger.warn(`MS Graph email send failed (attempt ${attempt}): ${errorMessage}`);

            if (attempt < this.maxRetries) {
                const delay = this.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
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
