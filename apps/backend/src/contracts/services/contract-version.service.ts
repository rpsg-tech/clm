import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiffService } from '../../common/services/diff.service';

/**
 * Handles contract versioning and change tracking
 * Extracted from ContractsService for Single Responsibility Principle
 */
@Injectable()
export class ContractVersionService {
    constructor(
        private prisma: PrismaService,
        private diffService: DiffService
    ) { }

    /**
     * Create initial version on contract creation
     */
    async createInitialVersion(
        contractId: string,
        userId: string,
        content: string,
        annexureData: string,
        userEmail: string
    ) {
        const changeLog = await this.diffService.calculateChanges(
            null,
            { content },
            userEmail
        );

        return this.prisma.contractVersion.create({
            data: {
                contractId,
                versionNumber: 1,
                contentSnapshot: JSON.stringify({
                    main: content,
                    annexures: annexureData
                }),
                changeLog: changeLog as any,
                createdByUserId: userId,
            },
        });
    }

    /**
     * Create new version on update
     */
    async createNewVersion(
        contractId: string,
        userId: string,
        previousData: any,
        newData: any,
        userEmail: string
    ) {
        // Get latest version number
        const latestVersion = await this.prisma.contractVersion.findFirst({
            where: { contractId },
            orderBy: { versionNumber: 'desc' },
        });

        const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

        // Calculate changes
        const changeLog = await this.diffService.calculateChanges(
            previousData,
            newData,
            userEmail
        );

        return this.prisma.contractVersion.create({
            data: {
                contractId,
                versionNumber: newVersionNumber,
                contentSnapshot: newData.annexureData || JSON.stringify(newData),
                changeLog: changeLog as any,
                createdByUserId: userId,
            },
        });
    }

    /**
     * Get all versions for a contract
     */
    async getVersions(contractId: string) {
        const versions = await this.prisma.contractVersion.findMany({
            where: { contractId },
            orderBy: { versionNumber: 'desc' },
        });

        // Fetch creators
        const userIds = [...new Set(versions.map(v => v.createdByUserId))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        return versions.map(v => ({
            ...v,
            createdBy: userMap.get(v.createdByUserId) || { name: 'System', email: '' }
        }));
    }

    /**
     * Get specific version with changelog
     */
    async getVersionChangelog(contractId: string, versionId: string) {
        const version = await this.prisma.contractVersion.findUnique({
            where: { id: versionId },
        });

        if (!version || version.contractId !== contractId) {
            return null;
        }

        const user = await this.prisma.user.findUnique({
            where: { id: version.createdByUserId },
            select: { name: true, email: true }
        });

        return {
            ...version,
            createdBy: user || { name: 'System', email: '' }
        };
    }

    /**
     * Compare two versions (Pro Hunk-Based Comparison)
     */
    async compareVersions(contractId: string, fromVersionId: string, toVersionId: string) {
        const [fromVersion, toVersion, contract] = await Promise.all([
            this.prisma.contractVersion.findUnique({ where: { id: fromVersionId } }),
            this.prisma.contractVersion.findUnique({ where: { id: toVersionId } }),
            this.prisma.contract.findUnique({
                where: { id: contractId },
                select: { title: true }
            })
        ]);

        if (!fromVersion || !toVersion) {
            return null;
        }

        // Parse content snapshots
        const fromSnap = JSON.parse(fromVersion.contentSnapshot || '{}');
        const toSnap = JSON.parse(toVersion.contentSnapshot || '{}');

        const fromMain = fromSnap.main || '';
        const toMain = toSnap.main || '';
        const fromAnnex = fromSnap.annexures || '';
        const toAnnex = toSnap.annexures || '';

        // Pro: Get Field Changes
        const fieldChanges = this.diffService.compareVersions(fromSnap, toSnap).fieldChanges;

        // Pro: Get Hunks for Main and Annexures
        const [mainHunks, annexureHunks] = await Promise.all([
            this.diffService.calculateHunks(fromMain, toMain),
            this.diffService.calculateHunks(fromAnnex, toAnnex)
        ]);

        return {
            contractTitle: contract?.title,
            fromVersion: fromVersion.versionNumber,
            toVersion: toVersion.versionNumber,
            fieldChanges,
            main: mainHunks,
            annexures: annexureHunks
        };
    }
}
