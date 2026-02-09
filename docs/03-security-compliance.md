# Security & Compliance Report

**Scope:** CLM Enterprise Platform
**Standards:** OWASP Top 10, GDPR, SOC 2 Readiness

## 1. Authentication & Session Management

### 1.1 Mechanism
-   **Standard**: OAuth 2.0 / OIDC compliant flows.
-   **Tokens**:
    -   **Access Token**: Short-lived (15m), JWT.
    -   **Refresh Token**: Long-lived (7d), Rotating family (reuse detection).
-   **Storage**:
    -   **Production**: `HttpOnly`, `Secure`, `SameSite=Strict` Cookies to prevent XSS.
    -   **Development**: LocalStorage fallback allowed.

### 1.2 Protection Measures
-   **Rate Limiting**: Redis-backed throttler (Global + Auth specific limits).
-   **Brute Force**: Account lockout after 5 failed attempts.
-   **Timing Attacks**: Constant-time execution for sensitive comparisons.

## 2. Data Protection (GDPR / PII)

### 2.1 Encryption
-   **In Transit**: TLS 1.3 required for all connections.
-   **At Rest**: AES-256 for Database volumes and S3 buckets.

### 2.2 Data Sanitization
-   **Logging**: Automatic redaction of Emails, Credit Cards, SSNs, and Tokens via `LogSanitizer`.
-   **AI Inputs**: Strict PII scrubbing before sending text to external LLMs.

### 2.3 Data Isolation (Multi-Tenancy)
-   **Strategy**: Row-Level Security logic implemented via `OrganizationId`.
-   **Enforcement**:
    -   **Frontend**: API client context separation.
    -   **Backend**: Global Guards and Services enforce `where: { organizationId }`.
    -   **AI**: Strict filtering in Vector Search.

## 3. Application Security (AppSec)

### 3.1 Headers (Helmet)
-   `Content-Security-Policy`: Restricts script sources.
-   `X-Frame-Options`: DENY (Prevents Clickjacking).
-   `X-Content-Type-Options`: nosniff.

### 3.2 Input Validation
-   All API inputs validated via DTOs and `class-validator`.
-   `whitelist: true` strips unknown properties to prevent Mass Assignment.

### 3.3 CSRF Protection
-   Double-Submit Cookie pattern explicitly implemented for state-changing requests.

## 4. Audit & Compliance

### 4.1 Audit Logs
-   **Storage**: Dedicated `AuditLog` table (immutable).
-   **Scope**: Login, Logout, Contract Creation, Approval, Deletion, AI Queries.
-   **Retention**: 1 year online, archived to Cold Storage afterwards.

### 4.2 Access Review
-   **Roles**: Admin, Manager, User, Viewer.
-   **Review**: Quarterly access review recommended for Admin accounts.
