/**
 * Shared Types for CLM Enterprise Platform
 * 
 * This package contains all shared TypeScript types, interfaces, and enums
 * used across the backend and frontend applications.
 */

// ============ ENUMS ============

export enum OrgType {
    PARENT = 'PARENT',
    ENTITY = 'ENTITY',
}

export enum ContractStatus {
    DRAFT = 'DRAFT',
    SENT_TO_LEGAL = 'SENT_TO_LEGAL',
    LEGAL_REVIEW_IN_PROGRESS = 'LEGAL_REVIEW_IN_PROGRESS',
    SENT_TO_FINANCE = 'SENT_TO_FINANCE',
    FINANCE_REVIEW_IN_PROGRESS = 'FINANCE_REVIEW_IN_PROGRESS',
    IN_REVIEW = 'IN_REVIEW',
    REVISION_REQUESTED = 'REVISION_REQUESTED',
    LEGAL_APPROVED = 'LEGAL_APPROVED',
    FINANCE_REVIEWED = 'FINANCE_REVIEWED',
    APPROVED = 'APPROVED',
    SENT_TO_COUNTERPARTY = 'SENT_TO_COUNTERPARTY',
    COUNTERSIGNED = 'COUNTERSIGNED',
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    TERMINATED = 'TERMINATED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    EXECUTED = 'EXECUTED',
}

export enum ApprovalType {
    LEGAL = 'LEGAL',
    FINANCE = 'FINANCE',
}

export enum ApprovalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    ESCALATED = 'ESCALATED',
}

export enum TemplateCategory {
    SERVICE_AGREEMENT = 'SERVICE_AGREEMENT',
    NDA = 'NDA',
    PURCHASE_ORDER = 'PURCHASE_ORDER',
    VENDOR_AGREEMENT = 'VENDOR_AGREEMENT',
    EMPLOYMENT = 'EMPLOYMENT',
    LEASE = 'LEASE',
    OTHER = 'OTHER',
}

export enum PermissionCode {
    // Contracts
    CONTRACT_VIEW = 'contract:view',
    CONTRACT_CREATE = 'contract:create',
    CONTRACT_EDIT = 'contract:edit',
    CONTRACT_DELETE = 'contract:delete',
    CONTRACT_SUBMIT = 'contract:submit',
    CONTRACT_SEND = 'contract:send',
    CONTRACT_UPLOAD = 'contract:upload',
    CONTRACT_DOWNLOAD = 'contract:download',
    CONTRACT_HISTORY = 'contract:history',

    // Templates
    TEMPLATE_VIEW = 'template:view',
    TEMPLATE_CREATE = 'template:create',
    TEMPLATE_EDIT = 'template:edit',
    TEMPLATE_DELETE = 'template:delete',
    TEMPLATE_PUBLISH = 'template:publish',

    // Approvals
    APPROVAL_LEGAL_VIEW = 'approval:legal:view',
    APPROVAL_LEGAL_ACT = 'approval:legal:act',
    APPROVAL_FINANCE_VIEW = 'approval:finance:view',
    APPROVAL_FINANCE_ACT = 'approval:finance:act',
    APPROVAL_FINANCE_REQUEST = 'approval:finance:request',

    // Intelligence
    AI_ANALYZE = 'ai:analyze',
    AI_CHAT = 'ai:chat',
    ANALYTICS_VIEW = 'analytics:view',

    // Identity Management
    USER_VIEW = 'user:view',
    USER_MANAGE = 'user:manage',
    ROLE_VIEW = 'role:view',
    ROLE_MANAGE = 'role:manage',

    // Organization
    ORG_VIEW = 'org:view',
    ORG_CREATE = 'org:create',
    ORG_EDIT = 'org:edit',
    ORG_DELETE = 'org:delete',
    ORG_MANAGE = 'org:manage',

    // System
    SYSTEM_AUDIT = 'system:audit',
    SYSTEM_SETTINGS = 'system:settings',
    ADMIN_CONFIG_MODULES = 'admin:config_modules',
}

export enum RoleCode {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ENTITY_ADMIN = 'ENTITY_ADMIN',
    LEGAL_HEAD = 'LEGAL_HEAD',
    LEGAL_MANAGER = 'LEGAL_MANAGER',
    FINANCE_MANAGER = 'FINANCE_MANAGER',
    BUSINESS_USER = 'BUSINESS_USER',
}

// ============ INTERFACES ============

// Base entity with common fields
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
}

// User
export interface User extends BaseEntity {
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    isActive: boolean;
    lastLoginAt?: Date;
}

export interface UserWithRoles extends User {
    organizationRoles: UserOrganizationRole[];
}

// Organization
export interface Organization extends BaseEntity {
    name: string;
    code: string;
    type: OrgType;
    parentId?: string;
    isActive: boolean;
    settings?: Record<string, unknown>;
}

export interface OrganizationWithChildren extends Organization {
    parent?: Organization;
    children: Organization[];
}

// Role & Permissions
export interface Role extends BaseEntity {
    name: string;
    code: string;
    description?: string;
    isSystem: boolean;
}

export interface Permission {
    id: string;
    name: string;
    code: PermissionCode;
    module: string;
    description?: string;
}

export interface UserOrganizationRole {
    id: string;
    userId: string;
    organizationId: string;
    roleId: string;
    isActive: boolean;
    assignedAt: Date;
    role?: Role;
    organization?: Organization;
}

// Template
export interface Template extends BaseEntity {
    name: string;
    code: string;
    category: TemplateCategory;
    description?: string;
    baseContent: string;
    isGlobal: boolean;
    isActive: boolean;
    createdByUserId: string;
}

export interface TemplateWithAnnexures extends Template {
    annexures: Annexure[];
}

export interface Annexure {
    id: string;
    templateId: string;
    name: string;
    title: string;
    content: string;
    fieldsConfig: FieldConfig[];
    order: number;
}

export interface FieldConfig {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    options?: string[];
    defaultValue?: string | number | boolean;
}

// Contract
export interface Contract extends BaseEntity {
    organizationId: string;
    templateId: string;
    title: string;
    reference: string;
    status: ContractStatus;
    counterpartyName?: string;
    counterpartyEmail?: string;
    startDate?: Date;
    endDate?: Date;
    amount?: number;
    description?: string;
    content: string;
    contentHash?: string;
    annexureData: string;
    fieldData: Record<string, unknown>;
    createdByUserId: string;
    submittedAt?: Date;
    approvedAt?: Date;
    sentAt?: Date;
    signedAt?: Date;
}

export interface ContractWithRelations extends Contract {
    organization: Organization;
    template: Template;
    createdByUser: User;
    versions: ContractVersion[];
    approvals: Approval[];
}

export interface ContractVersion {
    id: string;
    contractId: string;
    versionNumber: number;
    contentSnapshot: string;
    changeLog?: Record<string, unknown>;
    createdAt: Date;
    createdByUserId: string;
}

// Approval
export interface Approval {
    id: string;
    contractId: string;
    type: ApprovalType;
    status: ApprovalStatus;
    comment?: string;
    actorId?: string;
    actedAt?: Date;
    escalatedTo?: string;
    escalatedAt?: Date;
    escalatedBy?: string;
    dueDate?: Date;
    createdAt: Date;
}

export interface ApprovalWithActor extends Approval {
    actor?: User;
}

// Audit Log
export interface AuditLog {
    id: string;
    organizationId?: string;
    contractId?: string;
    userId: string;
    action: string;
    module: string;
    targetType?: string;
    targetId?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

// Feature Flag
export interface FeatureFlag {
    id: string;
    organizationId: string;
    featureCode: string;
    isEnabled: boolean;
    config?: Record<string, unknown>;
}

// ============ API TYPES ============

// Auth
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: UserWithRoles;
}

export interface SwitchOrgRequest {
    organizationId: string;
}

// Pagination
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// API Response
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// ============ UTILITY TYPES ============

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type OmitTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;

export type CreateInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateInput<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
