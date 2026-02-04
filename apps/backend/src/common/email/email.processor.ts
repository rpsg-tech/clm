import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailPayload } from './email.service'; // Assuming interfaces are exported

@Processor('email')
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(private readonly emailService: EmailService) {
        super();
    }

    async process(job: Job<EmailPayload>): Promise<any> {
        this.logger.debug(`Processing email job ${job.id} to ${job.data.to}`);

        try {
            // We use the internal sending method of EmailService 
            // BUT EmailService currently has 'sendEmail' which is the public API.
            // We created 'processEmail' specifically for the worker to bypass the queue.
            await this.emailService.processEmail(job.data);

            this.logger.debug(`Email job ${job.id} completed`);
        } catch (error) {
            this.logger.error(`Failed to process email job ${job.id}: ${(error as Error).message}`);
            throw error; // Let BullMQ handle retries
        }
    }
}
