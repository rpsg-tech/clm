import { EmailPayload, EmailResult } from '../email.service';

export interface EmailProvider {
    /**
     * Initialize connection and verify credentials
     */
    verifyConnection(): Promise<void>;

    /**
     * Send email with given configured payload
     */
    sendMail(
        payload: EmailPayload,
        subject: string,
        html: string,
        text: string
    ): Promise<EmailResult>;
}
