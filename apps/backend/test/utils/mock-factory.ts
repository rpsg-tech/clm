/**
 * Mock Factory for Testing
 * Provides pre-configured mocks for common dependencies
 */

export const createMockPrismaService = () => ({
    contract: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
    },
    approval: {
        create: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
    },
    contractVersion: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(createMockPrismaService())),
    $queryRaw: jest.fn(),
});

export const createMockEmailService = () => ({
    send: jest.fn().mockResolvedValue(undefined),
    sendApprovalRequest: jest.fn().mockResolvedValue(undefined),
    sendContractToCounterparty: jest.fn().mockResolvedValue(undefined),
    sendApprovalResult: jest.fn().mockResolvedValue(undefined),
});

export const createMockNotificationsService = () => ({
    createNotification: jest.fn().mockResolvedValue({
        id: 'notif-123',
        userId: 'user-123',
        type: 'CONTRACT_UPDATE',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
        createdAt: new Date(),
    }),
    sendInAppNotification: jest.fn().mockResolvedValue(undefined),
});

export const createMockStorageService = () => ({
    uploadFile: jest.fn().mockResolvedValue({
        key: 'contracts/test-contract.pdf',
        url: 'https://s3.aws.com/bucket/contracts/test-contract.pdf',
    }),
    getSignedUrl: jest.fn().mockResolvedValue('https://s3.aws.com/signed-url'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    getFileMetadata: jest.fn().mockResolvedValue({
        size: 1024,
        contentType: 'application/pdf',
    }),
});

export const createMockConfigService = () => ({
    get: jest.fn((key: string) => {
        const config = {
            FRONTEND_URL: 'http://localhost:3000',
            LEGAL_APPROVER_EMAIL: 'legal@example.com',
            FINANCE_APPROVER_EMAIL: 'finance@example.com',
            AWS_S3_BUCKET: 'test-bucket',
        };
        return config[key] || '';
    }),
});

export const createMockFeatureFlagService = () => ({
    isEnabled: jest.fn().mockResolvedValue(false),
    getConfig: jest.fn().mockResolvedValue({}),
});

export const createMockAuditService = () => ({
    logAction: jest.fn().mockResolvedValue({
        id: 'audit-123',
        action: 'CONTRACT_UPDATED',
        createdAt: new Date(),
    }),
    log: jest.fn().mockResolvedValue(undefined),
});

export const createMockDiffService = () => ({
    calculateChangelog: jest.fn().mockReturnValue({
        changes: [],
        summary: 'No changes',
    }),
    compareVersions: jest.fn().mockReturnValue({
        fieldChanges: [],
        contentDiff: { added: [], removed: [], modified: [] },
    }),
    generateHtmlDiff: jest.fn().mockReturnValue('<div>Diff</div>'),
});

/**
 * Sample test data
 */
export const mockContract = {
    id: 'contract-123',
    organizationId: 'org-123',
    templateId: 'template-123',
    title: 'Test Service Agreement',
    reference: 'REF-2024-001',
    status: 'DRAFT',
    counterpartyName: 'Acme Corp',
    counterpartyEmail: 'contact@acme.com',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    amount: 50000,
    description: 'Test contract',
    content: 'Contract content',
    contentHash: 'hash123',
    annexureData: '{}',
    fieldData: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByUserId: 'user-123',
    submittedAt: null,
    approvedAt: null,
    sentAt: null,
    signedAt: null,
};

export const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed',
    phone: '+1234567890',
    avatarUrl: null,
    isActive: true,
    status: 'ACTIVE',
    mustChangePassword: false,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
};

export const mockApproval = {
    id: 'approval-123',
    contractId: 'contract-123',
    type: 'LEGAL',
    status: 'PENDING',
    comment: null,
    actorId: null,
    actedAt: null,
    escalatedTo: null,
    escalatedAt: null,
    escalatedBy: null,
    dueDate: null,
    createdAt: new Date(),
};

export const mockContractVersion = {
    id: 'version-123',
    contractId: 'contract-123',
    versionNumber: 1,
    contentSnapshot: JSON.stringify({ title: 'Test' }),
    changeLog: null,
    createdAt: new Date(),
    createdByUserId: 'user-123',
};
