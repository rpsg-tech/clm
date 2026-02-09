# CLM — Product Requirements Document

**Version:** 1.0
**Last Updated:** 2026-02-06
**Author:** Benison Joseph
**Status:** Draft

---

## 1. Product Overview

### 1.1 What Is CLM?

Contract Lifecycle Management (CLM) is an internal tool for RPSG Group companies to create, review, approve, sign, and manage legal agreements — all from a single, centralized platform.

### 1.2 Who Uses It?

RPSG Group operates 10-20 group companies. CLM serves employees across all of them. Each company is a separate organization within CLM — users, contracts, and data are fully siloed per org. Certain users may be assigned to multiple organizations with different roles.

### 1.3 What Problems Does It Solve?

| Stakeholder | Problem Today | CLM Solution |
|-------------|---------------|--------------|
| **Business Users** (any employee) | Need legal agreements (NDAs, vendor agreements, etc.) but must chase legal team over email/calls. No self-serve process. | Self-serve contract creation from templates. No need to speak to legal. Fill details, submit, track status. |
| **Legal Team** (Legal Manager, Legal Head) | No central repository — agreements scattered across email, OneDrive, Word docs. Manual review overhead with excessive back-and-forth. No assurance templates are followed. | Centralized repository. Streamlined review queues. Template compliance enforced (Part A locked). Dashboard with actionables and insights. |
| **Finance** (Finance Manager) | No structured process for financial approval of high-value agreements. | Explicit finance approval flow, captured with remarks and amounts for visibility. |

### 1.4 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (React 19, App Router) + Tailwind CSS 4 |
| Backend | NestJS 11 + Prisma + PostgreSQL + Redis |
| Editor | TipTap (ProseMirror-based rich text) |
| State | React Context (Auth, Toast) + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Auth | JWT in HttpOnly cookies + CSRF + Azure AD SSO |
| Storage | S3 (presigned URLs for uploads/downloads) |
| AI | LLM integration for insight/analysis (no content creation) |

---

## 2. User Roles & Access

### 2.1 Role Hierarchy

```
SUPER_ADMIN (System-wide — tech/support team)
  └── ENTITY_ADMIN (Organization-wide)
        ├── LEGAL_HEAD (Legal team lead, can review + escalate decisions)
        │     └── LEGAL_MANAGER (Default legal reviewer/approver)
        ├── FINANCE_MANAGER (Financial approval when explicitly requested)
        └── BUSINESS_USER (Create, fill, submit contracts)
```

### 2.2 Access Scoping

| Role | Contract Visibility | LLM Query Scope | Template Management | Admin Access |
|------|--------------------|-----------------|--------------------|-------------|
| Business User | Only contracts THEY created in THEIR org | Own contracts only | None | None |
| Legal Manager | ALL contracts in their org | Full org scope | Create, edit, remove templates | None |
| Legal Head | ALL contracts in their org | Full org scope | Create, edit, remove templates | None |
| Finance Manager | ALL contracts in their org | Full org scope | None | None |
| Entity Admin | ALL contracts in their org | Full org scope | None | User management, org settings |
| Super Admin | ALL contracts, ALL orgs | System-wide | None | Full system admin, debug, LangFuse traces |

### 2.3 Multi-Org Model

- Each of the 10-20 RPSG group companies = one organization
- Organizations are **fully siloed** — no parent hierarchy, no data sharing
- Users can belong to **multiple orgs** with potentially different roles per org
- User switches org context via org selector (workspace-style switching)
- All data (contracts, templates, users) scoped to the active org context

### 2.4 Authentication

- **Email + Password** — standard login with forgot/reset password flow
- **Microsoft Azure AD SSO** — corporate identity provider
- **Invite-only** — no self-registration. Admin must invite users, even if email domain matches
- **Account lockout** — 5 failed attempts = 15-minute lockout
- **Session** — JWT access token (15 min) + refresh token (7 days), HttpOnly cookies

---

## 3. Contract Structure

### 3.1 Part A + Part B (Annexures) Model

Every agreement created from a company template consists of two parts:

**Part A — Fixed Legal Body (Locked)**
- The core legal agreement text defined by the legal team in the template
- Contains the main clauses, terms, and legal language
- **Business users CANNOT edit Part A. Ever.** This is a hard rule.
- Covers: parties, governing law, dispute resolution, standard clauses

**Part B — Annexures (Editable by Business User)**
- Variable section containing context-specific details
- Commercial terms, timelines, counterparty information, deliverables
- Could be multiple annexures but rendered as a single continuous section
- Business user edits in a **Word-editor style interface** (not form fields) — free text editing, fill blanks, add/remove rows and columns
- This is the ONLY part business users can edit on the platform

**Final Document Rendering:**
- Part A → page break → Part B (all annexures)
- Entire document in **justified format**
- Rendered as a continuous, print-ready document

### 3.2 Upload-Based Contracts (Counterparty Format)

When the counterparty has more leverage (e.g., agreements with Adobe), they dictate the template:
- Business user uploads the counterparty's agreement document
- **No editing allowed** — preview only
- The uploaded document goes through the same approval/action flow as template-based contracts
- OCR capabilities needed for scanned stamp paper documents

### 3.3 Template Categories

| Category | Code | Example |
|----------|------|---------|
| Service Agreement | `SERVICE_AGREEMENT` | IT services, consulting |
| NDA | `NDA` | Non-disclosure agreements |
| Purchase Order | `PURCHASE_ORDER` | Procurement contracts |
| Vendor Agreement | `VENDOR_AGREEMENT` | Supplier contracts |
| Employment | `EMPLOYMENT` | Employment contracts |
| Lease | `LEASE` | Property/equipment leases |
| Other | `OTHER` | Catch-all category |

---

## 4. User Flows

### Flow 1: Authentication & Onboarding

**Users:** All
**Entry:** Landing page URL

| Step | Screen | What Happens |
|------|--------|-------------|
| 1 | **Landing Page + Login** | Professional landing page with feature highlights, company branding, AND login form (email/password + "Sign in with Microsoft" SSO). Single screen — no separate login page. |
| 3 | **Org Selector** | Multi-org users see org cards to select context. Single-org users auto-redirect. |
| 4 | **Dashboard** | Redirect to role-appropriate dashboard |

**Edge Cases:**
- First login after invite: user may need to set password (if invite-based with temporary password)
- SSO users: Microsoft redirect → callback → set cookies → dashboard
- Account locked: show lockout message with countdown

---

### Flow 2: Contract Creation (Template-Based)

**Users:** Business User
**Entry:** Dashboard "Create Contract" action or Contracts page

| Step | Screen | What Happens |
|------|--------|-------------|
| 1 | **Search/Prompt** | User types requirement in free-text (chatbot-style): "I need a concessionaire agreement" |
| 2 | **Template Recommendations** | System matches and recommends templates with descriptions: "This template is suitable for..." |
| 3 | **Template Preview** | User clicks template → sees Part A preview (locked, scroll-only, "You cannot edit this") |
| 4 | **Annexure Editor** | Part B (annexures) loaded in Word-editor style. User fills blanks, adds details, edits freely. |
| 5 | **Full Preview** | Part A + Part B rendered together (justified format, page break between). User reads entire document. |
| 6 | **Oracle Chat** | Available on-side during preview — ask questions: "What are the risks?", "What are the payment terms?", general comprehension. |
| 7 | **Submit as Draft** | User saves as draft. First version created. |

**Key Rules:**
- Business user can ONLY edit on the platform during this first draft creation
- After submitting draft, any further edits require: download as Word → edit offline → upload new version
- LLM is insight-only during preview — no content creation or editing
- Template search should work with natural language (not just exact template names)

---

### Flow 3: Contract Creation (Upload-Based)

**Users:** Business User
**Entry:** Dashboard or Contracts page → "Upload Agreement" option

| Step | Screen | What Happens |
|------|--------|-------------|
| 1 | **Upload Zone** | User uploads counterparty's agreement (PDF, Word, scanned image). Explicitly marked as "counterparty format." |
| 2 | **Document Preview** | Preview of uploaded document. **Not editable.** |
| 3 | **Metadata Form** | User fills: title, counterparty name/email, contract amount, dates, description |
| 4 | **AI Extraction** | System auto-extracts dates/terms from document (where possible) |
| 5 | **Ready for Actions** | Draft created. Same post-draft actions available. |

**Key Rules:**
- No Word editor for uploaded contracts — preview only
- AI extraction is assistive (user confirms extracted data)
- OCR needed for scanned stamp paper documents

---

### Flow 4: Post-Draft Actions

**Users:** Business User (after completing draft from either creation flow)
**Entry:** Contract detail page after draft is saved

The business user has **three available actions** (no strict order required):

| Action | What Happens | Status Change |
|--------|-------------|---------------|
| **Send to Legal** | Contract enters legal review queue. Legal Manager sees it in actionables. | `DRAFT` → `SENT_TO_LEGAL` |
| **Send to Counterparty** | Email sent with subject, body, CC recipients. Contract shared externally. Replies route to business user's email. | `DRAFT` → `SENT_TO_COUNTERPARTY` |
| **Request Finance Review** | Parallel track. Finance Manager sees it in their actionable queue. | Creates `FINANCE` approval record (runs parallel to other statuses) |

**Key Rules:**
- **Send to Legal takes precedence** as the displayed contract status when both legal and counterparty tracks are active
- Finance review is independent/parallel — not gated by legal or counterparty status
- When business user uploads a version back from counterparty exchange, **diff check flags changes** for stakeholder review
- Send to counterparty uses an email service — CLM is internal-only, counterparties interact via email
- Business user can also edit draft before taking any action (re-opens editor for further changes, limited to annexures)

---

### Flow 5: Legal Review & Approval

**Users:** Legal Manager, Legal Head
**Entry:** Dashboard actionables or Legal Review queue

| Step | Screen | What Happens |
|------|--------|-------------|
| 1 | **Legal Queue** | Inbox-style list of contracts pending legal review. Sorted by urgency. |
| 2 | **Contract Detail** | Click to open — see status history, past revisions, diffs. Quick understanding of context. |
| 3 | **Review Screen** | Full agreement preview with action buttons. Legal can read entire document, check statuses, see audit trail. |
| 4 | **Oracle Chat** | Available on-side — query risks, clauses, terms, get AI analysis. |
| 5 | **Decision** | Two options only (both require mandatory comment with minimum character limit): |

**Legal Actions:**

| Action | What Happens | Status Change |
|--------|-------------|---------------|
| **Approve** | Contract approved with mandatory remark | `SENT_TO_LEGAL` → `LEGAL_APPROVED` |
| **Send Back with Notes** | Returned to business user with comments for revision | `SENT_TO_LEGAL` → `REVISION_REQUESTED` |

**There is NO explicit "Reject" button.** It's either approve or send back.

**Legal Manager can also:**
- **Edit on platform** — Legal Manager and Legal Head can edit contracts directly on the platform (unlike business users who must download/upload after first draft)
- **Escalate to Legal Head** — Flag the contract to the Legal Head when unsure or high-stakes

**Escalation Flow:**
1. Legal Manager flags contract to Legal Head
2. Legal Head sees flagged item in their prioritized action queue
3. Legal Head can: approve directly, send back with notes, OR return to Legal Manager
4. Legal Head has all the same review capabilities

---

### Flow 6: Finance Review

**Users:** Finance Manager
**Entry:** Dashboard actionables or Finance Review queue

| Step | Screen | What Happens |
|------|--------|-------------|
| 1 | **Finance Queue** | Inbox-style list of contracts where finance review was explicitly requested |
| 2 | **Contract Detail** | Full contract view with commercial details highlighted |
| 3 | **Decision** | Two options (mandatory remark with minimum character limit): |

| Action | What Happens |
|--------|-------------|
| **Approve** | "Financials approved for [amount] mentioned in the contract" — captured with remark |
| **Send Back with Notes** | Returned with financial concerns noted |

**Key Rules:**
- Finance review only appears when explicitly requested by business user OR legal team
- Runs parallel to legal review — not gated by legal approval
- Finance approval gives legal team confidence on commercial terms
- Finance approval remark should capture: approved amount, any conditions

---

### Flow 7: Revision Flow (Send Back)

**Users:** Business User (receives send-back), Legal/Finance (initiates)

| Step | What Happens |
|------|-------------|
| 1 | Legal or Finance sends contract back with notes |
| 2 | Business user receives notification of send-back (Future: in-app + email. V1: visible in contract status) |
| 3 | Business user **downloads** contract as Word document |
| 4 | Edits offline on their system |
| 5 | Uploads revised version back to CLM |
| 6 | System computes diff between versions |
| 7 | If diff exceeds threshold → alert stakeholders to re-review (see Section 9: Diff Strategy) |
| 8 | Business user re-submits for review |

**Key Rules:**
- Business user CANNOT edit on platform after first draft — must download, edit offline, upload
- Legal CAN edit on platform at any time
- Uploading new version does NOT automatically reset existing approvals
- Approvals preserved, but stakeholders alerted if significant changes detected

---

### Flow 8: Counterparty Exchange & Signing

**Users:** Business User
**Entry:** Contract detail page (after sending to counterparty)

**Scenario A: Counterparty accepts as-is**
1. Counterparty signs the agreement (offline — on stamp paper or digitally)
2. Business user receives signed copy (via email reply)
3. Business user uploads signed version to CLM
4. If needed, sends to legal for final review
5. Legal approves → business user downloads for company-head signature
6. Final fully-executed signed version uploaded to CLM

**Scenario B: Counterparty requests changes**
1. Counterparty sends back modified version (via email)
2. Business user uploads new version to CLM
3. Diff computed between versions — stakeholders alerted if significant changes
4. Business user may send to legal for re-review
5. Negotiation cycle continues until agreement reached
6. Once agreed → signing flow as Scenario A

**Signed Version Upload:**
- Flexible single upload with manual marking
- UI options: "Signed by counterparty" / "Signed by our company" / "Fully executed"
- Upload option only available once prior statuses are complete
- **MANDATORY:** The final signed version MUST be uploaded to the portal — this is a hard requirement

---

### Flow 9: Agreement Management

**Users:** All roles (access-scoped per role)
**Entry:** Main navigation → Contracts/Agreements

#### 9a. List View
| Element | Details |
|---------|---------|
| Agreement list | Line items: name, counterparty, status badge, amount, dates, expiry |
| Search | Text search across contract titles, counterparty names |
| Filters | Status, date range, template type, counterparty |
| Quick actions | Per-row actions based on status and permissions |
| Pagination | Paginated results with configurable page size |

#### 9b. Detail View (Click-through)
| Tab/Section | Contents |
|-------------|----------|
| Status & History | Current status, full status timeline, who did what when |
| Past Revisions | Version history with creator, timestamp, change summary |
| Diffs | Side-by-side comparison between any two versions |
| Actionable Items | Context-aware action buttons based on status + role + permissions |
| LLM Chat | Oracle chat to query the contract — terms, clauses, risks |
| Approval Trail | Legal and finance approval records with remarks |

#### 9c. Preview/Review Screen (Separate from Detail)
- Full agreement reader (Part A + Part B rendered)
- Statuses and action history visible
- LLM chat available
- Action buttons for current status (approve, send back, send to counterparty, etc.)

**Key Rule:** These screens and components are **consistent across all roles** — business user, legal, finance, admin all see the same structure, but with role-appropriate actions and data scoping.

---

### Flow 10: LLM Oracle & Intelligence

**Users:** All (with AI permissions)
**Entry:** Available as side-panel chat on contract preview/review screens

| Capability | Description | Scope |
|-----------|-------------|-------|
| **Contract Q&A** | Ask about terms, clauses, payment terms, termination clause, risks | Per-contract |
| **Risk Analysis** | AI scores contract risk (1-10), flags issues, suggests areas of concern | Per-contract |
| **Cross-Contract Search** | Search across all accessible contracts using natural language queries | Per-user access scope |
| **Clause Suggestions** | AI suggests clause language for specific clause types | Per-contract |
| **Change Summarization** | AI summarizes what changed between versions | Per-version diff |

**Hard Rules:**
- LLM is **insight-only** — NEVER creates or edits agreement content
- No AI-generated text is inserted into contracts
- All AI capabilities are gated by `ai:analyze` and `ai:chat` permissions
- AI features may be feature-flagged per org (`AI_CONTRACT_REVIEW`)

---

### Flow 11: Template Management

**Users:** Legal Manager, Legal Head ONLY
**Entry:** Main navigation → Templates

| Step | Screen | What Happens |
|------|--------|-------------|
| 1 | **Template Library** | Grid view with category filters, search, active/inactive toggle |
| 2 | **Create Template** | Define: name, code, category, description. **Upload** Part A content as HTML or Word file (not a rich text editor). Define annexure structure (fields, blanks). |
| 3 | **Edit Template** | Modify template content, manage org access (enable/disable per org) |
| 4 | **Org Access** | Toggle which organizations can use this template |

**Key Rules:**
- ONLY Legal Manager and Legal Head can create, edit, and remove templates
- No other roles (not finance, not business user, not admin) have template management access
- Templates define both Part A (fixed body) and the annexure structure for Part B
- Templates can be global (all orgs) or org-specific

**Locked Decision:** Template versioning — existing contracts keep their original template content. Only new contracts use the updated template. Templates are static once a contract is created from them.

---

### Flow 12: Dashboard Views

**Users:** All (role-specific content)

#### Business User Dashboard
| Section | Contents |
|---------|----------|
| Stats | My contracts (total, active, drafts, pending) |
| Attention Banner | Contracts sent back for revision, expiring contracts |
| My Recent Contracts | Table with status, counterparty, dates |
| Quick Actions | Create new contract |

#### Legal Manager / Legal Head Dashboard
| Section | Contents |
|---------|----------|
| **Actionables (Top, Urgent)** | Contracts pending legal review, escalated items (Legal Head), flagged items |
| Stats | Total org contracts, pending review count, approved this period |
| Insights | Expiring contracts, active contract values, contracts by status |
| All Org Agreements | Full agreement list with filters |

#### Finance Manager Dashboard
| Section | Contents |
|---------|----------|
| **Actionables (Top, Urgent)** | Contracts pending finance review/approval |
| Stats | Pending approvals, approved this period, total contract value |
| All Org Agreements | Full agreement list |

**Key Rules:**
- Dashboard UX designed around **urgency** — actionable items at the top
- Legal/Finance see all org agreements; business users see only their own
- Insights kept simple for V1: expiring, pending, open unsigned, status counts

**Locked Decision:** Expiry alerts tiered at 30d (critical), 60d (warning), 90d (informational). Dashboard stats kept simple for V1 — counts and actionables, no complex charts.

---

### Flow 13: Admin & User Management

**Users:** Entity Admin, Super Admin
**Entry:** Main navigation → Admin

| Screen | What It Does |
|--------|-------------|
| **Users** | User table with invite, edit role/org, activate/deactivate. Invite via email (admin-only). |
| **Roles** | Role list with permission counts. View/edit permissions per role. System roles (6 defaults) are read-only. |
| **Permissions** | Read-only permission matrix grouped by module. Reference view. |
| **Organizations** | Org list. Create new entities, edit settings, deactivate. |
| **Audit Log** | Filterable log: by module, action, user, date range. Records all system events. |
| **Feature Flags** | Toggle switches for org-level features (e.g., `AI_CONTRACT_REVIEW`). |

**Super Admin additionally:**
- Can see/manage across ALL organizations
- Tech admin dashboard: system metrics, cache stats, health checks
- LangFuse access for AI traces and observability

**Locked Decision:** V1 admin = design the form UI (name, email, role, org assignment). Invite email + setup link is a later improvement.

---

## 5. Status Model

### 5.1 Contract Statuses

```
DRAFT
  ├─→ SENT_TO_LEGAL ─→ LEGAL_APPROVED
  │                  ─→ REVISION_REQUESTED ─→ (business user uploads new version) ─→ re-submit
  │                  ─→ ESCALATED_TO_HEAD ─→ HEAD_APPROVED / RETURNED_TO_LEGAL
  │
  ├─→ SENT_TO_COUNTERPARTY ─→ (counterparty responds, new version uploaded)
  │                          ─→ (if significant diff → RE_REVIEW_FLAGGED)
  │
  └─→ (Finance review runs as PARALLEL track, not sequential)

LEGAL_APPROVED ─→ SENT_TO_COUNTERPARTY (if not already sent)
               ─→ PENDING_SIGNATURE

PENDING_SIGNATURE ─→ SIGNED (with marking: counterparty / company / fully executed)

SIGNED ─→ ACTIVE (fully executed, ongoing contract)

ACTIVE ─→ EXPIRING (approaching end date)
       ─→ EXPIRED (past end date)
       ─→ TERMINATED (legal-only action, simple marking in V1)
```

### 5.2 Finance Approval Track (Parallel)

```
FINANCE_REVIEW_REQUESTED ─→ FINANCE_APPROVED (with remark + amount)
                         ─→ FINANCE_SENT_BACK (with notes)
```

Finance approval is captured as a **parallel record** alongside the main contract status. It does not block other status transitions.

### 5.3 Approval Record Statuses

| Type | Statuses |
|------|----------|
| Legal | `PENDING` → `APPROVED` / `ESCALATED` |
| Finance | `PENDING` → `APPROVED` |

**Note:** No "REJECTED" status — it's always "send back with notes" (which maps to `REVISION_REQUESTED` on the contract).

### 5.4 Status Transition Rules

| Current Status | Available Actions | Who Can Act |
|---------------|------------------|-------------|
| `DRAFT` | Edit, Send to Legal, Send to Counterparty, Request Finance Review | Business User |
| `SENT_TO_LEGAL` | Approve, Send Back, Escalate to Head | Legal Manager |
| `ESCALATED_TO_HEAD` | Approve, Send Back, Return to Legal Manager | Legal Head |
| `REVISION_REQUESTED` | Download, Edit offline, Upload new version, Re-submit | Business User |
| `LEGAL_APPROVED` | Send to Counterparty, Upload Signed Version | Business User |
| `SENT_TO_COUNTERPARTY` | Upload new version (counterparty response), Upload Signed | Business User |
| `PENDING_SIGNATURE` | Upload Signed Version | Business User |
| `ACTIVE` | View, Query, Download | All with access |
| `ACTIVE` | Mark as Terminated | Legal Manager, Legal Head only |

---

## 6. Editing Rules

### 6.1 Who Can Edit What, When, Where

| Role | First Draft (Creation) | After First Version | Platform vs Offline |
|------|----------------------|--------------------|--------------------|
| **Business User** | Edit annexures (Part B) only | Download → edit offline → upload | Platform: first draft only. After: offline only. |
| **Legal Manager** | Full edit access | Full edit access | Platform editing allowed at any time |
| **Legal Head** | Full edit access | Full edit access | Platform editing allowed at any time |
| **Finance Manager** | No edit access | No edit access | Can only approve/send back with remarks |

### 6.2 Part A vs Part B Editing

| Part | Business User | Legal Manager/Head |
|------|--------------|-------------------|
| **Part A (Fixed Legal Body)** | Never editable | Editable on platform |
| **Part B (Annexures)** | Editable during first draft creation only (on platform) | Editable on platform at any time |

### 6.3 Approval Actions

All approval actions (approve / send back) require:
- **Mandatory comment/remark** — cannot act without leaving a comment
- **Minimum 10 characters** on remarks (prevents empty or meaningless approvals like "ok")
- Comments become part of the permanent audit trail

---

## 7. Dashboard Specifications

### 7.1 Common Dashboard Elements

| Element | All Roles |
|---------|-----------|
| Navigation sidebar | Contracts, Templates (legal only), Dashboard, Admin (admin only) |
| Header | Org name, user name, role badge, org switcher (multi-org users) |
| Time-based greeting | "Good morning/afternoon/evening, {name}" |

### 7.2 Business User Dashboard

| Widget | Data | Priority |
|--------|------|----------|
| My Contracts Summary | Total, Active, Drafts, Pending Review | V1 |
| Attention Banner | Contracts sent back, expiring soon | V1 |
| Recent Contracts Table | Last 10 with status badges | V1 |
| Quick Action: Create Contract | Primary CTA | V1 |

### 7.3 Legal Manager / Legal Head Dashboard

| Widget | Data | Priority |
|--------|------|----------|
| **Pending Review Queue** (TOP) | Contracts awaiting legal review, sorted by urgency | V1 |
| **Escalated Items** (Legal Head only) | Flagged by Legal Manager | V1 |
| Org Contract Stats | Total, by status, pending count | V1 |
| Expiring Contracts Alert | Tiered: **Critical** (30 days, red), **Warning** (60 days, amber), **Informational** (90 days, blue) | V1 |
| Active Contract Value | Total value of active contracts | V1 |
| Contract Status Breakdown | Counts by status | V1 |
| Advanced Analytics | Trends, approval turnaround, cycle times | Future |

### 7.4 Finance Manager Dashboard

| Widget | Data | Priority |
|--------|------|----------|
| **Pending Finance Approvals** (TOP) | Items explicitly requesting finance review | V1 |
| Approved This Period | Finance approvals with amounts | V1 |
| Org Contract Overview | Full agreement list | V1 |

### 7.5 Super Admin Dashboard

| Widget | Data | Priority |
|--------|------|----------|
| System Health | DB, Redis, memory status | V1 |
| User Stats | Total users, active sessions, recent logins | V1 |
| Org Overview | All organizations with contract counts | V1 |
| Audit Log Quick View | Recent system events | V1 |
| LangFuse Link | AI traces and observability | V1 |

---

## 8. Feature Inventory — V1 vs Future Roadmap

### 8.1 V1 (Must Ship)

| Feature | Details |
|---------|---------|
| **Authentication** | Email + password, Microsoft SSO, invite-only, account lockout |
| **Org Switching** | Multi-org context switching for multi-org users |
| **Template-Based Contract Creation** | Free-text search → template recommendations → Part A preview → annexure editing → full preview → save as draft |
| **Upload-Based Contract Creation** | Upload counterparty agreement → preview → metadata form → save as draft |
| **Post-Draft Actions** | Send to legal, send to counterparty (email), request finance review |
| **Legal Review & Approval** | Queue, review screen, approve / send back with mandatory remarks |
| **Legal Escalation** | Legal Manager → Legal Head flagging, Legal Head direct review |
| **Finance Review** | Parallel approval track with remarks and amount capture |
| **Revision Flow** | Send back → download Word → edit offline → upload new version |
| **Version Management** | Version history, version snapshots |
| **Diff View** | Side-by-side comparison between versions |
| **Counterparty Email Send** | Send agreement via email with subject, body, CC |
| **Signed Version Upload** | Upload with manual marking (counterparty signed / company signed / fully executed) |
| **Contract List & Detail Views** | List with search/filter, detail with tabs (status, history, diffs, actions) |
| **Oracle Chat** | LLM-powered Q&A per contract (risks, terms, clauses) — insight-only |
| **Cross-Contract LLM Search** | Natural language search across accessible contracts |
| **Template Management** | CRUD by legal team only, org access toggles |
| **Dashboard (Simple)** | Role-specific actionables, expiring contracts, pending items, status counts |
| **User Management** | Invite, edit roles/orgs, activate/deactivate |
| **Org Management** | Create, edit settings, deactivate |
| **Role & Permission Management** | View/edit custom roles, system roles read-only |
| **Audit Log** | Filterable event log |
| **Feature Flags** | Org-level feature toggles |
| **RBAC** | 6 roles, 45+ permissions, org-scoped |
| **Contract Status Model** | Full lifecycle: Draft → Review → Approved → Sent → Signed → Active |
| **Termination (Simple)** | Legal-only option to mark contract as terminated |

### 8.2 Future Roadmap

| Feature | Details | Trigger/When |
|---------|---------|-------------|
| **In-App Notifications** | Bell icon notification center | Post-V1 enhancement |
| **Email Notifications** | Email alerts for key events (sent to legal, approved, expiring) | Post-V1 enhancement |
| **Advanced Analytics** | Trends, approval turnaround times, cycle time analysis, contract value trends | After V1 dashboard proves useful |
| **AI Change Summarization** | AI-generated summary of what changed between versions | After diff view is validated |
| **Diff Threshold Alerting** | Auto-alert stakeholders when diff exceeds threshold on approved contracts | After diff strategy validated |
| **OCR for Scanned Documents** | Extract text from scanned stamp paper for diff and search | Research phase — see Section 9 |
| **Advanced Termination Flows** | Full termination workflow with clause references, notice periods | When offline termination process is formalized |
| **Contract Renewal** | Auto-detect expiring contracts, renewal workflow | After active contract management is stable |
| **Notification Channels** | Slack, Teams integrations | Based on user demand |
| **Template Versioning** | Track template changes, impact on existing contracts | When template management matures |
| **Saved Searches** | Save and reuse frequent search queries | After V1 text search is validated |
| **Branded Email Templates** | Professionally designed counterparty email templates with org branding | Post-V1 email enhancement |
| **Bulk Operations** | Bulk approve, bulk status change, bulk export | When contract volume justifies it |
| **Reporting / Export** | PDF/Excel reports, scheduled reports | After analytics are validated |
| **WebSocket Real-Time Updates** | Live status updates without page refresh | Performance optimization phase |
| **Multi-language Support** | UI localization for different RPSG regions | Based on expansion needs |
| **Digital Signature Integration** | Integration with DocuSign/Adobe Sign for in-platform signing | When signing volume justifies investment |

---

## 9. Diff Strategy — Version Comparison & Alerting

### 9.1 Context

Contracts go through multiple versions — business users edit, counterparties send modified versions, legal makes changes. The system must:
1. Show clear diffs between any two versions
2. Alert stakeholders when a new version has significant changes (especially on previously-approved contracts)
3. Handle both digital documents (Word/PDF) and scanned stamp paper (OCR)

### 9.2 V1 Approach (Simple, Ship Now)

**Word-Level Diff Display:**
- Compare HTML content between version snapshots (stored in `ContractVersion.contentSnapshot`)
- Use word-level diffing (similar to Google Docs suggestion mode)
- Display: side-by-side view with additions (green), deletions (red), modifications (yellow)
- Show change statistics: +X words added, -Y words removed, Z sections modified

**Implementation:**
- Backend: Compute diff server-side using HTML-aware diff library (e.g., `diff-match-patch` or `htmldiff`)
- Already have: `GET /contracts/:id/compare?from=versionId&to=versionId` endpoint
- Already have: `ContractVersion` model with `contentSnapshot` and `changeLog`

**V1 Alerting (Simple):**
- When a new version is uploaded on a contract that already has approvals:
  - Show a **visual indicator** on the contract detail ("New version uploaded since last approval")
  - Show the diff prominently in the approval review screen
  - Legal/Finance can see exactly what changed before deciding to re-approve or not
- No automated threshold — human reviewers decide significance

### 9.3 V2 Approach (Future — Intelligent Alerting)

**Clause-Level Semantic Diff:**
- Segment documents into clauses/sections (paragraph-level splitting is optimal per research)
- Classify changes by clause type: commercial terms, liability, termination, governing law
- Material change detection: flag changes to high-risk clauses (indemnity, limitation of liability, payment terms)

**Automated Threshold Alerting:**
- Define thresholds per clause category:
  - **Commercial changes** (amount, payment terms) → always alert finance
  - **Liability/indemnity changes** → always alert legal
  - **Minor formatting changes** → no alert
- AI-powered change summarization: "Payment terms changed from Net 30 to Net 60. Liability cap reduced from 2x to 1x contract value."

**OCR Pipeline (for scanned documents):**
- **Recommended:** Google Cloud Vision OCR (98% accuracy on complex documents, superior for legal text and stamp paper)
- **Alternative:** Tesseract.js (open-source, lower accuracy but cost-effective for simple documents)
- Pipeline: Upload scanned PDF/image → OCR to text → store as version snapshot → enable diff
- Challenge: OCR artifacts may create false diffs — need text normalization layer

### 9.4 Research Findings

| Approach | Accuracy | Cost | Best For |
|----------|----------|------|----------|
| Google Cloud Vision OCR | 98% | Pay-per-use | Scanned stamp paper, complex layouts |
| Tesseract.js | ~85-90% | Free (open source) | Simple digital document backup |
| Clause-level segmentation | High (with visual features) | Compute-intensive | Identifying material vs minor changes |
| Word-level HTML diff | Exact (for digital) | Minimal | V1 implementation |

---

## 10. Design References

### 10.1 Reference Files (clm-cc/)

| File | Use For |
|------|---------|
| `01-api-contracts.md` | All API endpoints, request/response shapes |
| `02-data-models.md` | Prisma schema, TypeScript types, enums |
| `03-auth-rbac.md` | JWT flow, roles, permissions, guards |
| `05-api-client.md` | Frontend API method reference |
| `06-fe-component-map.md` | Current component hierarchy and page inventory |
| `07-ui-flows.md` | 11 user journey flows (POC reference) |
| `08-shared-ui-package.md` | Shared UI component exports |
| `09-design-guide.md` | Stitch Design Guide v2.4.0 — colors, typography, spacing, components |
| `10-monorepo-config.md` | Turborepo setup, workspace layout |

### 10.2 Design System

Refer to `09-design-guide.md` (Stitch Design Guide v2.4.0) for:
- Color palette and tokens
- Typography scale
- Spacing system
- Component patterns (buttons, cards, tables, forms, modals)
- Icon set (Material Symbols Outlined)

---

## 11. Resolved Decisions (formerly Open Questions)

| # | Question | Context | Impact |
|---|----------|---------|--------|
| ~~1~~ | ~~Template versioning~~ | **Locked:** No impact. Existing contracts keep original template. New contracts use updated version. | Resolved |
| ~~2~~ | ~~Template creation method~~ | **Locked:** Legal uploads Part A as HTML/Word file (no rich text editor for template creation). | Resolved |
| ~~3~~ | ~~Admin workflows~~ | **Locked:** V1 = design admin form (name, email, role, org). Invite email + setup link is a later improvement. | Resolved |
| ~~4~~ | ~~Dashboard metrics~~ | **Locked:** Expiry alerts at 3 tiers: critical (30 days), warning (60 days), informational (90 days). | Resolved |
| ~~5~~ | ~~Search functionality~~ | **Locked:** V1 = text search + basic filters (status, date). Saved searches parked for future. | Resolved |
| ~~6~~ | ~~Multi-currency~~ | **Locked:** INR only for V1. All amounts displayed in Indian Rupees. | Resolved |
| ~~7~~ | ~~Approval ordering~~ | **Locked:** Send to Legal takes precedence as the contract status. Counterparty exchange can happen, but when business user uploads back from counterparty, diff check flags changes for review. | Resolved |
| ~~8~~ | ~~Storage limits~~ | **Locked:** BE configurable, no hard FE limit. Agreements can be large (many-page scanned docs). | Resolved |
| ~~9~~ | ~~Email service~~ | **Locked:** Simple SMTP for V1. Branded email templates for future roadmap. FE designs the send UI; service provider is a BE decision. | Resolved |
| ~~10~~ | ~~Minimum character limit~~ | **Locked:** 10 characters minimum for approval remarks. | Resolved |

---

## Appendix A: Permission Matrix

### By Role → Permissions

| Permission | Business User | Legal Manager | Legal Head | Finance Manager | Entity Admin | Super Admin |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| `contract:view` | Own only | All org | All org | All org | All org | All |
| `contract:create` | Yes | Yes | Yes | No | No | Yes |
| `contract:edit` | First draft only | Yes | Yes | No | No | Yes |
| `contract:submit` | Yes | No | No | No | No | Yes |
| `contract:send_counterparty` | Yes | Yes | Yes | No | No | Yes |
| `contract:upload_signed` | Yes | Yes | Yes | No | No | Yes |
| `approval:legal:view` | No | Yes | Yes | No | No | Yes |
| `approval:legal:act` | No | Yes | Yes | No | No | Yes |
| `approval:legal:escalate` | No | Yes | No | No | No | Yes |
| `approval:finance:view` | No | No | No | Yes | No | Yes |
| `approval:finance:act` | No | No | No | Yes | No | Yes |
| `template:view` | Yes | Yes | Yes | Yes | Yes | Yes |
| `template:create` | No | Yes | Yes | No | No | No |
| `template:edit` | No | Yes | Yes | No | No | No |
| `ai:analyze` | Yes | Yes | Yes | Yes | No | Yes |
| `ai:chat` | Yes | Yes | Yes | Yes | No | Yes |
| `admin:user:manage` | No | No | No | No | Yes | Yes |
| `admin:org:manage` | No | No | No | No | Yes | Yes |
| `admin:role:manage` | No | No | No | No | Yes | Yes |
| `admin:audit:view` | No | No | No | No | Yes | Yes |
| `admin:feature:toggle` | No | No | No | No | Yes | Yes |

---

## Appendix B: API Endpoint Summary

See `clm-cc/01-api-contracts.md` for full reference. Summary:

| Module | Endpoints | Key Operations |
|--------|-----------|----------------|
| Auth | 9 | Login, logout, refresh, SSO, forgot/reset password, switch org |
| Contracts | 18 | CRUD, submit, send, cancel, upload (signed + document), versions, compare |
| Templates | 6 | List, get, create, update, enable/disable per org |
| Approvals | 3 | Pending queue, approve, reject/escalate |
| Users | 3 | List, invite, update |
| Organizations | 6 | CRUD, settings, deactivate |
| Roles | 4 | List, get, create, update |
| Permissions | 1 | List (grouped by module) |
| AI | 7 | Analyze, suggest-clause, improve-clause, extract-date, analyze-file, clause-types, upload |
| Analytics | 6 | Summary, by-status, trend, approval metrics, activity, admin stats |
| Audit | 1 | Filterable log |
| Notifications | 3 | Get, mark read, mark all read |
| Oracle | 1 | Chat |
| Search | 3 | Contracts, saved searches, filters |
| Feature Flags | 3 | Get, update, available |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Part A** | Fixed legal body of an agreement template. Locked from business user editing. |
| **Part B / Annexures** | Variable section of agreement containing commercial terms, counterparty details. Editable by business users during first draft. |
| **Oracle** | LLM-powered chat assistant for contract queries and insights. Insight-only — never creates/edits content. |
| **Counterparty** | The external party to the agreement (vendor, client, partner). They interact via email, not through CLM. |
| **Stamp Paper** | Physical legal paper required for certain Indian agreements. Results in scanned document uploads. |
| **Diff** | Side-by-side comparison showing differences between two contract versions. |
| **Escalation** | Legal Manager flagging a contract to Legal Head for higher-level review. |
