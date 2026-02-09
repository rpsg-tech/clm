# CLM Stitch Design Brief
## Complete UI/UX Specification for Screen Generation

**Version:** 1.0  
**Last Updated:** February 2026  
**Purpose:** Comprehensive instructions for Stitch to generate all CLM application screens from scratch

---

## Executive Summary

The Contract Lifecycle Management (CLM) tool is an enterprise application for managing contracts across their entire lifecycle—from creation through approval to execution. The tool serves Legal, Finance, and Business users across multiple RPSG Group companies with a shared email domain.

### Design Philosophy
- **Stark Professionalism**: Clean, minimal interfaces prioritizing content over chrome
- **Accessible Density**: Dense information display without sacrificing readability
- **Contextual AI**: AI features are visually distinct (violet spectrum) but non-intrusive
- **Progressive Disclosure**: Essential info first, details on demand
- **Dual-Pane Pattern**: Consistent layout pattern across flows (Navigation/Queue + Workspace)

---

## Part 1: User Roles & Personas

| Role | Primary Tasks | Access Level |
|------|---------------|--------------|
| **Business User** | Create contracts, upload versions, send for review, mark executed | Own contracts only |
| **Legal Manager** | Review/edit contracts, approve/reject, manage templates | All organization contracts |
| **Legal Head** | Super admin + user/org management | Full system access |
| **Finance Manager** | Financial review, approve/reject (read-only view) | Contracts sent for finance review |
| **System Admin** | User management, system configuration | Administrative access |

---

## Part 2: Core Flows & Screen Specifications

### Flow 1: Agreement Creation (Template-Based)

**User Journey:** Select template → Fill details → Create draft → Navigate to editor

#### Screen 1.1: Template Selection Grid
**Page:** `/dashboard/contracts/create`  
**Layout:** Full-page grid view

**Elements:**
- **Header:** Page title "Create New Agreement" + Back navigation
- **Filter Bar:** Category filters as pill buttons (All, Sales, NDA, Partnership, etc.)
- **Search:** Search input with icon
- **Template Grid:** 3-column responsive grid of Template Cards

**Template Card Pattern:**
- Color bar top (category-specific: Indigo=Sales, Violet=NDA, Green=Partnership)
- Icon in rounded container (top-left)
- Active/Inactive badge (top-right)
- Title (bold, primary text)
- Description (2-line clamp, secondary text)
- Category tag (bottom-left)
- "Select →" CTA (bottom-right, appears on hover)
- Hover: shadow-lg, border-indigo-300

#### Screen 1.2: Contract Details Modal
**Type:** Modal overlay  
**Layout:** Centered modal (max-w-md)

**Elements:**
- **Header:** "Create from [Template Name]"
- **Form Fields:**
  - Contract Title (required)
  - Counterparty Name (required)
  - Counterparty Email
  - Counterparty Address (textarea)
  - Expiry Date (date picker)
  - Description (textarea)
- **Footer:** Cancel (ghost) + Create Contract (primary)

---

### Flow 2: Agreement Upload (Third-Party Paper)

**User Journey:** Upload file → AI processing → Review metadata → Create contract

#### Screen 2.1: Upload Entry (via Dashboard)
**Location:** Within `/dashboard` or `/dashboard/contracts/create`  
**Pattern:** "Import Third-Party Paper" tile in Contract Launchpad

**Launchpad Tile:**
- Dashed border pattern (implying drop zone)
- Upload cloud icon
- "Import External Contract" label
- Drag & drop supported
- Click to open file picker

#### Screen 2.2: Processing Overlay ("The Airlock")
**Type:** Full-screen overlay during processing  
**Duration:** 2-5 seconds (while AI analyzes)

**Elements:**
- Centered loading container
- AI Assistant icon (pulsing animation)
- Progress text: "AI Scanning...", "Extracting Metadata...", "Reading Dates..."
- Violet color scheme (AI indication)

#### Screen 2.3: Upload Workspace (Split View)
**Page:** `/dashboard/contracts/new`  
**Layout:** DualPaneLayout

| Left Pane (Document Preview) | Right Pane (Metadata Form) |
|------------------------------|---------------------------|
| PDF/Document viewer (iframe) | Auto-filled form fields |
| Zoom/scroll controls | Title, Counterparty, Dates |
| "Original File" badge | AI confidence indicators |
| Page navigation (if multi-page) | Edit any auto-filled values |

**Header:** Back navigation + "Create Contract" primary button  
**Footer Actions:** "Re-upload" secondary + "Create Contract" primary

---

### Flow 3: Contract Editing Workspace ("The Cockpit")

**User Journey:** View contract → Edit content (if permitted) → Save version

#### Screen 3.1: Contract Editor
**Page:** `/dashboard/contracts/[id]/edit`  
**Layout:** Three-column workspace

| Left (Navigation) | Center (Editor) | Right (AI Assistant) |
|-------------------|-----------------|----------------------|
| Section navigation | TipTap rich editor | AI Clause Assistant |
| Document outline | Toolbar | Query input |
| Annexure tabs | Content area | Suggested clauses |

**Role-Based Behavior:**

**Legal User (Architect Mode):**
- Full write access to Main Agreement + Annexures
- AI Copilot panel visible by default
- Track changes indicators (highlights)
- All toolbar options enabled

**Business User (Keeper Mode):**
- Read-only document view
- "Upload New Version" button in toolbar
- Version history visible
- AI Assistant for queries only

**Toolbar Elements:**
- Back navigation
- Save status indicator
- View mode toggle (Edit/Preview)
- Document actions (Download, Print)
- "Upload Version" button (Business users)

---

### Flow 4: Version Management ("The Time Machine")

**User Journey:** View version history → Select version → See AI analysis → Compare/Restore

#### Screen 4.1: Version History
**Page:** `/dashboard/contracts/[id]/versions`  
**Layout:** DualPaneLayout

| Left Pane (Timeline) | Right Pane (Intelligence) |
|----------------------|---------------------------|
| Vertical timeline with versions | Version details panel |
| Grouped by date | AI-generated summaries |
| Who + When + Comment | Change impact analysis |
| Diff count badges (+/-) | Actions: Compare, Restore, Download |

**Timeline Item Structure:**
- Timeline connector line (left edge)
- Version dot (indigo for current, slate for past)
- Version badge (v1.0, v1.1, etc.)
- "Current" label for active version
- Author name + avatar
- Timestamp
- Comment/reason
- Diff indicators: +12 (green), -4 (red)

**Intelligence Panel Tabs:**
- **Summary:** Executive summary + Change impact bullets
- **Preview:** Read-only document render
- **Actions:** Compare with Current, Restore, Download

---

### Flow 5: Legal Review ("The Workbench")

**User Journey:** View queue → Review contract → Approve/Reject/Request revision

#### Screen 5.1: Legal Approval Queue
**Page:** `/dashboard/approvals/legal`  
**Layout:** DualPaneLayout (Inbox pattern)

| Left Pane (Queue) | Right Pane (Workbench) |
|-------------------|------------------------|
| Pending items list | Multi-mode editor |
| Priority badges | Tabs: Review, Changes, Context |
| SLA "Time Left" | Persistent action bar |
| Requestor info | Contract workspace |

**Queue Item Structure:**
- Contract title (bold)
- Counterparty name
- Requestor avatar + name
- Time badge ("2h left", "Due today")
- Priority indicator (if applicable)
- Selected state: indigo highlight

**Workbench Tabs:**
1. **Review (Editor):** Read-only by default, toggle to Edit mode for redlining
2. **Changes (Diff):** Version diff comparison
3. **Context (Audit):** Instructions, comments, approval logs

**Action Bar (persistent footer):**
- Reject (destructive, left)
- Request Changes (secondary, opens comment dialog)
- Approve (primary, right)

---

### Flow 6: Finance Review ("The Auditor")

**User Journey:** View queue → Review (read-only) → Approve/Reject

#### Screen 6.1: Finance Approval Queue
**Page:** `/dashboard/approvals/finance`  
**Layout:** DualPaneLayout (same as Legal, different constraints)

**Key Differences from Legal:**
- **Strictly Read-Only:** Editor never allows input
- **Focus:** Financial terms, payment conditions
- **Queue Emphasis:** Contract value, deadlines

**Workbench Tabs:**
1. **Review:** Strict read-only view (no edit toggle)
2. **Changes:** Diff view for payment term changes
3. **Context:** Paper trail for audit compliance

**Action Bar:**
- Request Revision (ghost)
- Approve with Note (secondary)
- Approve (primary, emerald accent for Finance)

---

### Flow 7: AI Analysis & Chat

**User Journey:** Ask questions → Receive factual analysis

#### Screen 7.1: Contract Analysis View
**Page:** `/dashboard/contracts/[id]/analysis`  
**Layout:** Full-page or slide-over panel

**Elements:**
- Chat interface (messages + input)
- AI-generated responses in violet containers
- Cited sections with links
- Suggested questions

**AI Panel (Sidebar Version):**
- Collapsible sidebar
- Query input at bottom
- Conversation history
- "Ask about..." suggestions

**Constraints:**
- Read-only analysis only
- Never suggests edits
- Clear "AI Generated" labels
- Factual questions only

---

### Flow 8: Template Management

**User Journey:** Create/edit templates → Set placeholders → Manage library

#### Screen 8.1: Template Library
**Page:** `/dashboard/templates`  
**Layout:** Grid + filters

**Elements:**
- Template cards (same pattern as Flow 1)
- Active/Inactive filter
- Category filter
- "Create Template" button

#### Screen 8.2: Template Editor
**Page:** `/dashboard/templates/[id]/edit`  
**Layout:** Similar to Contract Editor

**Unique Elements:**
- Placeholder syntax highlighting: `{{field_name}}`
- Placeholder list sidebar
- Preview mode (shows filled sample)

---

### Flow 9: Dashboard & Task Management

**User Journey:** View pending tasks → Filter contracts → Quick navigation

#### Screen 9.1: Main Dashboard
**Page:** `/dashboard`  
**Layout:** Hero + Cards grid

**Elements by Role:**

**Business User:**
- "My Tasks" card (contracts with Revision Requested)
- "My Contracts" quick list
- "Create Contract" launchpad
- Expiring contracts alert

**Legal User:**
- Approval queue summary
- Recent reviews
- Template management link
- Analytics cards (Phase 2)

**Finance User:**
- Finance queue summary
- Pending review count
- Recent approvals

**Universal Elements:**
- Welcome message with name
- Notification bell
- Organization switcher (if multi-org)
- Quick search

#### Screen 9.2: Contract List
**Page:** `/dashboard/contracts`  
**Layout:** Table with filters

**Table Columns:**
- Status badge
- Contract title + counterparty
- Created date
- Expiry date
- Owner
- Actions menu

**Filters:**
- Status pill filter (All, Draft, Under Review, etc.)
- Date range picker
- Search input
- Template type dropdown

---

### Flow 10: Admin & User Management

**User Journey:** Manage users → Assign roles → Configure organizations

#### Screen 10.1: User Management
**Page:** `/dashboard/users`  
**Layout:** Table

**Columns:** Avatar + Name, Email, Role, Organization(s), Status, Actions

#### Screen 10.2: Role Management
**Page:** `/dashboard/roles`  
**Layout:** Cards or table

**Elements:**
- Role name
- Permission count badge
- Edit/Delete actions

---

### Flow 11: Authentication & Onboarding

**User Journey:** Login → Select organization → Access dashboard

#### Screen 11.1: Login Page
**Page:** `/login`  
**Layout:** Centered card on gradient background

**Elements:**
- Logo (centered)
- "Sign in to CLM" heading
- SSO button (Microsoft/Outlook) - primary
- Divider "or"
- Email + Password form
- "Forgot password" link
- Footer: Privacy policy, Terms

#### Screen 11.2: Organization Selection
**Page:** `/select-org`  
**Layout:** Centered card

**Elements:**
- "Select Organization" heading
- Organization cards/list (if user has multiple)
- Continue button

---

## Part 3: Design System Reference

### Color Palette

| Purpose | Color | Hex |
|---------|-------|-----|
| **Primary** | Indigo 700 | `#4338CA` |
| **Primary Hover** | Indigo 800 | `#3730A3` |
| **AI Accent** | Violet 700 | `#6D28D9` |
| **Destructive** | Rose 600 | `#E11D48` |
| **Success** | Green 600 | `#16A34A` |
| **Warning** | Yellow 600 | `#CA8A04` |
| **Text Primary** | Slate 900 | `#0F172A` |
| **Text Secondary** | Slate 600 | `#475569` |
| **Border** | Slate 300 | `#CBD5E1` |
| **Background** | Slate 50 | `#F8FAFC` |

### Typography

| Usage | Size | Weight |
|-------|------|--------|
| Page Titles | 36px | Semibold |
| Section Headers | 24px | Medium |
| Card Titles | 20px | Semibold |
| Body | 16px | Regular |
| Labels | 14px | Medium |
| Captions | 12px | Medium |

**Fonts:** Inter (UI), Merriweather (Documents)

### Component Patterns

**Primary Button:**
```
bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-5 rounded-md shadow-sm
```

**Secondary Button:**
```
bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2.5 px-5 rounded-md
```

**Card:**
```
rounded-xl border border-slate-200 bg-white shadow-sm
```

**Status Badges:**
- Active: green-50 bg, green-700 text
- Draft: slate-50 bg, slate-600 text
- Under Review: yellow-50 bg, yellow-800 text
- Blocked: red-50 bg, red-700 text

### Icons

**System:** Material Symbols Outlined

| Action | Icon |
|--------|------|
| Dashboard | `dashboard` |
| Contracts | `description` |
| Templates | `folder_copy` |
| Create | `add_circle` |
| AI Features | `auto_awesome` |
| Edit | `edit` |
| Delete | `delete` |
| Approve | `check_circle` |
| Legal | `gavel` |
| Handshake | `handshake` |

---

## Part 4: Layout Patterns

### Standard Page
```
┌─────────────────────────────────────────────────┐
│ Header (h-16, sticky)                           │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │                                      │
│ (w-64)   │          Main Content                │
│          │          (flex-1, p-6)               │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

### DualPaneLayout (Used in Flows 2-6)
```
┌─────────────────────────────────────────────────┐
│ Header with actions                             │
├───────────────┬─────────────────────────────────┤
│               │                                 │
│  Left Pane    │         Right Pane              │
│  (w-80)       │         (flex-1)                │
│  Navigation/  │         Workspace/              │
│  Queue/       │         Editor/                 │
│  Timeline     │         Intelligence            │
│               │                                 │
└───────────────┴─────────────────────────────────┘
```

### Wizard Flow
```
┌─────────────────────────────────────────────────┐
│ Header                                          │
├─────────────────────────────────────────────────┤
│   ← Back to Dashboard                           │
│   Page Title + Description                      │
│   ┌───────────────────────────────────────────┐ │
│   │         Stepper (centered)                │ │
│   └───────────────────────────────────────────┘ │
│   ┌───────────────────────────────────────────┐ │
│   │         Form Content (max-w-2xl)          │ │
│   └───────────────────────────────────────────┘ │
│   ┌──────────────────┬────────────────────────┐ │
│   │ ← Back           │       Next: Step →    │ │
│   └──────────────────┴────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Part 5: Page Summary

| # | Flow | Page Count | Key Pages |
|---|------|------------|-----------|
| 1 | Agreement Creation | 1 | `/contracts/create` |
| 2 | Upload Flow | 1 | `/contracts/new` |
| 3 | Contract Editing | 2 | `[id]/edit`, `[id]/page` |
| 4 | Version Management | 2 | `[id]/versions`, `[id]/compare` |
| 5 | Legal Review | 1 | `/approvals/legal` |
| 6 | Finance Review | 1 | `/approvals/finance` |
| 7 | AI Analysis | 1 | `[id]/analysis` |
| 8 | Templates | 3 | `/templates`, `/create`, `/edit` |
| 9 | Dashboard | 2 | `/dashboard`, `/contracts` |
| 10 | Admin | 8 | `/users`, `/roles`, `/settings`, etc. |
| 11 | Auth | 3 | `/login`, `/select-org`, landing |
| **Total** | | **25+** | |

---

## Appendix: Generation Notes for Stitch

1. **Consistency:** All flows share the same header, sidebar, and spacing patterns
2. **AI Indication:** Use violet (#6D28D9) for any AI-related features
3. **Hover States:** Cards lift with shadow-lg and border-indigo-300
4. **Empty States:** Show icon + helpful message + CTA when lists are empty
5. **Loading:** Use skeleton patterns or pulsing AI indicators
6. **Mobile:** Phase 2 (desktop-first for Phase 1)
7. **Dark Mode:** Supported via `dark:` prefix

---

*This document serves as the complete specification for generating all CLM screens using Stitch or similar AI design tools.*
