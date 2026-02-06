# CLM UI/UX Flows Index

> **Purpose**: Maps functional flows/themes to their corresponding pages and components for systematic UI/UX enhancement work. Use this index to iterate flow-by-flow with design tools (Google Stitch) without breaking underlying functionality.

---

## How to Use This Index

1. **Pick a flow/theme** from the sections below
2. **Review all linked files** before making design changes
3. **Preserve API calls and data contracts** (marked with ⚡)
4. **Test the complete flow** after changes (not just individual screens)

---

## 🎨 Flow 1: Agreement Creation (Template-Based)

> **Business User Journey**: Select template → Fill details → Create draft → Navigate to editor

### Screens & Files

| Screen | Page File | Key Components |
|--------|-----------|----------------|
| **Template Selection Grid** | [create/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/create/page.tsx) | `TemplateCard`, Dialog modal |
| **Draft Initialization Modal** | Same as above | Dialog with form inputs |
| **Post-Creation Redirect** | → [edit/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/edit/page.tsx) | Split view editor |

### Supporting Components

| Component | File | Purpose |
|-----------|------|---------|
| Template Selection View | [template-selection-view.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/template-selection-view.tsx) | Reusable template picker |
| Wizard Stepper | [wizard-stepper.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/wizard-stepper.tsx) | Step indicator UI |
| Contract Launchpad | [contract-launchpad.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/contract-launchpad.tsx) | Launch/quick actions hub |

### ⚡ Critical Data Contracts (Do Not Break)

```typescript
// POST /api/contracts - Called in create/page.tsx
api.contracts.create({
  templateId, title, counterpartyName, description, annexureData, fieldData
})
```

---

## 📤 Flow 2: Agreement Creation (Upload Flow)

> **Business User Journey**: Upload file (PDF/Word/Image) → Contract created as draft

### Screens & Files

| Screen | Page File | Notes |
|--------|-----------|-------|
| **Upload Interface** | [new/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/new/page.tsx) | Alternative entry point |
| **Contract List (Upload Button)** | [contracts/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/page.tsx) | Contains upload trigger |

### Notes

- Upload flow may share components with template-based creation
- OCR processing handled by backend (frontend just uploads file)

---

## 📝 Flow 3: Contract Editing & Drafting Workspace

> **Business/Legal User Journey**: View contract → Edit content → Save version

### Screens & Files

| Screen | Page File | Key Components |
|--------|-----------|----------------|
| **Contract Detail View** | [[id]/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/page.tsx) | Overview, versions, activity |
| **Contract Editor (Split View)** | [[id]/edit/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/edit/page.tsx) | TipTap editor + preview |
| **Print/Export View** | [[id]/print/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/print/page.tsx) | Print-optimized layout |

### Supporting Components

| Component | File | Purpose |
|-----------|------|---------|
| **Drafting Workspace** | [drafting-workspace.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/drafting-workspace.tsx) | Main editing container |
| **Contract Editor View** | [contract-editor-view.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/contract-editor-view.tsx) | Editor wrapper |
| **TipTap Editor** | [tip-tap-editor.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/editor/tip-tap-editor.tsx) | Rich text editor |
| **Editor Toolbar** | [editor-toolbar.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/editor/editor-toolbar.tsx) | Formatting controls |
| **Smart Action Buttons** | [smart-action-buttons.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/smart-action-buttons.tsx) | Context-aware actions |
| **Contract Navigation Sidebar** | [contract-navigation-sidebar.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/contract-navigation-sidebar.tsx) | Section navigation |
| **Contract Stage Indicator** | [contract-stage-indicator.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/contract-stage-indicator.tsx) | Status badge/progress |
| **Annexures View** | [annexures-view.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/annexures-view.tsx) | Attachment management |

---

## 🔄 Flow 4: Version Management & Diff

> **All Users Journey**: View version history → Compare versions → See AI-generated change summary

### Screens & Files

| Screen | Page File | Key Components |
|--------|-----------|----------------|
| **Version List** | [[id]/versions/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/versions/page.tsx) | Version timeline |
| **Version Detail** | [[id]/versions/[versionId]/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/versions/[versionId]/page.tsx) | Single version view |
| **Comparison/Diff View** | [[id]/compare/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/compare/page.tsx) | Side-by-side diff |

### Supporting Components

| Component | File | Purpose |
|-----------|------|---------|
| **Contract Diff View** | [contract-diff-view.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/contract-diff-view.tsx) | Diff rendering logic |

### UI Elements to Note

- Version cards (in `[id]/page.tsx` - `VersionCard` sub-component)
- Upload new version modal
- Diff count badges
- AI change summary display

---

## ✅ Flow 5: Legal Review & Approval

> **Legal User Journey**: View queue → Review contract → Approve/Reject/Request revision

### Screens & Files

| Screen | Page File | Key Components |
|--------|-----------|----------------|
| **Legal Approval Queue** | [approvals/legal/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/approvals/legal/page.tsx) | Inbox-style queue |
| **Contract Detail (with Actions)** | [[id]/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/page.tsx) | Review actions context |
| **Contract Editor (for Legal Edits)** | [[id]/edit/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/edit/page.tsx) | Inline editing |

### Supporting Components

| Component | File | Purpose |
|-----------|------|---------|
| **Final Review View** | [final-review-view.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/final-review-view.tsx) | Pre-approval summary |
| **Smart Action Buttons** | [smart-action-buttons.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/smart-action-buttons.tsx) | Approve/Reject/Request Revision |
| **Stage Filter** | [stage-filter.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/stage-filter.tsx) | Filter by status |

---

## 💰 Flow 6: Finance Review

> **Finance User Journey**: View finance queue → Review contract → Approve/Request revision

### Screens & Files

| Screen | Page File | Notes |
|--------|-----------|-------|
| **Finance Approval Queue** | [approvals/finance/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/approvals/finance/page.tsx) | Similar pattern to legal |
| **Contract Detail** | [[id]/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/page.tsx) | Shared detail view |

---

## 🤖 Flow 7: AI Analysis & Chat

> **All Users Journey**: Ask questions about contract content → Receive factual analysis

### Screens & Files

| Screen | Page File | Key Components |
|--------|-----------|----------------|
| **Contract Analysis Page** | [[id]/analysis/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/analysis/page.tsx) | Dedicated AI view |
| **Contract Detail (Sidebar Chat)** | [[id]/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/[id]/page.tsx) | Integrated AI panel |

### Supporting Components

| Component | File | Purpose |
|-----------|------|---------|
| **AI Assistant View** | [ai-assistant-view.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/ai-assistant-view.tsx) | Chat interface |
| **AI Clause Assistant** | [ai-clause-assistant.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/ai-clause-assistant.tsx) | Clause-specific AI help |
| **Oracle Assistant** | [oracle-assistant.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/oracle-assistant.tsx) | Dashboard-level AI query |
| **Contract Assistant Sidebar** | [contract-assistant-sidebar.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/contract-assistant-sidebar.tsx) | Floating sidebar |

---

## 📑 Flow 8: Template Management

> **Legal Manager Journey**: Create/edit templates → Set placeholders → Manage library

### Screens & Files

| Screen | Page File | Notes |
|--------|-----------|-------|
| **Template List** | [templates/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/templates/page.tsx) | Template library |
| **Create Template** | [templates/create/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/templates/create/page.tsx) | New template form |
| **Edit Template** | [templates/[id]/edit/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/templates/[id]/edit/page.tsx) | Template editor |

### Notes

- Placeholder syntax: `{{field_name}}`
- Template uses similar editor components as contract editing

---

## 📊 Flow 9: Dashboard & Task Management

> **All Users Journey**: View pending tasks → Filter contracts → Quick navigation

### Screens & Files

| Screen | Page File | Key Components |
|--------|-----------|----------------|
| **Main Dashboard** | [dashboard/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/page.tsx) | Role-based cards/tasks |
| **Contract List** | [contracts/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/contracts/page.tsx) | Filterable table |

### Supporting Components

| Component | File | Purpose |
|-----------|------|---------|
| **Dashboard Header** | [dashboard-header.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/dashboard-header.tsx) | Top nav bar |
| **Dashboard Sidebar** | [dashboard-sidebar.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/dashboard-sidebar.tsx) | Navigation menu |
| **Notification Bell** | [notification-bell.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/notification-bell.tsx) | Alerts dropdown |
| **Mobile Header** | [mobile-header.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/mobile-header.tsx) | Responsive header |
| **Stage Filter** | [stage-filter.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/components/stage-filter.tsx) | Status filter tabs |

---

## ⚙️ Flow 10: Admin & User Management

> **Admin Journey**: Manage users → Assign roles → Configure organizations

### Screens & Files

| Screen | Page File | Notes |
|--------|-----------|-------|
| **User Management** | [users/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/users/page.tsx) | User list/CRUD |
| **Role Management** | [roles/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/roles/page.tsx) | Role definitions |
| **Role Detail/Edit** | [roles/[id]/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/roles/[id]/page.tsx) | Permission assignment |
| **Permissions** | [permissions/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/permissions/page.tsx) | Permission matrix |
| **Organizations** | [organizations/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/organizations/page.tsx) | Multi-org management |
| **Settings** | [settings/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/settings/page.tsx) | System config |
| **Audit Log** | [audit/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/audit/page.tsx) | Activity history |
| **Admin Modules** | [admin/modules/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/dashboard/admin/modules/page.tsx) | Feature toggles |

---

## 🔐 Flow 11: Authentication & Onboarding

> **New User Journey**: Login → Select organization → Access dashboard

### Screens & Files

| Screen | Page File | Notes |
|--------|-----------|-------|
| **Landing/Login** | [page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/page.tsx) | Entry point |
| **Login Page** | [login/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/login/page.tsx) | SSO/credentials |
| **Org Selection** | [select-org/page.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/select-org/page.tsx) | Multi-org chooser |

### Supporting Files

| File | Purpose |
|------|---------|
| [middleware.ts](file:///Users/corphr.software/Documents/clm/apps/user-app/middleware.ts) | Auth routing logic |
| [layout.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/layout.tsx) | Root layout/providers |
| [providers.tsx](file:///Users/corphr.software/Documents/clm/apps/user-app/app/providers.tsx) | Context providers |

---

## 📁 Shared Resources

### UI Component Library

| Category | Directory |
|----------|-----------|
| Base UI Components | [components/ui/](file:///Users/corphr.software/Documents/clm/apps/user-app/components/ui/) |
| Shared Package UI | [packages/ui/](file:///Users/corphr.software/Documents/clm/packages/) |

### Global Styles

| File | Purpose |
|------|---------|
| [globals.css](file:///Users/corphr.software/Documents/clm/apps/user-app/app/globals.css) | Tailwind + custom styles |

### API Client

| File | Purpose |
|------|---------|
| [lib/](file:///Users/corphr.software/Documents/clm/apps/user-app/lib/) | API client, utilities |

---

## 🎯 Quick Reference: Page Count by Area

| Area | Page Count |
|------|------------|
| Contracts (CRUD + Views) | 11 pages |
| Templates | 3 pages |
| Approvals | 2 pages |
| Admin/Settings | 8 pages |
| Auth/Onboarding | 3 pages |
| **Total** | **27+ pages** |

---

## ⚠️ Design Enhancement Guidelines

1. **Preserve all `api.*` calls** - these connect to backend
2. **Keep component props unchanged** - maintain data flow
3. **Test complete flows** - not just individual screens
4. **Check responsive behavior** - especially mobile header/sidebar
5. **Maintain accessibility** - icons need labels, keyboard nav

---

*Last Updated: 2026-02-06*
