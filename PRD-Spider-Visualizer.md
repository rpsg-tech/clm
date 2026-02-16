# CLM Product Requirements Document — Spider Visualizer
## Comprehensive Investigation Map for Product Architecture & Flows

**Generated:** 2026-02-12  
**Source:** CLM-PRD.md (v1.0)  
**Purpose:** Deep-dive analysis of product requirements, user flows, role architectures, and decision trees  
**Scope:** 13 major flows, 6 user roles, 45+ permissions, multi-org architecture

---

## 📊 Executive Summary

| Metric | Count | Notes |
|--------|-------|-------|
| **User Roles** | 6 | SUPER_ADMIN, ENTITY_ADMIN, LEGAL_HEAD, LEGAL_MANAGER, FINANCE_MANAGER, BUSINESS_USER |
| **Major User Flows** | 13 | From authentication to template management |
| **Contract Statuses** | 11 | DRAFT through TERMINATED |
| **Finance Approval States** | 3 | Parallel track: PENDING → APPROVED / SENT_BACK |
| **Permissions** | 45+ | Grouped by module (contract, approval, template, admin, AI) |
| **Organizations Supported** | 10-20 | RPSG Group companies, fully siloed |
| **Tech Stack Layers** | 6 | Frontend (Next.js), Backend (NestJS), Database (PostgreSQL), Storage (S3), Auth (JWT), AI (LLM) |

---

## 🕷️ Spider Diagram 1: User Role Hierarchy & Access Model

```
                         ┌─────────────────────────────────────────┐
                         │ SUPER_ADMIN                              │
                         │ (System-wide — tech/support team)        │
                         │ • View ALL orgs                          │
                         │ • View ALL contracts (system-wide)       │
                         │ • Full admin access (users, orgs, roles) │
                         │ • LangFuse traces & observability        │
                         │ • System health monitoring               │
                         └──────────────┬──────────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────────────────┐
                         │ ENTITY_ADMIN (per Organization)         │
                         │ • View ALL contracts in THEIR org        │
                         │ • User management (invite, role assign)  │
                         │ • Org settings management                │
                         │ • Feature flags (org-level)              │
                         │ • Audit log access                       │
                         └──────────┬─────────┬─────────┬──────────┘
                                    │         │         │
                    ┌───────────────┘         │         └────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
        │ LEGAL_HEAD           │  │ LEGAL_MANAGER        │  │ FINANCE_MANAGER      │
        │ (Team Lead)          │  │ (Default Reviewer)   │  │ (Finance Approval)   │
        │                      │  │                      │  │                      │
        │ • View all contracts │  │ • View all contracts │  │ • View all contracts │
        │ • Edit contracts     │  │ • Edit contracts     │  │ • Cannot edit        │
        │ • Escalate decisions │  │ • Create/edit temp   │  │ • Finance approval   │
        │ • Approve/reject     │  │ • Escalate to Head   │  │ • Review queue       │
        │ • Create/edit temps  │  │ • Approve/reject     │  │ • Remark + amount    │
        │ • Terminate          │  │ • Approve/reject     │  │                      │
        │ • LLM access         │  │ • LLM access         │  │ • LLM access         │
        └──────────┬───────────┘  └──────────┬───────────┘  └──────────────────────┘
                   │                         │
                   └────────────┬────────────┘
                                ▼
                   ┌────────────────────────────────────────┐
                   │ BUSINESS_USER                          │
                   │ (Contract Creator)                     │
                   │                                        │
                   │ • View own contracts only              │
                   │ • Create contracts (template/upload)   │
                   │ • Edit first draft only (Part B)       │
                   │ • Send to legal/counterparty           │
                   │ • Request finance review               │
                   │ • Download & edit offline after draft  │
                   │ • Upload signed versions               │
                   │ • LLM access (own contracts)           │
                   └────────────────────────────────────────┘
```

### Access Scoping Matrix

| Visibility Layer | Business User | Legal Manager | Legal Head | Finance Manager | Entity Admin | Super Admin |
|---|---|---|---|---|---|---|
| **Contract Visibility** | Own only | All org | All org | All org | All org | ALL |
| **Template Management** | View only | Create/Edit/Remove | Create/Edit/Remove | View only | View only | View only |
| **LLM Scope** | Own contracts | Full org scope | Full org scope | Full org scope | Full org scope | System-wide |
| **User Management** | ❌ | ❌ | ❌ | ❌ | ✅ (org-level) | ✅ (system-wide) |
| **Org Settings** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Audit Log** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Feature Flags** | ❌ | ❌ | ❌ | ❌ | ✅ (org) | ✅ (system) |

---

## 🕷️ Spider Diagram 2: Multi-Organization Model

```
                    RPSG GROUP (Parent Company)
                    10-20 independent organizations
                            │
        ┌───────────┬────────┼────────┬───────────┐
        │           │        │        │           │
        ▼           ▼        ▼        ▼           ▼
    ┌────────┐  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │ Org A  │  │ Org B  │ │ Org C  │ │ Org D  │ │ Org E  │
    │ (Silo) │  │ (Silo) │ │ (Silo) │ │ (Silo) │ │ (Silo) │
    └────┬───┘  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
         │          │          │          │          │
         ├─ Users   ├─ Users   ├─ Users   ├─ Users   ├─ Users
         ├─ Roles   ├─ Roles   ├─ Roles   ├─ Roles   ├─ Roles
         ├─ Contrs  ├─ Contrs  ├─ Contrs  ├─ Contrs  ├─ Contrs
         ├─ Temps   ├─ Temps   ├─ Temps   ├─ Temps   ├─ Temps
         └─ NO DATA ├─ NO DATA └─ NO DATA └─ NO DATA └─ NO DATA
            SHARING    SHARING    SHARING    SHARING    SHARING
            (Fully     (Fully     (Fully     (Fully     (Fully
             Siloed)    Siloed)    Siloed)    Siloed)    Siloed)

Multi-Org User Assignment:
┌─────────────────────────────────────────────────────────────┐
│ User "Alice" can belong to multiple orgs with different roles│
│                                                              │
│ Org A: BUSINESS_USER                                         │
│ Org B: LEGAL_MANAGER                                         │
│ Org C: ENTITY_ADMIN                                          │
│                                                              │
│ → Org Selector in UI (workspace-style switching)             │
│ → All data scoped to active org context                      │
│ → No cross-org visibility                                    │
└─────────────────────────────────────────────────────────────┘
```

### Critical Rules
1. **Fully Siloed** — No parent hierarchy, no data sharing
2. **All data scoped** — Users, contracts, templates, permissions all per-org
3. **Role Assignment** — Can differ per org for same user
4. **Context Switching** — UI org selector for multi-org users
5. **Admin Scoping** — ENTITY_ADMIN sees only their org; SUPER_ADMIN sees all

---

## 🕷️ Spider Diagram 3: Authentication & Onboarding Flow

```
                         ┌─────────────────────────┐
                         │ LANDING PAGE + LOGIN    │
                         │ (Single Screen)         │
                         │                         │
                         │ • Email + Password form │
                         │ • "Sign in with Azure   │
                         │   AD SSO" button        │
                         │ • Company branding      │
                         │ • Feature highlights    │
                         └────┬────────────────┬───┘
                              │                │
                    ┌─────────▼┐         ┌────▼──────────┐
                    │ Email/   │         │ Microsoft     │
                    │ Password │         │ Azure AD SSO  │
                    └────┬────┘         └────┬──────────┘
                         │                   │
                         │         ┌─────────┴────────────┐
                         │         │ (Redirect → OAuth)   │
                         │         │ (Callback → Set JWT) │
                         │         │                      │
         ┌───────────────┼─────────┼────────────┐        │
         │               │         │            │        │
         ▼               │         ▼            │        │
    ┌─────────────────┐  │  ┌──────────────┐   │        │
    │ First Login     │  │  │ Existing User│   │        │
    │ After Invite    │  │  │              │   │        │
    │                 │  │  │ → Dashboard  │   │        │
    │ Set Password?   │  │  │ (redirect)   │   │        │
    │ (Temp password) │  │  └──────────────┘   │        │
    └────┬────────────┘  │                     │        │
         │               │                     │        │
         ▼               │                     │        │
    ┌─────────────────┐  │                     │        │
    │ Account Lockout?│  │                     │        │
    │ (5 failed       │  │                     │        │
    │  attempts)      │  │                     │        │
    │                 │  │                     │        │
    │ → 15-min        │  │                     │        │
    │   lockout msg   │  │                     │        │
    └────┬────────────┘  │                     │        │
         │               │                     │        │
         └───────────────┼─────────────────────┴────┐   │
                         │                         │   │
                         ▼                         ▼   │
                    ┌──────────────────────────────────┐│
                    │ Org Selector (Multi-Org Users)   ││
                    │                                  ││
                    │ Single-org users: auto-redirect  ││
                    │ Multi-org users: select context  ││
                    └────────────────┬─────────────────┘│
                                     │                  │
                                     ▼                  │
                    ┌───────────────────────────────────┴┐
                    │ ROLE-APPROPRIATE DASHBOARD         │
                    │                                    │
                    │ • Business User → My Contracts     │
                    │ • Legal → Review Queue             │
                    │ • Finance → Finance Approvals      │
                    │ • Admin → Users/Orgs/Audit         │
                    └────────────────────────────────────┘

Session Management:
┌──────────────────────────────────────────┐
│ JWT Tokens in HttpOnly Cookies           │
│ • Access Token: 15 minutes               │
│ • Refresh Token: 7 days                  │
│ • CSRF protection enabled                │
│ • Secure flag (HTTPS only)               │
│ • SameSite=Strict                        │
└──────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 4: Contract Creation Flows (Twin Paths)

### Path A: Template-Based Contract Creation

```
                         ┌──────────────────────┐
                         │ START: Create Contract│
                         │ (Business User)      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 1: Search/Prompt        │
                         │ Free-text chatbot style:     │
                         │ "I need a concessionaire     │
                         │  agreement"                  │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 2: Template             │
                         │ Recommendations              │
                         │                              │
                         │ System matches & recommends: │
                         │ "This template is suitable   │
                         │  for..."                     │
                         │ (Natural language matching)  │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 3: Template Preview     │
                         │                              │
                         │ Click template:              │
                         │ • Part A preview             │
                         │ • Locked (scroll-only)       │
                         │ • "You cannot edit this"     │
                         │   message                    │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 4: Annexure Editor      │
                         │ (Part B only — EDITABLE)     │
                         │                              │
                         │ Word-editor style interface: │
                         │ • Free text editing          │
                         │ • Fill blanks                │
                         │ • Add/remove rows & columns  │
                         │ • No form fields             │
                         │ (First & only platform edit) │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 5: Full Preview         │
                         │                              │
                         │ Part A + Part B rendered:    │
                         │ • Justified format           │
                         │ • Page break between         │
                         │ • Print-ready document       │
                         │ • User reviews entire doc    │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 6: Oracle Chat          │
                         │ (On-side during preview)     │
                         │                              │
                         │ Available questions:         │
                         │ • "What are the risks?"      │
                         │ • "What are payment terms?"  │
                         │ • General comprehension      │
                         │ (Insight-only — no editing)  │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 7: Submit as Draft      │
                         │                              │
                         │ Save draft                   │
                         │ First version created        │
                         │ Status: DRAFT                │
                         └──────────┬───────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
         FUTURE:    ▼                                ▼
       Editing, ┌────────────────┐    ┌──────────────────────────┐
       etc.     │ Edit Draft     │    │ POST-DRAFT ACTIONS       │
                │ (re-open)      │    │ (next spider)            │
                │ Limited to B   │    │ • Send to Legal          │
                │ only           │    │ • Send to Counterparty   │
                └────────────────┘    │ • Request Finance Review │
                                      └──────────────────────────┘

Key Rules:
• Business user CAN edit Part B during creation
• Business user CANNOT edit Part A (ever)
• ONLY first draft can be edited on platform
• After submission: download → edit offline → upload only
• LLM is insight-only (no content creation/editing)
```

### Path B: Upload-Based Contract Creation

```
                         ┌──────────────────────┐
                         │ START: Upload Contract│
                         │ (Business User)      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 1: Upload Zone          │
                         │                              │
                         │ User uploads counterparty    │
                         │ agreement:                   │
                         │ • PDF                        │
                         │ • Word                       │
                         │ • Scanned image              │
                         │                              │
                         │ Explicitly marked as         │
                         │ "counterparty format"        │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 2: Document Preview     │
                         │                              │
                         │ Preview of uploaded doc      │
                         │ NOT EDITABLE                 │
                         │ (Preview only)               │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 3: Metadata Form        │
                         │                              │
                         │ User fills in:               │
                         │ • Title                      │
                         │ • Counterparty name/email    │
                         │ • Contract amount            │
                         │ • Dates (start, end)         │
                         │ • Description                │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 4: AI Extraction        │
                         │                              │
                         │ System auto-extracts:        │
                         │ • Dates                      │
                         │ • Payment terms              │
                         │ • Party information          │
                         │ (where possible)             │
                         │                              │
                         │ User confirms extracted data │
                         └──────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────────┐
                         │ STEP 5: Ready for Actions    │
                         │                              │
                         │ Draft created                │
                         │ Status: DRAFT                │
                         │ Same post-draft actions as   │
                         │ template-based flow          │
                         └──────────┬───────────────────┘
                                    │
                         SAME FLOW ▼ AS ABOVE
                    ┌──────────────────────────────┐
                    │ POST-DRAFT ACTIONS           │
                    │ • Send to Legal              │
                    │ • Send to Counterparty       │
                    │ • Request Finance Review     │
                    └──────────────────────────────┘

Key Rules:
• No Word editor for uploads
• Preview-only (no editing on platform)
• AI extraction is assistive (user confirms)
• OCR needed for scanned stamp paper docs
• Same approval flow as template-based
```

---

## 🕷️ Spider Diagram 5: Post-Draft Actions (3-Way Fork)

```
                    ┌──────────────────────────────┐
                    │ DRAFT COMPLETE               │
                    │ (Contract saved)             │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────┴──────────┬───────────────┐
                    │                     │               │
                    ▼                     ▼               ▼
         ┌──────────────────┐  ┌─────────────────────┐ ┌──────────────────────┐
         │ ACTION 1:        │  │ ACTION 2:           │ │ ACTION 3:            │
         │ SEND TO LEGAL    │  │ SEND TO COUNTERPARTY│ │ REQUEST FINANCE      │
         │                  │  │                     │ │ REVIEW               │
         │ Status Change:   │  │ Status Change:      │ │                      │
         │ DRAFT →          │  │ DRAFT →             │ │ Creates Finance      │
         │ SENT_TO_LEGAL    │  │ SENT_TO_COUNTERP    │ │ approval record      │
         │                  │  │                     │ │ (Parallel track)     │
         │ What Happens:    │  │ What Happens:       │ │                      │
         │ • Contract →     │  │ • Email sent        │ │ What Happens:        │
         │   legal queue    │  │ • Subject/body/CC   │ │ • Finance Manager    │
         │ • Legal Manager  │  │ • Replies →         │ │   sees in queue      │
         │   sees it in     │  │   business user     │ │ • Runs PARALLEL to   │
         │   actionables    │  │ • Counterparty      │ │   legal/counterp     │
         │ • Smart queue    │  │   interacts via     │ │ • NOT a blocking     │
         │   assignment     │  │   email (external)  │ │   gate               │
         │                  │  │ • Diff check on     │ │                      │
         │ Note: Priority   │  │   new version       │ │ Note: Independent    │
         │ displayed status │  │   flagged           │ │ & non-blocking       │
         │ when multiple    │  │                     │ │                      │
         │ tracks active    │  │ Note: CLM internal  │ │                      │
         │                  │  │ only; counterparty  │ │                      │
         │                  │  │ uses email          │ │                      │
         └──────────────────┘  └─────────────────────┘ └──────────────────────┘

CRITICAL ORDERING RULE:
┌────────────────────────────────────────────────────────────┐
│ "Send to Legal TAKES PRECEDENCE as displayed contract     │
│ status when both legal and counterparty tracks active"     │
│                                                            │
│ Example: SENT_TO_LEGAL shown even if also sent to CP      │
└────────────────────────────────────────────────────────────┘

PARALLEL FINANCE TRACK:
┌────────────────────────────────────────────────────────────┐
│ Finance review is INDEPENDENT/PARALLEL                     │
│ • Does NOT gate legal track                               │
│ • Does NOT gate counterparty track                        │
│ • Can be requested at any time (before/after other acts) │
│ • Runs in separate workflow queue                         │
└────────────────────────────────────────────────────────────┘

Optional: Edit Draft Before Actions
┌────────────────────────────────────────────────────────────┐
│ Business user can re-open editor for further changes      │
│ BEFORE taking any post-draft action:                      │
│ • Limited to Part B (annexures) only                      │
│ • Not available after first submission action             │
└────────────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 6: Legal Review & Approval Flow

```
                    ┌─────────────────────────────────┐
                    │ CONTRACT ENTERS LEGAL QUEUE     │
                    │ (Status: SENT_TO_LEGAL)         │
                    └──────────┬──────────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────────┐
                    │ STEP 1: Legal Queue             │
                    │ Inbox-style list                │
                    │ • Sorted by urgency             │
                    │ • Pending review contracts      │
                    │ (Legal Manager sees all org)    │
                    └──────────┬──────────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────────┐
                    │ STEP 2: Click Contract          │
                    │ Contract Detail Screen          │
                    │ • Status history                │
                    │ • Past revisions                │
                    │ • Diffs between versions        │
                    │ • Quick context understanding   │
                    └──────────┬──────────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────────┐
                    │ STEP 3: Review Screen           │
                    │ • Full agreement preview        │
                    │ • Action buttons                │
                    │ • Status history                │
                    │ • Audit trail                   │
                    │ • Oracle Chat on-side           │
                    │   (risks, clauses, terms)       │
                    └──────────┬──────────────────────┘
                               │
         ┌─────────────────────┼────────────────┬─────────────────────┐
         │                     │                │                     │
         ▼                     ▼                ▼                     ▼
    ┌──────────────┐   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ ACTION 1:    │   │ ACTION 2:    │  │ ACTION 3:    │  │ CAPABILITY:  │
    │ APPROVE      │   │ SEND BACK    │  │ ESCALATE TO  │  │ EDIT ON      │
    │              │   │ WITH NOTES   │  │ LEGAL HEAD   │  │ PLATFORM     │
    │ Mandatory    │   │              │  │              │  │              │
    │ remark       │   │ Mandatory    │  │ Flag for     │  │ Can edit     │
    │ (min chars)  │   │ notes        │  │ escalation   │  │ contracts    │
    │              │   │ (min chars)  │  │ (required)   │  │ directly on  │
    │ Status→      │   │              │  │              │  │ platform at  │
    │ LEGAL_APPROV │   │ Status→      │  │ Status→      │  │ any time     │
    │ ED           │   │ REVISION_REQ │  │ ESCALATED_TO_│  │              │
    │              │   │              │  │ HEAD         │  │ (Unlike      │
    │ Proceeds to  │   │ Returned to  │  │              │  │ business     │
    │ next track   │   │ business user│  │ Sent to Legal│  │ user who     │
    │ (counterp    │   │ for revision │  │ Head's queue │  │ must         │
    │ or sign)     │   │              │  │ (prioritized)│  │ download/    │
    │              │   │ Business user│  │              │  │ upload)      │
    │              │   │ downloads &  │  │ Legal Head:  │  │              │
    │              │   │ edits offline│  │ • Review     │  │              │
    │              │   │              │  │ • Approve    │  │              │
    │              │   │              │  │ • Send back  │  │              │
    │              │   │              │  │ • Return to  │  │              │
    │              │   │              │  │   manager    │  │              │
    └──────────────┘   └──────────────┘  └──────────────┘  └──────────────┘

ESCALATION FLOW:
┌──────────────────────────────────────────────────────────────┐
│ Legal Manager Flags → Legal Head Reviews:                    │
│ • Complex/high-stakes contracts                              │
│ • Legal Head: APPROVED / SEND_BACK / RETURN_TO_MANAGER      │
│ • Bypasses Legal Manager approval requirement                │
│ • Legal Head has all same capabilities                       │
└──────────────────────────────────────────────────────────────┘

NO EXPLICIT "REJECT" BUTTON:
┌──────────────────────────────────────────────────────────────┐
│ Rejection = "Send Back with Notes" → REVISION_REQUESTED      │
│ No separate reject action                                     │
│ Always gives business user chance to revise                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 7: Finance Review Flow (Parallel Track)

```
                    ┌──────────────────────────────────┐
                    │ FINANCE REVIEW REQUESTED          │
                    │ (Explicit request from BU/Legal)  │
                    │ (Parallel to Legal/Counterparty)  │
                    └──────────┬───────────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────┐
                    │ STEP 1: Finance Queue            │
                    │ Inbox-style list                 │
                    │ • Contracts where finance        │
                    │   explicitly requested           │
                    │ (Finance Manager sees all org)   │
                    └──────────┬───────────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────┐
                    │ STEP 2: Contract Detail          │
                    │ Full contract view               │
                    │ • Commercial details highlighted │
                    │ • Status & history               │
                    │ • Previous approvals              │
                    └──────────┬───────────────────────┘
                               │
         ┌─────────────────────┴────────────────┐
         │                                      │
         ▼                                      ▼
    ┌──────────────────────┐   ┌──────────────────────────┐
    │ ACTION 1: APPROVE    │   │ ACTION 2: SEND BACK      │
    │                      │   │ WITH NOTES               │
    │ Mandatory remark:    │   │                          │
    │ "Financials approved │   │ Mandatory notes/remarks  │
    │  for [amount]        │   │ (min chars)              │
    │  mentioned in        │   │                          │
    │  contract"           │   │ Status→                  │
    │                      │   │ FINANCE_SENT_BACK        │
    │ Status→              │   │                          │
    │ FINANCE_APPROVED     │   │ Implies: REVISION_REQ    │
    │                      │   │                          │
    │ Captures:            │   │ Business user notified   │
    │ • Approved amount    │   │ • Downloads contract     │
    │ • Conditions (remark)│   │ • Edits offline          │
    │                      │   │ • Uploads new version    │
    │                      │   │ • Finance re-approves    │
    │                      │   │                          │
    └──────────────────────┘   └──────────────────────────┘

KEY RULES — PARALLEL NATURE:
┌──────────────────────────────────────────────────────┐
│ ✓ Finance review ONLY appears when EXPLICITLY        │
│   requested by business user OR legal team           │
│                                                      │
│ ✓ Runs PARALLEL to legal review                      │
│   → Does NOT gate legal approval                     │
│   → Does NOT gate counterparty negotiation           │
│                                                      │
│ ✓ Finance approval gives legal team confidence      │
│   on commercial terms                                │
│                                                      │
│ ✓ Separate from main contract lifecycle              │
│   → Tracked as parallel "approval record"            │
│                                                      │
│ ✓ Finance rejection = send back with notes           │
│   → Implies REVISION_REQUESTED on contract           │
│   → Business user must revise AND re-submit          │
│                                                      │
│ ✗ Finance approval DOES NOT prevent                 │
│   signing/execution without finance approval         │
│                                                      │
└──────────────────────────────────────────────────────┘

EDGE CASE — Finance Rejection After Signing:
┌──────────────────────────────────────────────────────┐
│ IF: Finance sends back AFTER contract ACTIVE         │
│                                                      │
│ THEN: Finance approval is "advisory" for signed      │
│       contracts. Execution continues.                │
│       Audit trail shows finance objection.           │
│                                                      │
│ Finance is non-blocking for ACTIVE status.           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 8: Revision Flow (Send Back → Edit → Resubmit)

```
                    ┌──────────────────────────────┐
                    │ CONTRACT SENT BACK            │
                    │ (Status: REVISION_REQUESTED)  │
                    │ From: Legal/Finance           │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             ┌────────────────┐   ┌──────────────────┐
             │ Notification   │   │ Status display   │
             │ (Future: in-app│   │ in contract view │
             │  + email)      │   │ V1: visible in   │
             │ V1: contract   │   │ contract status  │
             │ status only    │   └──────────────────┘
             └────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────┐
         │ STEP 1: Business User Downloads  │
         │                                  │
         │ Downloads contract as:           │
         │ • Word document (.docx)          │
         │ • Contains both Part A + B       │
         │ • Editable format                │
         └──────────┬───────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────┐
         │ STEP 2: Edit Offline             │
         │                                  │
         │ User's local system:             │
         │ • Opens in Word/editor           │
         │ • Makes revisions per feedback   │
         │ • Can edit Part A & B            │
         │ (Legal Head can edit if involved)│
         │ • Offline only                   │
         └──────────┬───────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────┐
         │ STEP 3: Upload Revised Version   │
         │                                  │
         │ Upload revised .docx back to CLM │
         │ • Creates new version snapshot   │
         │ • System stores changeLog        │
         └──────────┬───────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────┐
         │ STEP 4: Diff Computation         │
         │                                  │
         │ System computes diff:            │
         │ • Word-level HTML diff           │
         │ • Side-by-side view              │
         │ • Green (additions)              │
         │ • Red (deletions)                │
         │ • Yellow (modifications)         │
         │ • Change stats: +X, -Y, Z mods   │
         └──────────┬───────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────┐
         │ STEP 5: Alert Check              │
         │                                  │
         │ IF diff exceeds threshold→       │
         │   Alert stakeholders to re-review│
         │   (See Section 9: Diff Strategy) │
         │                                  │
         │ ELSE→                            │
         │   Continue                       │
         └──────────┬───────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────┐
         │ STEP 6: Resubmit for Review      │
         │                                  │
         │ Business user resubmits:         │
         │ • Status back to: SENT_TO_LEGAL  │
         │ • Legal sees in queue again      │
         │ • Can view diff                  │
         │ • Approves or sends back again   │
         │                                  │
         │ OR:                              │
         │ • Status back to: SENT_TO_FIN    │
         │ • Finance re-approves            │
         └──────────────────────────────────┘

KEY RULES:
┌────────────────────────────────────────────────────┐
│ ✓ Business user CANNOT edit on platform after      │
│   first draft (must download & edit offline)       │
│                                                    │
│ ✓ Legal CAN edit on platform at any time           │
│   (not restricted to offline)                      │
│                                                    │
│ ✓ Uploading new version does NOT auto-reset       │
│   existing approvals                               │
│                                                    │
│ ✓ Approvals preserved, BUT stakeholders alerted    │
│   if significant changes detected                  │
│                                                    │
│ ✓ Can loop indefinitely — no max revision count    │
│   (potential risk for long-running revision loops) │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 9: Counterparty Exchange & Signing Flow

```
SCENARIO A: Counterparty Accepts As-Is
┌────────────────────────────────────────────────────┐
│                                                    │
│  Step 1: BU Sends to Counterparty (via email)     │
│           Status: SENT_TO_COUNTERPARTY             │
│                                                    │
│  Step 2: Counterparty Signs (offline)              │
│           • On stamp paper OR digitally            │
│           • Via email reply (external)             │
│                                                    │
│  Step 3: BU Receives Signed Copy (email reply)     │
│           • Downloads from email                   │
│                                                    │
│  Step 4: BU Uploads Signed Version to CLM          │
│           • Action: Upload signed version          │
│           • Status: PENDING_SIGNATURE              │
│           • Mark: "Signed by counterparty"         │
│                                                    │
│  Step 5: (Optional) Send to Legal for Final Review │
│           • Status: back to SENT_TO_LEGAL          │
│           • Legal Manager final review             │
│           • If approved → LEGAL_APPROVED           │
│                                                    │
│  Step 6: BU Downloads for Company Head Signature   │
│           • Downloads fully-executed copy          │
│           • Company head signs (offline/stamp)     │
│                                                    │
│  Step 7: BU Uploads Final Fully-Executed Version   │
│           • Action: Upload signed version          │
│           • Mark: "Fully Executed"                 │
│           • Status: SIGNED                         │
│                                                    │
│  Step 8: System Auto-Transition                    │
│           • Status: SIGNED → ACTIVE                │
│           • Contract is now ACTIVE                 │
│                                                    │
└────────────────────────────────────────────────────┘

SCENARIO B: Counterparty Requests Changes (Negotiation Cycle)
┌────────────────────────────────────────────────────┐
│                                                    │
│  Step 1: BU Sends to Counterparty (via email)     │
│           Status: SENT_TO_COUNTERPARTY             │
│                                                    │
│  Step 2: Counterparty Replies with Modified Vers   │
│           • Sends back updated version (email)     │
│                                                    │
│  Step 3: BU Uploads New Version to CLM             │
│           Status: SENT_TO_COUNTERPARTY (still)     │
│                                                    │
│  Step 4: Diff Computed                             │
│           • Changes detected                       │
│           IF significant diff→                     │
│               Status: RE_REVIEW_FLAGGED            │
│               Stakeholders alerted                 │
│           ELSE→                                    │
│               Continue                             │
│                                                    │
│  Step 5: (Optional) Send to Legal Re-Review        │
│           Status: SENT_TO_LEGAL                    │
│           Legal reviews changes                    │
│                                                    │
│  Step 6: BU May Upload Again (or Send Again)       │
│           Back to SENT_TO_COUNTERPARTY (loop)      │
│                                                    │
│  Step 7: Once Agreement Reached → Signing Flow     │
│           Follow Scenario A from Step 3 onwards    │
│                                                    │
└────────────────────────────────────────────────────┘

SIGNED VERSION UPLOAD OPTIONS:
┌────────────────────────────────────────────────────┐
│ UI dropdown at upload time:                        │
│ ○ Signed by Counterparty                           │
│ ○ Signed by Our Company                            │
│ ○ Fully Executed                                   │
│                                                    │
│ Upload only available once prior statuses done     │
│ (e.g., legal approval if required)                 │
│                                                    │
│ MANDATORY: Final signed version MUST be uploaded   │
│ to portal (hard requirement)                       │
└────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 10: Agreement Management & List Views

```
┌─────────────────────────────────────────────────────────────┐
│ AGREEMENTS/CONTRACTS NAVIGATION                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ LIST VIEW    │────────▶│ DETAIL VIEW  │                  │
│  │ (All Org     │         │ (Full Info)  │                  │
│  │ Contracts)   │         │              │                  │
│  └──────────────┘         └──────────────┘                  │
│         │                        │                           │
│         │                        └──────────────┐            │
│         │                                       ▼            │
│         │                              ┌──────────────────┐ │
│         └─────────────────────────────▶│ PREVIEW/REVIEW   │ │
│                                        │ SCREEN           │ │
│                                        │ (Full Agreement) │ │
│                                        └──────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

LIST VIEW (9a):
┌─────────────────────────────────────────────────────────────┐
│ Contract line items with:                                   │
│ • Name                                                      │
│ • Counterparty name                                         │
│ • Status badge (color-coded)                                │
│ • Contract amount                                           │
│ • Start/end dates                                           │
│ • Expiry indicator                                          │
│                                                              │
│ Features:                                                   │
│ • Text search (titles, counterparty names)                  │
│ • Filters: status, date range, template type, counterparty  │
│ • Quick actions (per-row) based on status + permissions     │
│ • Pagination with configurable page size                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

DETAIL VIEW (9b) — Tabbed Interface:
┌─────────────────────────────────────────────────────────────┐
│ TAB 1: Status & History                                     │
│        • Current status                                     │
│        • Full timeline (who did what when)                  │
│        • Status change history                              │
│                                                              │
│ TAB 2: Past Revisions                                       │
│        • Version history                                    │
│        • Creator, timestamp, change summary                 │
│        • Download old versions                              │
│                                                              │
│ TAB 3: Diffs                                                │
│        • Side-by-side comparison (any two versions)         │
│        • Word-level highlighting                           │
│        • Change statistics                                  │
│                                                              │
│ TAB 4: Actionable Items                                     │
│        • Context-aware action buttons                       │
│        • Based on status + role + permissions               │
│        • Approve, send back, send to counterparty, etc.     │
│                                                              │
│ TAB 5: LLM Chat (Oracle)                                    │
│        • Query the contract                                 │
│        • Terms, clauses, risks                              │
│        • Insight-only                                       │
│                                                              │
│ TAB 6: Approval Trail                                       │
│        • Legal approval records with remarks                │
│        • Finance approval records with amounts              │
│        • Timestamp & who approved                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

PREVIEW/REVIEW SCREEN (9c):
┌─────────────────────────────────────────────────────────────┐
│ Separate from Detail — Full agreement reader                │
│ • Part A + Part B rendered together                         │
│ • Justified format, print-ready                             │
│ • Statuses and action history visible                       │
│ • LLM chat available on-side                                │
│ • Action buttons for current status                         │
│   (approve, send back, send to counterparty, etc.)          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

KEY RULE: Consistent Across All Roles
┌─────────────────────────────────────────────────────────────┐
│ Same structure seen by:                                     │
│ • Business User                                             │
│ • Legal Manager/Head                                        │
│ • Finance Manager                                           │
│ • Admin                                                     │
│                                                              │
│ Differences: role-appropriate actions + data scoping        │
│ (BU sees own only; Legal/Finance see all org)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 11: LLM Oracle & Intelligence

```
                    ┌──────────────────────────────┐
                    │ LLM ORACLE CHAT              │
                    │ (Side-panel during preview)  │
                    │ Available: All users         │
                    │ (with AI permissions)        │
                    └──────────┬───────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
    ┌──────────────┐   ┌──────────────────┐  ┌──────────────┐
    │ CONTRACT Q&A │   │ RISK ANALYSIS    │  │ CROSS-CONTRT │
    │              │   │ (Per-contract)   │  │ SEARCH       │
    │ Ask about:   │   │                  │  │              │
    │ • Terms      │   │ • Risk score     │  │ Natural      │
    │ • Clauses    │   │   (1-10)         │  │ language     │
    │ • Payment    │   │ • Flag issues    │  │ queries      │
    │ • Termination│   │ • Suggest areas  │  │ across all   │
    │ • Risks      │   │   of concern     │  │ accessible   │
    │ • General    │   │                  │  │ contracts    │
    │   compreh.   │   │                  │  │              │
    └──────────────┘   └──────────────────┘  └──────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
    ┌──────────────────────────┴────────────────────────────┐
    │                                                       │
    ▼                                                       ▼
 ┌──────────────────┐                            ┌──────────────────┐
 │ CLAUSE SUGGEST.  │                            │ CHANGE SUMMARIZ. │
 │ (Per-contract)   │                            │ (Per-version)    │
 │                  │                            │                  │
 │ Suggest clause   │                            │ AI summarizes:   │
 │ language for     │                            │ • What changed   │
 │ specific clause  │                            │   between vers   │
 │ types            │                            │ • High-level     │
 │                  │                            │   summary        │
 └──────────────────┘                            └──────────────────┘

HARD RULES — INSIGHT-ONLY LLM:
┌──────────────────────────────────────────────────────┐
│ ✗ NEVER creates or edits agreement content           │
│ ✗ No AI-generated text inserted into contracts       │
│ ✓ All capabilities gated by ai:analyze + ai:chat     │
│ ✓ May be feature-flagged per org (AI_CONTRACT_REVIEW)│
│ ✓ LLM serves only as query/analysis tool             │
│                                                      │
└──────────────────────────────────────────────────────┘

PERMISSION GATES:
┌──────────────────────────────────────────────────────┐
│ ai:analyze permission → Risk analysis, insights      │
│ ai:chat permission    → Q&A, cross-contract search   │
│ Can be disabled per role or org-wide                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 12: Template Management (Legal Only)

```
                    ┌──────────────────────────────┐
                    │ TEMPLATES                    │
                    │ (Legal Manager/Head only)    │
                    └──────────┬───────────────────┘
                               │
         ┌─────────────────────┼──────────────────┐
         │                     │                  │
         ▼                     ▼                  ▼
    ┌──────────────┐  ┌────────────────┐  ┌─────────────┐
    │ STEP 1:      │  │ STEP 2:        │  │ STEP 3:     │
    │ Template     │  │ Create Template│  │ Edit        │
    │ Library      │  │                │  │ Template    │
    │              │  │ Define:        │  │             │
    │ Grid view:   │  │ • Name         │  │ Modify:     │
    │ • Category   │  │ • Code         │  │ • Content   │
    │   filters    │  │ • Category     │  │ • Org access│
    │ • Search     │  │ • Description  │  │ • Toggle    │
    │ • Active/    │  │ • Part A upload│  │   enable/   │
    │   inactive   │  │ • Annexure     │  │   disable   │
    │   toggle     │  │   structure    │  │              │
    │              │  │   (fields,     │  │              │
    │              │  │   blanks)      │  │              │
    │              │  │                │  │              │
    │              │  │ Upload:        │  │              │
    │              │  │ • HTML or      │  │              │
    │              │  │ • Word file    │  │              │
    │              │  │ (not rich text │  │              │
    │              │  │  editor)       │  │              │
    │              │  │                │  │              │
    │              │  └────────────────┘  └─────────────┘
    │              │          │                  │
    └──────────────┘          │                  │
                              │                  │
                              └──────────┬───────┘
                                         │
                                         ▼
                         ┌───────────────────────────┐
                         │ STEP 4: Org Access        │
                         │                           │
                         │ Toggle which orgs can use │
                         │ this template:            │
                         │ • Global (all orgs)       │
                         │ • Org-specific            │
                         │ • Enable/disable per org  │
                         └───────────────────────────┘

KEY RULES:
┌──────────────────────────────────────────────────────┐
│ ✓ ONLY Legal Manager & Legal Head                   │
│   can create, edit, remove templates                 │
│                                                      │
│ ✗ Finance, Business User, Admin cannot              │
│   manage templates                                   │
│                                                      │
│ ✓ Templates define:                                 │
│   • Part A (fixed body) — HTML/Word upload         │
│   • Part B structure — annexure fields/blanks       │
│                                                      │
│ ✓ Template Versioning (Locked Decision):            │
│   • Existing contracts keep ORIGINAL template       │
│     content when created                            │
│   • Only NEW contracts use updated template         │
│   • Templates are static once contract created      │
│                                                      │
└──────────────────────────────────────────────────────┘

TEMPLATE CATEGORIES (7 types):
┌──────────────────────────────────────────────────────┐
│ SERVICE_AGREEMENT    → IT services, consulting       │
│ NDA                  → Non-disclosure agreements     │
│ PURCHASE_ORDER       → Procurement contracts        │
│ VENDOR_AGREEMENT     → Supplier contracts           │
│ EMPLOYMENT           → Employment contracts         │
│ LEASE                → Property/equipment leases    │
│ OTHER                → Catch-all category           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 13: Dashboard Views (Role-Specific)

```
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARDS — Role-Specific Content (All on Single Page)         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BUSINESS USER DASHBOARD                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STATS SECTION                                            │  │
│  │ • My Contracts (total count)                             │  │
│  │ • Active contracts                                       │  │
│  │ • Drafts awaiting action                                 │  │
│  │ • Pending review (sent to legal/finance)                 │  │
│  │                                                          │  │
│  │ ATTENTION BANNER (Red Flag Section)                      │  │
│  │ • Contracts sent back for revision                       │  │
│  │ • Expiring contracts (soon)                              │  │
│  │ • Finance/legal hold notifications                       │  │
│  │                                                          │  │
│  │ MY RECENT CONTRACTS                                      │  │
│  │ • Table with last 10 contracts                           │  │
│  │ • Status badges (color-coded)                            │  │
│  │ • Dates, counterparty, amounts                           │  │
│  │                                                          │  │
│  │ QUICK ACTION                                             │  │
│  │ • Create New Contract (primary CTA)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  LEGAL MANAGER / LEGAL HEAD DASHBOARD                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PENDING REVIEW QUEUE (TOP — URGENT)                      │  │
│  │ • Contracts awaiting legal review                        │  │
│  │ • Sorted by urgency/date submitted                       │  │
│  │ • Quick action: open to review                           │  │
│  │                                                          │  │
│  │ ESCALATED ITEMS (Legal Head only, TOP)                  │  │
│  │ • Contracts flagged by Legal Manager                     │  │
│  │ • Prioritized queue                                      │  │
│  │ • Quick action: open to decide                           │  │
│  │                                                          │  │
│  │ ORG CONTRACT STATS                                       │  │
│  │ • Total contracts in org                                 │  │
│  │ • Breakdown by status (counts)                           │  │
│  │ • Pending review count (actionables)                     │  │
│  │ • Approved this period                                   │  │
│  │                                                          │  │
│  │ EXPIRING CONTRACTS ALERT                                 │  │
│  │ ┌──────────────────────────────────────────────────────┐ │  │
│  │ │ Critical (30 days)   [Red badge]                    │ │  │
│  │ │ Warning (60 days)    [Amber badge]                  │ │  │
│  │ │ Informational (90)   [Blue badge]                   │ │  │
│  │ └──────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │ ACTIVE CONTRACT VALUE                                   │  │
│  │ • Total $ value of active contracts (org-wide)          │  │
│  │                                                          │  │
│  │ STATUS BREAKDOWN CHART                                  │  │
│  │ • Counts by status (DRAFT, SENT_TO_LEGAL, etc.)        │  │
│  │ • Visual breakdown (pie or bar)                         │  │
│  │                                                          │  │
│  │ ADVANCED ANALYTICS (Future roadmap)                     │  │
│  │ • Trends, approval turnaround, cycle times              │  │
│  │ • Parked for future                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  FINANCE MANAGER DASHBOARD                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PENDING FINANCE APPROVALS (TOP — URGENT)                 │  │
│  │ • Contracts where finance explicitly requested           │  │
│  │ • Sorted by priority/date                                │  │
│  │ • Quick action: open to approve/send back                │  │
│  │                                                          │  │
│  │ APPROVED THIS PERIOD                                     │  │
│  │ • Finance approvals (count)                              │  │
│  │ • Amounts approved (total $)                             │  │
│  │ • Timestamp & user                                       │  │
│  │                                                          │  │
│  │ ORG CONTRACT OVERVIEW                                    │  │
│  │ • Full agreement list                                    │  │
│  │ • Search, filter, export                                 │  │
│  │ • All org contracts visible                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  SUPER ADMIN DASHBOARD                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SYSTEM HEALTH                                            │  │
│  │ • Database status (up/down, latency)                     │  │
│  │ • Redis cache status                                     │  │
│  │ • Memory usage, server health                            │  │
│  │                                                          │  │
│  │ USER STATS                                               │  │
│  │ • Total registered users (all orgs)                      │  │
│  │ • Active sessions (real-time)                            │  │
│  │ • Recent logins                                          │  │
│  │                                                          │  │
│  │ ORG OVERVIEW                                             │  │
│  │ • All organizations list (10-20)                         │  │
│  │ • Contract counts per org                                │  │
│  │ • User counts per org                                    │  │
│  │                                                          │  │
│  │ AUDIT LOG QUICK VIEW                                     │  │
│  │ • Recent system events (last 50)                         │  │
│  │ • Filter by action, user, module, date                   │  │
│  │                                                          │  │
│  │ LANGFUSE LINK                                            │  │
│  │ • AI traces & observability (external link)              │  │
│  │ • LLM performance monitoring                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

DASHBOARD DESIGN RULES:
┌──────────────────────────────────────────────────────────────┐
│ ✓ Urgency-focused: actionables at the TOP                    │
│ ✓ Role-specific content (not generic)                        │
│ ✓ Business User sees only own contracts                      │
│ ✓ Legal/Finance see all org contracts                        │
│ ✓ Simple V1: counts + actionables, no complex charts         │
│ ✓ Expiry tiering locked: 30d (critical), 60d (warning),     │
│   90d (informational)                                        │
│ ✓ Insights kept simple for V1                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🕷️ Spider Diagram 14: Admin & User Management

```
                    ┌──────────────────────────┐
                    │ ADMIN SECTION            │
                    │ (Entity Admin/Super Admin)
                    └──────────┬───────────────┘
                               │
         ┌─────────────────────┼──────────────┬───────────────┐
         │                     │              │               │
         ▼                     ▼              ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────────┐
    │ USERS       │  │ ROLES       │  │ ORGS     │  │ PERMISSIONS  │
    │             │  │             │  │          │  │ (Read-only)  │
    │ User table: │  │ Role list:  │  │ Org list:│  │              │
    │ • Invite    │  │ • View all  │  │ • Create │  │ Matrix view: │
    │   (admin    │  │ • Edit      │  │ • Edit   │  │ • Grouped by │
    │   -only)    │  │ • Permiss.  │  │   settings  │   module     │
    │ • Edit role │  │   counts    │  │ • Deacti-│  │ • Read-only  │
    │   per org   │  │ • System    │  │   vate   │  │   reference  │
    │ • Edit orgs │  │   roles     │  │          │  │              │
    │   assigned  │  │   (read-    │  │          │  │ Modules:     │
    │ • Activate/ │  │   only)     │  │          │  │ • Contract   │
    │   deactivate│  │             │  │          │  │ • Approval   │
    │             │  │             │  │          │  │ • Template   │
    │ Invite via  │  │             │  │          │  │ • Admin      │
    │ email       │  │             │  │          │  │ • AI         │
    │ (V1 =       │  │             │  │          │  │ • etc.       │
    │ basic form, │  │             │  │          │  │              │
    │ no setup    │  │             │  │          │  │              │
    │ link yet)   │  │             │  │          │  │              │
    └─────────────┘  └─────────────┘  └──────────┘  └──────────────┘
                               │
                        ┌──────┴──────┐
                        │             │
                        ▼             ▼
                    ┌──────────┐  ┌──────────────────┐
                    │ AUDIT LOG│  │ FEATURE FLAGS    │
                    │          │  │                  │
                    │ Filterable   │ Org-level toggles
                    │ by:       │  │ e.g. AI_CONTRACT │
                    │ • Module  │  │ _REVIEW          │
                    │ • Action  │  │                  │
                    │ • User    │  │ Toggle on/off    │
                    │ • Date    │  │ per org           │
                    │           │  │                  │
                    │ Records   │  │ Super Admin:     │
                    │ all       │  │ • System-wide    │
                    │ events    │  │ • Per-org        │
                    │           │  │ • Read per-org   │
                    └──────────┘  └──────────────────┘

SUPER ADMIN ADDITIONAL ACCESS:
┌────────────────────────────────────────────────────┐
│ • Can see/manage ACROSS ALL organizations         │
│ • Tech admin dashboard: system metrics, cache     │
│   stats, health checks                            │
│ • LangFuse access for AI traces & observability   │
│                                                   │
└────────────────────────────────────────────────────┘

V1 ADMIN LIMITATIONS (Locked Decision):
┌────────────────────────────────────────────────────┐
│ V1 = Design admin form (name, email, role, org)   │
│ Future = Invite email + setup link improvement    │
│                                                   │
└────────────────────────────────────────────────────┘
```

---

## 📋 Complete Contract Status Lifecycle

```
                          ┌─────────┐
                          │ DRAFT   │
                          └────┬────┘
                    ┌─────────┬┴────────┬──────────────┐
                    │         │        │              │
                    ▼         ▼        ▼              ▼
        ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
        │ SENT_TO_LEGAL    │ │SENT_TO_COUNTER       │FINANCE_REVIEW_REQ
        │                  │ │PARTY (Parallel)      │(Parallel Track)
        │ Path 1: Legal    │ │                      │
        │ Review Track     │ │ Path 2: Counterparty │ Path 3: Finance
        │                  │ │ Exchange Track       │ Track (Non-blocking)
        └────┬────┬────┬───┘ └──────┬────┬─────────┘ └──────┬────────┘
             │    │    │            │    │                  │
        ┌────▼─┐  │    │    ┌───────▼┐   │          ┌───────▼──────┐
        │Legal │  │    │    │RE_REVIEW   │          │FINANCE_APPR  │
        │App'd │  │    │    │_FLAGGED    │          │OVED          │
        └──┬───┘  │    │    └───────┬────┘          └──────────────┘
           │      │    │            │
        ┌──▼──────┼─┐  │    ┌───────▼─────────────┐
        │          │  │    │ (can loop back to   │
        └──────────┘  │    │  SENT_TO_COUNTERP)  │
                      │    │                      │
        ┌─ESCALATION  │    └──────────┬───────────┘
        │ ─────────┐  │               │
        ▼          ▼  ▼               ▼
    ┌──────────┐┌──────────┐  ┌──────────────────┐
    │ESCALATED │ REVISION  │  │ PENDING_SIGNATURE│
    │_TO_HEAD  │ _REQUESTED│  │                  │
    │          │           │  │ (After legal ok  │
    │ Legal    │ (BU       │  │  OR counterparty │
    │ Head     │ downloads │  │  response)       │
    │ Review   │ edits &   │  │                  │
    │ (Priority│ uploads)  │  │                  │
    └────┬─────┘│          │  └────────┬─────────┘
         │      └────┬─────┘           │
         │           │                  │
         ▼      ┌────▼────┐    ┌──────────▼─────┐
    ┌────────┐  │          │    │                │
    │HEAD_APP │  │          │    ▼                │
    │ROVED    │  │          │  ┌─────────┐       │
    └────┬────┘  │          │  │ SIGNED  │◄──────┘
         │       │          │  │         │
         │   ┌───▼──────────┘  └────┬────┘
         │   │ (Can re-enter)       │
         └───┤ legal review         ▼
             │ (for revisions)   ┌──────────┐
             │                   │ ACTIVE   │
             └──────────────────▶│          │
                                 └────┬─────┘
                    ┌────────────────┬┴──────────────┐
                    │                │               │
                    ▼                ▼               ▼
              ┌──────────┐     ┌─────────┐     ┌──────────┐
              │ EXPIRING │     │ EXPIRED │     │TERMINATED│
              │(auto-    │     │(auto)   │     │(Legal ok)│
              │ flag at  │     │         │     │          │
              │ threshold)     │         │     │          │
              └──────────┘     └─────────┘     └──────────┘

Terminal States (No Exit):
• SIGNED → ACTIVE (then managed via expiry/termination)
• EXPIRED
• TERMINATED
```

---

## 📐 Contract Structure: Part A + Part B Model

```
                    ┌─────────────────────────────────────┐
                    │ COMPLETE CONTRACT (Rendered Output) │
                    └─────────────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │ PART A (Fixed Body)  │        │ PART B (Annexures)   │
        │ (LOCKED)             │        │ (EDITABLE by BU)     │
        │                      │        │                      │
        │ • Legal clauses      │        │ • Counterparty name  │
        │ • Terms & conditions │  →→→   │ • Commercial terms   │
        │ • Governing law      │ PAGE   │ • Payment terms      │
        │ • Dispute resolution │ BREAK  │ • Dates              │
        │ • Standard sections  │        │ • Deliverables       │
        │ • Company boilerplate│        │ • Timelines          │
        │ • Cannot be edited   │        │ • Multiple annexures │
        │   by Business User   │        │ • Rendered as        │
        │                      │        │   continuous section │
        │ Lock icon shown:     │        │                      │
        │ "You cannot edit"    │        │ Free-text editing    │
        │                      │        │ Word-style interface │
        │                      │        │ (first draft only on │
        │                      │        │ platform)            │
        │                      │        │                      │
        └──────────────────────┘        └──────────────────────┘

RENDERING RULES:
┌──────────────────────────────────────────────────────────┐
│ • Entire document: Justified format (full-width text)   │
│ • Page break between Part A & B                         │
│ • Print-ready document (legal standard)                 │
│ • Shown to all roles during review/preview              │
│ • Download as single Word document (.docx)              │
│                                                          │
└──────────────────────────────────────────────────────────┘

BUSINESS USER EDITING:
┌──────────────────────────────────────────────────────────┐
│ First Draft (On Platform):                              │
│ • Edit Part B only (annexures)                          │
│ • Word-editor interface: free text, blanks, rows/cols   │
│ • Cannot touch Part A (hard rule)                       │
│                                                          │
│ After First Draft (Download → Offline → Upload):        │
│ • Download entire document (.docx)                      │
│ • Edit offline (local system)                           │
│ • Can edit Part B, but NOT Part A                       │
│ • Upload revised version                                │
│                                                          │
└──────────────────────────────────────────────────────────┘

LEGAL TEAM EDITING:
┌──────────────────────────────────────────────────────────┐
│ • Can edit BOTH Part A & Part B                         │
│ • Platform editing allowed at ANY time                  │
│ • Not restricted to offline workflow                    │
│ • Version snapshot preserved after each edit            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Technology Stack Spider

```
                         ┌──────────────────┐
                         │ FRONTEND LAYER   │
                         │                  │
                         │ Next.js 15       │
                         │ React 19         │
                         │ App Router       │
                         │                  │
                         │ UI Framework:    │
                         │ Tailwind CSS 4   │
                         │ Stitch Design    │
                         │ System v2.4.0    │
                         │                  │
                         │ State Management │
                         │ React Context:   │
                         │ • Auth context   │
                         │ • Toast context  │
                         │                  │
                         │ TanStack Query   │
                         │ v5 (data sync)   │
                         │                  │
                         │ Forms:           │
                         │ React Hook Form  │
                         │ Zod validation   │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            ┌──────────┐   ┌────────────┐  ┌────────────┐
            │ EDITOR   │   │ STORAGE    │  │ AUTH       │
            │          │   │            │  │            │
            │ TipTap   │   │ S3         │  │ JWT in     │
            │ (RichText│   │ (presigned │  │ HttpOnly   │
            │ Editor)  │   │ URLs for   │  │ cookies    │
            │          │   │ uploads/   │  │            │
            │ ProseMirror-  downloads)   │ │ CSRF       │
            │ based)   │   │            │  │ protection │
            └──────────┘   └────────────┘  │            │
                                           │ Azure AD   │
                                           │ SSO        │
                                           └──────┬─────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                                    ▼             ▼             ▼
                         ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐
                         │ BACKEND LAYER    │ │ DATABASE LAYER   │ │ CACHE LAYER  │
                         │                  │ │                  │ │              │
                         │ NestJS 11        │ │ PostgreSQL       │ │ Redis        │
                         │ (REST API)       │ │ (Relational DB)  │ │ (Session/    │
                         │                  │ │                  │ │ cache store) │
                         │ Prisma ORM       │ │ Schema:          │ │              │
                         │ (type-safe)      │ │ • Users          │ │              │
                         │                  │ │ • Organizations  │ │              │
                         │ Controllers      │ │ • Contracts      │ │              │
                         │ Services         │ │ • ContractVers.  │ │              │
                         │ Middleware       │ │ • Templates      │ │              │
                         │ Guards (RBAC)    │ │ • Approvals      │ │              │
                         │ Interceptors     │ │ • Users (roles)  │ │              │
                         │ Exception handle │ │ • AuditLog       │ │              │
                         │                  │ │ • Permissions    │ │              │
                         │ 45+ Endpoints    │ │                  │ │              │
                         │ (see API ref)    │ │                  │ │              │
                         └────────┬─────────┘ └──────────────────┘ └──────────────┘
                                  │
                    ┌─────────────┼─────────────┬──────────────────┐
                    │             │             │                  │
                    ▼             ▼             ▼                  ▼
            ┌──────────┐   ┌────────────┐  ┌──────────┐   ┌──────────────┐
            │ AI LAYER │   │ EMAIL      │  │ FILES    │   │ DEPLOYMENT   │
            │          │   │ SERVICE    │  │          │   │              │
            │ LLM API  │   │            │  │ Diff lib │   │ Turborepo    │
            │ (insight-│   │ SMTP (V1)  │  │ .html-   │   │ (monorepo)   │
            │ only)    │   │            │  │ diff     │   │              │
            │          │   │ Email      │  │ Diff-    │   │ CI/CD        │
            │ LangFuse │   │ templates  │  │ match-   │   │ (TBD)        │
            │ (traces) │   │ (future)   │  │ patch    │   │              │
            │          │   │            │  │          │   │ Workspace    │
            │          │   │ Brand      │  │ OCR      │   │ config       │
            │          │   │ templates  │  │ (Google  │   │              │
            │          │   │ (future)   │  │ Vision   │   │              │
            │          │   │            │  │ or       │   │              │
            │          │   │            │  │ Tesseract│   │              │
            │          │   │            │  │ for V2)  │   │              │
            └──────────┘   └────────────┘  └──────────┘   └──────────────┘
```

---

## ⚠️ Critical Design Decisions (Locked)

| # | Decision | Impact | Status |
|---|----------|--------|--------|
| 1 | Template versioning: Existing contracts keep original, new use updated | Prevents retroactive changes to signed contracts | ✅ LOCKED |
| 2 | Business user CAN edit Part B during first draft only (on platform) | After draft: download/upload workflow enforced | ✅ LOCKED |
| 3 | Part A always locked for business users | Legal team maintains control of boilerplate | ✅ LOCKED |
| 4 | Finance track is parallel, non-blocking | Legal/counterparty/signing can proceed without finance approval | ✅ LOCKED |
| 5 | No "Reject" button — rejection = "send back with notes" → REVISION_REQUESTED | Always gives business user revision chance | ✅ LOCKED |
| 6 | Minimum 10 characters for approval remarks | Prevents empty/meaningless approvals ("ok") | ✅ LOCKED |
| 7 | Send to Legal takes precedence over counterparty status | Contract status hierarchy when multiple tracks active | ✅ LOCKED |
| 8 | Expiry tiering: Critical 30d, Warning 60d, Informational 90d | Dashboard alert urgency levels | ✅ LOCKED |
| 9 | V1 admin = form UI only; invite email + setup link parked for future | Simplified V1 launch scope | ✅ LOCKED |
| 10 | INR only for V1; multi-currency future | Single currency simplifies initial build | ✅ LOCKED |
| 11 | LLM insight-only — never creates/edits content | Maintains legal compliance, prevents AI-generated terms | ✅ LOCKED |
| 12 | Counterparties interact via email only, not in CLM | External parties don't need system access | ✅ LOCKED |
| 13 | Word-level HTML diff for V1; clause-level semantic diff for V2 | Simple MVP diff, advanced future | ✅ LOCKED |

---

## 📊 V1 Must-Ship Feature Checklist

- [x] **Authentication** — Email/password, SSO, invite-only, account lockout
- [x] **Multi-Org** — Workspace-style switching, full data silos
- [x] **Template-Based Creation** — Search → recommendations → Part A preview → Part B edit → save
- [x] **Upload-Based Creation** — Upload document → metadata form → draft
- [x] **Post-Draft Actions** — Send to legal, send to counterparty (email), request finance
- [x] **Legal Review & Approval** — Queue, review screen, approve/send back, escalate
- [x] **Finance Review** — Parallel track, approve/send back with amount capture
- [x] **Revision Flow** — Send back → download → edit offline → upload → diff → resubmit
- [x] **Counterparty Email** — Send agreement, subject/body/CC
- [x] **Version Management** — History, snapshots, diffs
- [x] **Signed Version Upload** — Mark (counterparty/company/fully executed)
- [x] **Contract List/Detail** — Search, filter, tabs (status, history, diffs, actions)
- [x] **Oracle Chat** — Per-contract Q&A (risks, terms, clauses)
- [x] **Cross-Contract Search** — Natural language across accessible contracts
- [x] **Template Management** — CRUD by legal only, org access toggles
- [x] **Dashboard (Simple)** — Role-specific, actionables, expiring, status counts
- [x] **User Management** — Invite, edit roles/orgs, activate/deactivate
- [x] **Admin** — Users, org, roles, permissions, audit log, feature flags
- [x] **RBAC** — 6 roles, 45+ permissions, org-scoped
- [x] **Status Model** — Full lifecycle + parallel finance track
- [x] **Termination (Simple)** — Legal-only marking

---

## 📈 Future Roadmap (Post-V1)

| Feature | Trigger | Priority |
|---------|---------|----------|
| In-App + Email Notifications | Post-V1 enhancement | Medium |
| Advanced Analytics | After dashboard proves useful | Low |
| AI Change Summarization | After diff view validated | Medium |
| Diff Threshold Alerting | After diff strategy validated | Medium |
| OCR for Scanned Docs | Research phase (Google Vision vs Tesseract) | High |
| Advanced Termination Flows | When offline process formalized | Medium |
| Contract Renewal | After active management stable | Medium |
| Notification Channels | Slack, Teams (user demand) | Low |
| Template Versioning Tracking | When management matures | Low |
| Saved Searches | After text search validated | Low |
| Branded Email Templates | Post-V1 email enhancement | Medium |
| Bulk Operations | When contract volume justifies | Low |
| Reporting/Export | After analytics validated | Medium |
| WebSocket Real-Time Updates | Performance optimization | Low |
| Multi-Language Support | Based on expansion | Low |
| Digital Signature Integration | When signing volume justifies | High |

---

## 🎯 Investigation Checklist

Use this to validate PRD implementation:

- [ ] **Role Hierarchy**: Verify SUPER_ADMIN → ENTITY_ADMIN → Legal/Finance/Business
- [ ] **Multi-Org Isolation**: Test data silos (no cross-org visibility)
- [ ] **Auth Flow**: Email/password + SSO both functional
- [ ] **Template Search**: Natural language matching works
- [ ] **Part A Lock**: Business user cannot edit Part A (hard block)
- [ ] **Part B Edit**: First draft on platform, then download/upload only
- [ ] **Parallel Finance**: Finance track does NOT block legal/counterparty
- [ ] **Send Back Revision**: Rejection always = REVISION_REQUESTED (no "reject" button)
- [ ] **Counterparty Email**: Replies route to business user
- [ ] **Diff Detection**: Significant changes flagged for re-review
- [ ] **Oracle Insight-Only**: LLM never creates/edits contract content
- [ ] **Legal Head Escalation**: Bypasses Legal Manager approval when flagged
- [ ] **Expiry Tiering**: Alerts at 30d (critical), 60d (warning), 90d (info)
- [ ] **Termination Authority**: Only Legal Head + Admin can terminate
- [ ] **Audit Logging**: All actions logged with timestamp/user
- [ ] **RBAC Enforcement**: Permissions correctly gate all actions
- [ ] **Dashboard Urgency**: Actionables at top, role-appropriate content
- [ ] **Feature Flags**: Org-level toggles work (e.g., AI_CONTRACT_REVIEW)

---

**End of PRD Spider Visualizer**

**Next Steps for Development:**
1. Cross-reference against `01-api-contracts.md` for endpoint implementations
2. Verify Prisma schema aligns with status model (Section 5)
3. Test all 13 user flows (Section 4)
4. Validate permission matrix (Appendix A) against code guards
5. Confirm design system alignment (`09-design-guide.md`)
