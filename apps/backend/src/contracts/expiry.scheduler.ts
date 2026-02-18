import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class ExpiryScheduler {
    private readonly logger = new Logger(ExpiryScheduler.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async handleContractExpiry() {
        this.logger.log('🔍 Running contract expiry check...');

        const now = new Date();
        const thresholds = [30, 7, 1];

        for (const days of thresholds) {
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + days);
            targetDate.setHours(0, 0, 0, 0);

            const nextDay = new Date(targetDate);
            nextDay.setDate(targetDate.getDate() + 1);

            // Find contracts expiring on the exact target date
            const expiringContracts = await this.prisma.contract.findMany({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        gte: targetDate,
                        lt: nextDay,
                    },
                },
                include: {
                    createdByUser: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                }
            });

            for (const contract of expiringContracts) {
                if (!contract.createdByUser?.email) continue;

                try {
                    await this.emailService.send({
                        to: contract.createdByUser.email,
                        template: 'CONTRACT_EXPIRING' as any,
                        subject: `⚠️ Contract Expiring in ${days} Day${days > 1 ? 's' : ''}: ${contract.title}`,
                        data: {
                            contractTitle: contract.title,
                            contractReference: contract.reference || 'N/A',
                            expiryDate: contract.endDate?.toLocaleDateString() || 'N/A',
                            daysRemaining: days.toString(),
                            contractUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${contract.id}`,
                        },
                        priority: days <= 7 ? 'high' : 'normal',
                    });
                    this.logger.log(`Sent ${days}-day expiry reminder for contract ${contract.id} to ${contract.createdByUser.email}`);
                } catch (error) {
                    this.logger.error(`Failed to send ${days}-day expiry reminder for contract ${contract.id}:`, error);
                }
            }
        }

        this.logger.log('✅ Contract expiry check completed.');
    }
}
