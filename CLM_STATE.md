# CLM Frontend Rebuild — Stitch Rework State

**Last Updated:** 2026-02-09 (Phase 13 complete)
**Status:** Phase 13 COMPLETE — AI Visualization Cleanup shipped and verified
**Branch:** `feat/frontend-rebuild`
**Plan:** `/Users/corphr.software/.claude/plans/rustling-herding-yeti.md`

---

## Phase Completion Status

| Phase | Description | Status | Agent IDs |
|-------|-------------|--------|-----------|
| Phase 0 | Shell Foundation (Sidebar, Header, AppShell) | COMPLETE | ae0d4f6, a7e8121, aab61b0 |
| Phase 1 | Auth & Onboarding (Login, Password Recovery, Org Selector) | COMPLETE | aa4398d, a825d54, a07e418 |
| Phase 2 | Dashboards (Business, Finance, Legal Manager, Legal Head, Super Admin) | COMPLETE | ac677e0, aba2323, ab24800 |
| Phase 3 | Contract List & Detail (Filters, Table, Detail Page, Tabs) | COMPLETE | ad07500, ad96f43 |
| Phase 4 | Editor & Preview (Workspace, Nav Sidebar, AI Panel, Full Preview) | COMPLETE | abc9559, a433f17 |
| Phase 5 | Templates (Selection, Cards, Library, Create Template Modal) | COMPLETE | a54c6a6, aee7593 |
| Phase 6 | Version & Upload Workflows | COMPLETE | a2c483b, a40ae50 |
| Phase 7 | Review Workbenches (Legal 3-panel, Finance 3-panel) | COMPLETE | a43c990, a66914f |
| Phase 8 | Send to Counterparty (Split modal) | COMPLETE | a04d6d6 |
| Phase 9 | Admin User & Org Management | COMPLETE | a944c3e, a3c5898 |
| Phase 10 | Admin Audit Log & Feature Flags | COMPLETE | a178dfb, aaa8aa8 |
| Phase 11 | Cleanup & Polish | **COMPLETE** | acc82f8, af07ab1, a6c939a, a314311 |
| Phase 12 | Creation Wizard Rebuild (Part A/B) | COMPLETE | codex |
| Phase 13 | AI Visualization Cleanup | **COMPLETE** | antigravity |

---

## Phase 11 — Cleanup & Polish (COMPLETE)

**Scope:** 11.1 Delete files, 11.2 Color rename, 11.3 TypeScript any, 11.4 Accessibility, 11.6 Build verify
**Excluded:** 11.5 Mobile responsiveness (user decision)

### Task 11.1 — Delete Unused Files: COMPLETE

**7 files deleted:**
- `components/dashboard/activity-timeline.tsx` (duplicate — contracts/ version is used)
- `components/dashboard/task-card.tsx` (zero imports)
- `components/dashboard/contract-row.tsx` (zero imports)
- `components/ui/stat-card.tsx` (exported but never imported)
- `components/SafeHtml.tsx` (zero imports)
- `components/ai/oracle-panel.tsx` (14KB dead code)
- `components/ai/index.ts` (barrel for deleted file)

**Also cleaned up:**
- `components/ui/index.ts` — removed `StatCard` export
- `components/ai/` directory removed entirely

### Task 11.2 — Color Standardization (slate → neutral): COMPLETE

**1,460 replacements** across all `.tsx` and `.ts` files:
- All `slate-*` Tailwind classes → `neutral-*` in `apps/user-app/`
- Badge `draft` variant in `packages/ui/src/components/badge.tsx` updated
- `globals.css` preserved (CSS aliases kept for backward compat)
- **Verification:** 0 `slate-` references remain in any `.tsx`/`.ts` file
- **Build verified:** Passes with 0 errors after rename

### Task 11.3 — Fix TypeScript `any` Casts: COMPLETE

**What's DONE (0 `any` remaining in these files):**
- `lib/api-client.ts` — All `<any>` generics replaced with proper types. Added `import type` from `@repo/types` + 20 local response interfaces (AuthSessionResponse, AIAnalysisResponse, AnalyticsSummary, OracleChatResponse, etc.)
- `lib/notifications-context.tsx` — `catch (error: any)` → `unknown`, query cache types fixed
- `lib/auth-context.tsx` — `setQueryData` callback typed
- `lib/hooks/use-dashboard.ts` — 8 `as any` casts replaced with proper interfaces
- `components/contracts/review-workbench.tsx` — `approval`, `contract`, `versions`, `auditLogs` props typed
- `components/contracts/approval-queue.tsx` — All `any` → `Approval`/`ApprovalWithContract`, interface props typed
- `components/contracts/creation-wizard.tsx` — `result as any` typed
- `components/contracts/workspace-header.tsx` — `contract: any` → `contract: Contract`
- `components/contracts/version-timeline.tsx` — `version: any` → `ContractVersion`
- `components/contracts/contract-nav-sidebar.tsx` — `contract: any`, `annexure: any` typed
- `components/contracts/version-detail-panel.tsx` — version props typed
- `components/contracts/upload-version-modal.tsx` — `contract?: any` typed
- `components/contracts/edit-workspace.tsx` — `contract: any` typed
- `components/editor/extensions/variable-extension.tsx` — `props: any` → typed node attrs
- `app/dashboard/contracts/page.tsx` — `PaginatedResponse<Contract>` cast
- `app/dashboard/contracts/create/page.tsx` — `PaginatedResponse<Template>`, `(template: Template)`

**Additional `any` removals completed in this pass:**
- `app/dashboard/admin/users/page.tsx` — typed users/roles responses and display model
- `app/dashboard/contracts/[id]/versions/page.tsx` — typed versions + contract
- `app/api/pdf/route.ts` — typed chromium runtime + stream response
- `components/dashboard/finance-dashboard.tsx` — typed approval summary
- `app/dashboard/contracts/upload/page.tsx` — typed template/contract helpers
- `app/dashboard/admin/feature-flags/page.tsx` — normalized API flags with typed UI model
- `app/dashboard/approvals/legal/page.tsx` — typed approval state
- `app/dashboard/approvals/finance/page.tsx` — typed approval state
- `app/dashboard/templates/page.tsx` — typed template rows
- `app/dashboard/contracts/[id]/page.tsx` — typed contract detail
- `app/dashboard/contracts/[id]/edit/page.tsx` — typed contract
- `app/dashboard/contracts/create/[templateId]/page.tsx` — typed template
- `components/dashboard/business-dashboard.tsx` — typed recent contracts
- `components/dashboard/legal-dashboard.tsx` — typed contract summary

### Task 11.4 — Accessibility Pass: PARTIALLY COMPLETE

**What's DONE (a11y attributes added across core flows):**

Files with `aria-label`, `aria-modal`, `role="dialog"`, or Escape key handlers:
- `components/contracts/send-counterparty-dialog.tsx` — 5 a11y attributes (dialog role, escape key, aria-labels)
- `components/contracts/create-template-modal.tsx` — 5 a11y attributes
- `components/contracts/review-workbench.tsx` — 4 a11y attributes
- `components/contracts/oracle-risk-panel.tsx` — 3 a11y attributes
- `components/contracts/approval-queue.tsx` — 2 a11y attributes (search input, filter button)
- `components/contracts/upload-version-modal.tsx` — 2 a11y attributes
- `components/contracts/upload-signed-dialog.tsx` — 2 a11y attributes
- `components/contracts/ai-assistant-panel.tsx` — 2 a11y attributes
- `components/contracts/contract-table.tsx` — 1 a11y attribute
- `components/layout/sidebar.tsx` — 1 a11y attribute
- `app/dashboard/admin/audit/page.tsx` — 1 a11y attribute
- `app/dashboard/contracts/[id]/page.tsx` — 1 a11y attribute
- `components/layout/header.tsx` — search/menu/notification labels
- `app/dashboard/admin/roles/page.tsx` — checkbox/toggle labels + table label
- `app/dashboard/admin/feature-flags/page.tsx` — switch labels + save bar live region
- `app/dashboard/admin/users/page.tsx` — table label + modal dialog attrs
- `components/auth/login-form.tsx` — SSO button label
- `components/contracts/file-drop-zone.tsx` — keyboard + aria attrs
- `app/dashboard/contracts/[id]/versions/page.tsx` — version select labels

**What REMAINS (files that likely still need a11y work):**

| File | What's needed |
|------|---------------|
| `app/login/page.tsx` | Confirm form input labels are explicit (login-form was updated) |
| `app/forgot-password/page.tsx` | Form input labels |
| `components/contracts/file-drop-zone.tsx` | Verify drag/drop semantics are sufficient (no aria-dropeffect) |

**Pattern for adding a11y:**
- Modals: `role="dialog" aria-modal="true" aria-label="Modal title"` + Escape key `useEffect`
- Icon buttons: `aria-label="Action name"`
- Search inputs: `aria-label="Search description"`
- Data tables: `aria-label="Table description"`

### Task 11.4a — A11y Remaining Items: COMPLETE (NO CHANGES NEEDED)

**Diagnosis by Opus (2026-02-07):**
- `app/login/page.tsx` — Page is just a wrapper. Actual form is in `components/auth/login-form.tsx`.
  - Login-form already uses `<label>` wrapping (implicit label) around both Email and Password inputs (lines 64-86)
  - SSO button already has `aria-label="Sign in with Microsoft"` (line 48)
  - "Remember me" checkbox has implicit label wrapping (lines 89-92)
  - **Verdict: ALREADY ACCESSIBLE — no changes needed**
- `app/forgot-password/page.tsx` — Has explicit `htmlFor="email"` label (line 89) connected to `id="email"` input (line 93). Submit button has clear visible text.
  - **Verdict: ALREADY ACCESSIBLE — no changes needed**
- `components/contracts/file-drop-zone.tsx` — Already had keyboard + aria attrs added in earlier pass
  - **Verdict: ALREADY ACCESSIBLE — no changes needed**

### Task 11.5 — Mobile Responsiveness: EXCLUDED (user decision)

### Task 11.6 — Build Verification: COMPLETE (clean build)

**Must run after all fixes:** `npx turbo run build --filter=user-app --force`
**Latest status:** `npx turbo run build --filter=user-app --force` completed successfully with no build-blocking warnings remaining.

**Additional build blockers resolved during verification:**
- `components/contracts/version-timeline.tsx` — added `note?: string | null` to `VersionWithUser`
- `components/dashboard/finance-dashboard.tsx` — safe `totalValue` handling with nullish coalescing
- `components/dashboard/legal-dashboard.tsx` — use `ContractStatus.ACTIVE` enum for badge variant
- `components/editor/extensions/variable-extension.tsx` — use `ReactNodeViewProps` + typed attrs
- `lib/auth-context.tsx` — align `User` with `@repo/types` + add optional `organizations`
- `lib/hooks/use-dashboard.ts` — `emptyPage` fallback includes full `meta`
- `lib/notifications-context.tsx` — widen `Notification.type` to `string` + add `data?`

---

## 🔧 DETAILED FIX PLAN FOR HAIKU HANDOFF (written by Opus 2026-02-07)

**Instructions:** Execute Fix A first, then Fix B, then run the build verification in Fix C. Each fix is mechanical — follow exactly as written.

---

### Fix A: VersionWithUser Type Mismatch (BUILD BLOCKER)

**Root cause:** Two files define `VersionWithUser` differently. The page allows `null` but the component doesn't accept `null`. When the page passes its `versionList` to `<VersionTimeline versions={versionList}>`, TypeScript rejects the wider null-inclusive type.

**Files involved:**
- `apps/user-app/app/dashboard/contracts/[id]/versions/page.tsx` line 29
- `apps/user-app/components/contracts/version-timeline.tsx` line 6

**What to do — ONE edit in `version-timeline.tsx` line 6:**

CHANGE this line:
```typescript
type VersionWithUser = ContractVersion & { createdByUser?: { name?: string } };
```

TO this:
```typescript
type VersionWithUser = ContractVersion & { createdByUser?: { name?: string | null } | null };
```

**Why this is safe:** The only usage of `createdByUser.name` in this file is line 51:
```typescript
const userName = version.createdByUser?.name ?? 'System';
```
The `?.` optional chaining already handles `null`/`undefined` for the object, and `?? 'System'` already handles `null`/`undefined` for the `name` property. So the runtime code already handles nulls correctly — we're just updating the type to match.

**Do NOT change the page file** (`versions/page.tsx`) — its type is correct (backend can return null).

**Status:** APPLIED — `version-timeline.tsx` now allows `null` for `createdByUser`.

---

### Fix B: `-tranneutral-` CSS Class Corruption (VISUAL BLOCKER)

**Root cause:** Task 11.2's slate→neutral rename accidentally matched `slate` inside the word `translate`:
- `tran[slate]-y-1/2` → `tran[neutral]-y-1/2`

This broke ALL CSS transform-translate positioning across the app. 22 occurrences in 11 files.

**What to do — global find-and-replace in ALL files listed below:**

Replace ALL occurrences of `-tranneutral-` with `-translate-` in these 11 files:

| # | File | Count |
|---|------|-------|
| 1 | `apps/user-app/components/contracts/contract-filters.tsx` | 5 |
| 2 | `apps/user-app/components/contracts/wizard-steps/terms-step.tsx` | 4 |
| 3 | `apps/user-app/app/forgot-password/page.tsx` | 2 |
| 4 | `apps/user-app/app/dashboard/admin/users/page.tsx` | 2 |
| 5 | `apps/user-app/app/dashboard/admin/audit/page.tsx` | 2 |
| 6 | `apps/user-app/app/dashboard/admin/feature-flags/page.tsx` | 2 |
| 7 | `apps/user-app/app/dashboard/contracts/create/page.tsx` | 1 |
| 8 | `apps/user-app/components/contracts/approval-queue.tsx` | 1 |
| 9 | `apps/user-app/components/contracts/create-template-modal.tsx` | 1 |
| 10 | `apps/user-app/components/layout/header.tsx` | 1 |
| 11 | `apps/user-app/components/contracts/oracle-risk-panel.tsx` | 1 |

**Status:** APPLIED — global replace completed.

**For each file, use the Edit tool with `replace_all: true`:**
```
old_string: "-tranneutral-"
new_string: "-translate-"
replace_all: true
```

**IMPORTANT VERIFICATION after Fix B:** Run this grep to confirm zero remaining occurrences:
```bash
grep -r "tranneutral" apps/user-app/
```
Expected result: no matches.

---

### Fix C: Build Verification (FINAL STEP)

After completing Fix A and Fix B, run:
```bash
npx turbo run build --filter=user-app --force
```

**Expected result:** 0 errors, build passes.

If build still fails, capture the EXACT error message and stop — do not attempt further fixes without escalating.

---

### Summary of ALL Phase 11 remaining work:

| Task | Status | Action |
|------|--------|--------|
| Fix A: VersionWithUser type | COMPLETE | 1 line change in `version-timeline.tsx` |
| Fix B: `-tranneutral-` rename bug | COMPLETE | 22 replacements across 11 files |
| Fix C: Build verification | COMPLETE | Build passes (warnings only) |
| Task 11.4a: A11y remaining | COMPLETE | No changes needed (already accessible) |

**After Fix C passes, Phase 11 and the entire frontend rebuild are COMPLETE.**

---

## Phase 12 — Creation Wizard Rebuild (Part A/B Structure) — COMPLETE

**Status:** COMPLETE (2026-02-07)
**Build verified:** `npx turbo run build --filter=user-app --force` (passes after cleanup)

**Implementation summary:**
- New wizard steps: `setup-step.tsx`, `part-a-preview-step.tsx`, `annexure-editor-step.tsx`, `preview-step.tsx`
- Wizard rewired to 4 steps with Part A preview + annexure editor + full preview
- Parent page now passes `baseContent` + combined annexure HTML into wizard
- Old steps removed after verification: `details-step.tsx`, `terms-step.tsx`, `review-step.tsx`

**Written by:** Opus (2026-02-07)
**Approved by:** User (confirmed understanding before plan creation)
**Goal:** Rebuild the contract creation wizard from a 3-step metadata form into a 4-step flow that includes Part A preview, Part B annexure editing, and full document preview with Oracle AI chat.

### Background & Gap Analysis

**Current wizard** (`creation-wizard.tsx`): Details form → Terms form → Summary table → Create
**Required wizard** (per PRD Flow 2 + Stitch designs): Setup → Part A Preview → Edit Annexures → Full Preview + Save

**Missing pieces:**
1. Part A template preview step (read-only document view)
2. Part B annexure editor step (TipTap editor within wizard)
3. Full document preview step (Part A + Part B combined, with Oracle AI panel)
4. The "Review" step currently shows a plain summary table instead of the actual document

**Design references:**
- `stitch_clm_tool_rework 3/part_a_template_preview_v2/screen.png` + `code.html` — Part A preview
- `stitch_clm_tool_rework 3/contract_editor_workspace/screen.png` + `code.html` — Editor workspace
- `stitch_clm_tool_rework 3/full_document_preview_v2/screen.png` + `code.html` — Full preview

**Data model (from `@repo/types`):**
```typescript
interface Template extends BaseEntity {
    name: string; code: string; category: TemplateCategory;
    description?: string; baseContent: string; // ← Part A HTML
    isGlobal: boolean; isActive: boolean; createdByUserId: string;
}
interface TemplateWithAnnexures extends Template {
    annexures: Annexure[];  // ← Part B pieces
}
interface Annexure {
    id: string; templateId: string; name: string; title: string;
    content: string;  // ← HTML content for this annexure
    fieldsConfig: FieldConfig[]; order: number;
}
```

**API:** `api.templates.get(id)` returns template data (should include `baseContent` + `annexures`).

---

### Execution Plan — 5 Tasks (execute in order)

---

### Task 12.1 — Merge Details + Terms into Setup Step

**File:** `apps/user-app/components/contracts/wizard-steps/details-step.tsx`

**What to do:**
1. Rename the file from `details-step.tsx` to `setup-step.tsx` (or keep the filename but rename the export).
2. Merge ALL fields from both `details-step.tsx` and `terms-step.tsx` into a single component.
3. Export interface should be `ContractSetup` combining both:

```typescript
export interface ContractSetup {
    // From details
    title: string;
    counterpartyName: string;
    counterpartyEmail: string;
    counterpartyAddress: string;
    startDate: string;
    endDate: string;
    description: string;
    // From terms
    amount: string;
    paymentTerms: string;
}
```

4. The component renders ALL form fields in one scrollable view:
   - Section header: "Contract Details" with subtitle referencing template name
   - Fields: title*, counterparty name*, counterparty email, counterparty address, start date, end date, description
   - Section divider
   - Section header: "Commercial Terms" with subtitle "Define the financial structure"
   - Fields: contract value (with $ prefix and USD suffix), payment terms dropdown
   - AI indicator banner at bottom (violet bg, "AI Assistant Working" — keep from terms-step)
   - Info cards at bottom: "Why ask for value?" + "Legal Approval" (keep from terms-step)

5. Export: `export function SetupStep({ data, onChange, templateName }: SetupStepProps)`

**Files to reference for code patterns:**
- Current `details-step.tsx` lines 22-130 — form field pattern (label wrapping + Input)
- Current `terms-step.tsx` lines 25-116 — contract value + payment dropdown + AI indicator

**After this task:** `terms-step.tsx` is NO LONGER imported anywhere (will be cleaned up in Task 12.5). Do NOT delete it yet.

---

### Task 12.2 — Create Part A Preview Step

**New file:** `apps/user-app/components/contracts/wizard-steps/part-a-preview-step.tsx`

**What to do:**
1. Create a new component that displays the template's Part A content (baseContent) as a read-only document.

2. Props interface:
```typescript
interface PartAPreviewStepProps {
    templateContent: string;  // template.baseContent HTML
    templateName: string;
}
```

3. Component structure (match `part_a_template_preview_v2/screen.png` + `code.html`):

```
┌─────────────────────────────────────────────┐
│ 🔒 Read-Only: Standard Terms               │
│ This section contains standard legal terms  │
│ approved by Legal. These cannot be edited.  │
│ You will be able to modify Annexures in the │
│ next step.                                  │
├─────────────────────────────────────────────┤
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │     "Standard Terms" watermark      │   │
│   │     (diagonal, light gray)          │   │
│   │                                     │   │
│   │  MASTER SERVICES AGREEMENT          │   │
│   │  Reference: MSA-2025-001 | Part A   │   │
│   │                                     │   │
│   │  1. Definitions and Interpretation  │   │
│   │  1.1 In this Agreement...           │   │
│   │                                     │   │
│   │  2. Term and Termination            │   │
│   │  2.1 This Agreement shall...        │   │
│   │                                     │   │
│   │  (rendered from template.baseContent│   │
│   │   via dangerouslySetInnerHTML)      │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

4. Key CSS classes (from the design HTML):
   - Info banner: `rounded-lg bg-neutral-200/60 border border-neutral-300 p-4 flex items-start gap-3`
   - Lock icon: `p-1.5 bg-neutral-200 rounded-md text-neutral-600` with `<MaterialIcon name="lock" size={20} />`
   - Banner title: `text-sm font-bold text-neutral-800` → "Read-Only: Standard Terms"
   - Banner body: `text-sm text-neutral-600 mt-1 leading-relaxed`
   - Document paper: `bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-neutral-200 min-h-[600px]` with `max-w-[850px] mx-auto`
   - Watermark: `absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-10 select-none` containing a rotated text `-rotate-45 text-neutral-50 text-[100px] font-black tracking-widest uppercase border-[6px] border-neutral-50 p-12 rounded-2xl opacity-80`
   - Document content zone: `relative z-20 font-serif p-12 md:p-16 space-y-8 leading-loose text-[15px] text-justify text-neutral-800`
   - Render the `templateContent` HTML via: `<div dangerouslySetInnerHTML={{ __html: templateContent }} />`
   - Bottom fade: `h-32 bg-gradient-to-b from-transparent to-white w-full mt-4`

5. This component is purely presentational — no state, no API calls. It receives templateContent as a prop from the parent wizard.

6. Import: `import { MaterialIcon } from '@/components/ui/material-icon';`

---

### Task 12.3 — Create Annexure Editor Step

**New file:** `apps/user-app/components/contracts/wizard-steps/annexure-editor-step.tsx`

**What to do:**
1. Create a component that shows Part A (locked) at top and Part B (editable TipTap) below, matching the `contract_editor_workspace` design.

2. Props interface:
```typescript
interface AnnexureEditorStepProps {
    templateContent: string;     // template.baseContent HTML (Part A, read-only)
    annexureContent: string;     // Current Part B HTML content (initialized from template annexures)
    onAnnexureChange: (html: string) => void;  // Callback when user edits Part B
    contractId?: string;         // For AI assistant (can be empty/placeholder during creation)
}
```

3. Component structure (match `contract_editor_workspace/screen.png`):

```
┌────────────────────────────────────────────────────────────┐
│  Main editor area                              │ AI Panel │
│  ┌──────────────────────────────────────────┐   │ (toggle) │
│  │ 🔒 LEGAL TERMS — READ ONLY              │   │          │
│  │ ─────────────────────────────────────────│   │ Oracle   │
│  │ MASTER SERVICES AGREEMENT               │   │ AI chat  │
│  │ 1. DEFINITIONS                          │   │          │
│  │ 2. SCOPE OF SERVICES                    │   │          │
│  │ 3. PAYMENT TERMS                        │   │          │
│  │ (grayed out, pointer-events-none)       │   │          │
│  │ ─────────────────────────────────────────│   │          │
│  │ ··· END OF PART A ···                   │   │          │
│  │ ─────────────────────────────────────────│   │          │
│  │ ✏️ PART B — ANNEXURES & SCHEDULES       │   │          │
│  │ ┌────────────────────────────────────┐   │   │          │
│  │ │ TipTap Editor (editable)          │   │   │          │
│  │ │ ANNEX A: SPECIFICATIONS           │   │   │          │
│  │ │ [user types here]                 │   │   │          │
│  │ └────────────────────────────────────┘   │   │          │
│  └──────────────────────────────────────────┘   │          │
└────────────────────────────────────────────────────────────┘
```

4. Reuse EXACT patterns from `edit-workspace.tsx`:

   **Part A locked section (copy from `edit-workspace.tsx` lines 139-168):**
   ```tsx
   {/* Part A Banner - Sticky */}
   <div className="bg-neutral-200 border-b border-neutral-300 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
       <div className="flex items-center gap-2 text-neutral-500">
           <MaterialIcon name="lock" size={18} />
           <span className="text-xs font-bold uppercase tracking-wide">Legal Terms — Read Only</span>
       </div>
   </div>
   {/* Part A Content */}
   <div className="p-8 relative">
       <div
           className="font-serif text-[15px] prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg text-neutral-500 select-none pointer-events-none opacity-80"
           dangerouslySetInnerHTML={{ __html: templateContent }}
       />
       <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
   </div>
   {/* End of Part A Divider */}
   <div className="w-full py-6 flex items-center gap-4 px-8">
       <div className="h-px flex-1 border-t border-dashed border-neutral-400" />
       <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-200/50 px-2 rounded">End of Part A</span>
       <div className="h-px flex-1 border-t border-dashed border-neutral-400" />
   </div>
   ```

   **Part B editable section (adapt from `edit-workspace.tsx` lines 170-187):**
   ```tsx
   <div className="flex-1 flex flex-col">
       <div className="px-8 pt-6 pb-2">
           <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider select-none">
               <MaterialIcon name="edit_note" size={14} />
               Part B — Annexures & Schedules
           </div>
       </div>
       <TipTapEditor
           content={annexureContent}
           onChange={onAnnexureChange}
           editable={true}
           placeholder="Start writing Annexures..."
       />
   </div>
   ```

5. AI panel (right sidebar, collapsible):
   - Add local state: `const [showAiPanel, setShowAiPanel] = useState(false);`
   - Toggle button in a toolbar/header area
   - When expanded: render `<AiAssistantPanel contractId={contractId || 'draft'} />` in a `w-80` right sidebar
   - The AI panel starts COLLAPSED (user can expand it)

6. Imports needed:
   ```typescript
   import { useState } from 'react';
   import { TipTapEditor } from '@/components/editor/tip-tap-editor';
   import { AiAssistantPanel } from '@/components/contracts/ai-assistant-panel';
   import { MaterialIcon } from '@/components/ui/material-icon';
   ```

7. Layout: Use flexbox — main content area (`flex-1`) + optional AI sidebar (`w-80`, conditionally rendered). Wrap the whole thing in a container that breaks out of the wizard's `max-w-2xl` constraint:
   ```tsx
   <div className="-mx-[calc(50vw-50%)] px-4"> {/* or use a prop to signal full-width mode */}
   ```
   **IMPORTANT:** This step needs more horizontal space than the wizard's default `max-w-2xl`. The parent wizard component will need to conditionally remove that constraint for steps 3 and 4 (see Task 12.5).

---

### Task 12.4 — Create Full Preview Step

**New file:** `apps/user-app/components/contracts/wizard-steps/preview-step.tsx`

**What to do:**
1. Create a component that renders the combined Part A + Part B document with an Oracle AI panel on the side.

2. Props interface:
```typescript
interface PreviewStepProps {
    templateContent: string;    // Part A HTML
    annexureContent: string;    // Part B HTML (user-edited)
    contractTitle: string;
    contractReference?: string;
}
```

3. Component structure (match `full_document_preview_v2/screen.png`):

```
┌──────────────────────────────────────────────────────────────┐
│  Document preview area                        │ Oracle AI   │
│  ┌──────────────────────────────────────┐     │ Risk Panel  │
│  │ 🔒 Read-only Preview badge (fixed)  │     │ (collapsible│
│  │                                      │     │  toggle)    │
│  │ CONTRACT TITLE                       │     │             │
│  │ Combined View: Part A & Part B       │     │ Risk score  │
│  │ ──────────────────────────────────── │     │ 82/100      │
│  │                                      │     │             │
│  │ PART A: GENERAL TERMS                │     │ Risk cards  │
│  │ [template baseContent rendered]      │     │             │
│  │                                      │     │ Chat input  │
│  │ ─── divider ───                      │     │             │
│  │                                      │     │             │
│  │ PART B: SPECIFIC PROVISIONS          │     │             │
│  │ [user annexure content rendered]     │     │             │
│  │                                      │     │             │
│  │ ──── Signature blocks ────           │     │             │
│  └──────────────────────────────────────┘     │             │
│  [zoom controls: - 100% + | print | download] │             │
└──────────────────────────────────────────────────────────────┘
```

4. Reuse the rendering pattern from `preview/page.tsx` lines 126-205:
   - Document paper: `bg-white w-full max-w-[850px] min-h-[1100px] shadow-2xl border border-neutral-200/60 px-20 py-24`
   - Document header with title + reference + date
   - Part A section: `<h2>Part A: General Terms</h2>` + `dangerouslySetInnerHTML={{ __html: templateContent }}`
   - Divider between parts
   - Part B section: `<h2>Part B: Specific Provisions</h2>` + `dangerouslySetInnerHTML={{ __html: annexureContent }}`
   - Signature blocks (two columns: Client Representative + Provider Representative)
   - Read-only badge (fixed position): `bg-neutral-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs`

5. Zoom controls (copy from `preview/page.tsx` lines 98-123):
   - Local state: `const [zoom, setZoom] = useState(100);`
   - Zoom in/out buttons, print button, download button
   - Apply zoom: `style={{ transform: \`scale(${zoom / 100})\`, transformOrigin: 'top center' }}`

6. Oracle AI panel (right sidebar, collapsible):
   - Local state: `const [showOracle, setShowOracle] = useState(true);` (starts EXPANDED for preview)
   - Toggle button in the header or as a floating button
   - When expanded: `<OracleRiskPanel contractId="draft" />` in a `w-[380px]` sidebar
   - Sidebar: `bg-violet-50 border-l border-violet-100 flex flex-col flex-shrink-0`

7. Imports needed:
   ```typescript
   import { useState } from 'react';
   import { OracleRiskPanel } from '@/components/contracts/oracle-risk-panel';
   import { MaterialIcon } from '@/components/ui/material-icon';
   ```

8. **IMPORTANT:** Like Task 12.3, this step needs full-width layout (not `max-w-2xl`).

---

### Task 12.5 — Rewire the Creation Wizard

**File:** `apps/user-app/components/contracts/creation-wizard.tsx`

**What to do:**
1. Update the STEPS array from 3 steps to 4 steps:
```typescript
const STEPS = [
    { number: 1, label: 'Setup' },
    { number: 2, label: 'Part A Preview' },
    { number: 3, label: 'Edit Annexures' },
    { number: 4, label: 'Preview' },
];
```

2. Update imports — remove old, add new:
```typescript
// REMOVE these:
import { DetailsStep, type ContractDetails } from './wizard-steps/details-step';
import { TermsStep, type ContractTerms } from './wizard-steps/terms-step';
import { ReviewStep } from './wizard-steps/review-step';

// ADD these:
import { SetupStep, type ContractSetup } from './wizard-steps/setup-step';
import { PartAPreviewStep } from './wizard-steps/part-a-preview-step';
import { AnnexureEditorStep } from './wizard-steps/annexure-editor-step';
import { PreviewStep } from './wizard-steps/preview-step';
```

3. Update props to include template data:
```typescript
interface CreationWizardProps {
    templateId: string;
    templateName: string;
    templateContent: string;      // Part A baseContent HTML
    templateAnnexures: string;    // Combined annexure HTML content
}
```

4. Update state — replace `details` + `terms` with single `setup` + new `annexureContent`:
```typescript
const [setup, setSetup] = useState<ContractSetup>({
    title: '',
    counterpartyName: '',
    counterpartyEmail: '',
    counterpartyAddress: '',
    startDate: '',
    endDate: '',
    description: '',
    amount: '',
    paymentTerms: '',
});

const [annexureContent, setAnnexureContent] = useState<string>(templateAnnexures);
```

5. Update `validateStep`:
```typescript
function validateStep(step: number): string | null {
    if (step === 1) {
        if (!setup.title.trim()) return 'Contract title is required.';
        if (!setup.counterpartyName.trim()) return 'Counterparty name is required.';
    }
    return null;
}
```

6. Update `handleNext` to use 4 steps:
```typescript
function handleNext() {
    const validationError = validateStep(currentStep);
    if (validationError) {
        showError('Validation Error', validationError);
        return;
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
}
```

7. Update `handleCreate` to use `setup` state and `annexureContent`:
```typescript
async function handleCreate() {
    const validationError = validateStep(1);
    if (validationError) { /* ... same pattern, redirect to step 1 ... */ }

    setIsSubmitting(true);
    try {
        const result = await api.contracts.create({
            templateId,
            title: setup.title.trim(),
            counterpartyName: setup.counterpartyName.trim() || undefined,
            counterpartyEmail: setup.counterpartyEmail.trim() || undefined,
            startDate: setup.startDate || undefined,
            endDate: setup.endDate || undefined,
            amount: setup.amount ? parseFloat(setup.amount) : undefined,
            description: setup.description.trim() || undefined,
            annexureData: annexureContent,  // ← Part B content from editor
            fieldData: {
                counterpartyAddress: setup.counterpartyAddress,
                paymentTerms: setup.paymentTerms,
            },
        });
        // ... same success handling ...
    }
}
```

8. Update step rendering — conditionally apply `max-w-2xl` only for steps 1-2:
```tsx
return (
    <div className={currentStep <= 2 ? 'max-w-2xl mx-auto' : ''}>
        {/* Stepper — always show */}
        <div className="mb-8 max-w-2xl mx-auto">
            <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step content */}
        <div className="mb-8">
            {currentStep === 1 && (
                <SetupStep
                    data={setup}
                    onChange={setSetup}
                    templateName={templateName}
                />
            )}
            {currentStep === 2 && (
                <PartAPreviewStep
                    templateContent={templateContent}
                    templateName={templateName}
                />
            )}
            {currentStep === 3 && (
                <AnnexureEditorStep
                    templateContent={templateContent}
                    annexureContent={annexureContent}
                    onAnnexureChange={setAnnexureContent}
                />
            )}
            {currentStep === 4 && (
                <PreviewStep
                    templateContent={templateContent}
                    annexureContent={annexureContent}
                    contractTitle={setup.title || 'Untitled Agreement'}
                />
            )}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 max-w-2xl mx-auto">
            <Button variant="ghost" onClick={currentStep === 1 ? () => router.back() : handleBack} disabled={isSubmitting}>
                <MaterialIcon name="arrow_back" size={16} className="mr-1.5" />
                Back
            </Button>

            {currentStep < 4 ? (
                <Button onClick={handleNext} className="bg-primary-700 hover:bg-primary-800 text-white">
                    {currentStep === 1 ? 'Next: Preview Template' :
                     currentStep === 2 ? 'Continue to Edit Annexures' :
                     'Preview Full Document'}
                    <MaterialIcon name="arrow_forward" size={16} className="text-white ml-1.5" />
                </Button>
            ) : (
                <Button onClick={handleCreate} disabled={isSubmitting} className="bg-primary-700 hover:bg-primary-800 text-white">
                    {isSubmitting ? (
                        <>
                            <MaterialIcon name="refresh" size={16} className="text-white mr-1.5 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <MaterialIcon name="save" size={16} className="text-white mr-1.5" />
                            Save as Draft
                        </>
                    )}
                </Button>
            )}
        </div>
    </div>
);
```

9. **Update the parent page** `apps/user-app/app/dashboard/contracts/create/[templateId]/page.tsx`:
   - The parent page already fetches the template via `useQuery(['template', templateId], () => api.templates.get(templateId))`
   - Cast the result to `TemplateWithAnnexures` (add import)
   - Compute combined annexure HTML from the template's annexures array:
   ```typescript
   import type { Template, TemplateWithAnnexures, Annexure } from '@repo/types';

   const templateData = template as TemplateWithAnnexures;
   const combinedAnnexures = (templateData.annexures || [])
       .sort((a: Annexure, b: Annexure) => a.order - b.order)
       .map((ann: Annexure) => `<h2>${ann.title}</h2>\n${ann.content}`)
       .join('\n<hr />\n');
   ```
   - Pass new props to `CreationWizard`:
   ```tsx
   <CreationWizard
       templateId={templateId}
       templateName={templateData.name || 'Template'}
       templateContent={templateData.baseContent || ''}
       templateAnnexures={combinedAnnexures}
   />
   ```

---

### Task 12.6 — Cleanup & Build Verify

**What to do:**
1. The old `review-step.tsx` is no longer imported. Do NOT delete it yet — verify build first.
2. The old `terms-step.tsx` is no longer imported. Do NOT delete it yet — verify build first.
3. If `details-step.tsx` was renamed to `setup-step.tsx`, verify no other files import `details-step.tsx`. Grep for `details-step` across the codebase.
4. Run build:
```bash
npx turbo run build --filter=user-app --force
```
5. If build passes, THEN delete the unused files:
   - `apps/user-app/components/contracts/wizard-steps/terms-step.tsx` (replaced by setup-step)
   - `apps/user-app/components/contracts/wizard-steps/review-step.tsx` (replaced by preview-step)
   - `apps/user-app/components/contracts/wizard-steps/details-step.tsx` (only if renamed to setup-step; skip if you kept the filename and just changed the export)
6. Run build again after deletions to confirm.

---

### Execution Order & Dependencies

```
Task 12.1 (Setup Step)           — no dependencies, do FIRST
Task 12.2 (Part A Preview Step)  — no dependencies, can parallel with 12.1
Task 12.3 (Annexure Editor Step) — no dependencies, can parallel with 12.1/12.2
Task 12.4 (Full Preview Step)    — no dependencies, can parallel with 12.1/12.2/12.3
Task 12.5 (Rewire Wizard)        — DEPENDS on 12.1, 12.2, 12.3, 12.4 all being complete
Task 12.6 (Cleanup & Build)      — DEPENDS on 12.5
```

**Recommended agent split for parallel execution:**
- **Agent 12A:** Tasks 12.1 + 12.2 (Setup step + Part A preview — simpler components)
- **Agent 12B:** Tasks 12.3 + 12.4 (Annexure editor + Full preview — more complex, reuse existing patterns)
- **Agent 12C (after A+B done):** Tasks 12.5 + 12.6 (Rewire + verify)

---

### Key Rules for Implementer

1. **DO NOT** change any existing post-creation components (`edit-workspace.tsx`, `preview/page.tsx`, etc.) — only create new wizard step components and modify the wizard itself
2. **DO** import `type` for all type-only imports: `import type { ... } from '@repo/types'`
3. **DO** use `neutral-*` (NOT `slate-*`) for all Tailwind color classes
4. **DO** use `<MaterialIcon name="..." size={N} />` for all icons (NOT Lucide, NOT inline SVG)
5. **DO** use `primary-700` for indigo accent color (NOT `indigo-700` in components)
6. **DO** use `@repo/ui` for `Button`, `Input`, `Textarea`, `Skeleton`, `Badge`, `cn`
7. **DO** use `dangerouslySetInnerHTML` for rendering template HTML content (Part A)
8. **DO NOT** add any `eslint-disable` or `@ts-ignore` comments
9. **DO NOT** use `any` type — use proper interfaces
10. When mixing `??` with `||`, wrap in parens: `(a ?? (b || c))`
11. **Currency is INR** (per PRD) — the $ prefix in the terms step should be ₹. BUT: keep as-is for now since it was already shipped; can be changed in a future pass if user requests.

### Verification Checklist

After all tasks complete:
- [ ] `npx turbo run build --filter=user-app --force` passes with 0 errors
- [ ] Template selection page still works (no regressions)
- [ ] Wizard shows 4 steps in stepper: Setup → Part A Preview → Edit Annexures → Preview
- [ ] Step 1 has all form fields (details + terms merged)
- [ ] Step 2 renders template Part A content read-only with info banner + watermark
- [ ] Step 3 shows Part A locked at top + TipTap editor for Part B below + collapsible AI panel
- [ ] Step 4 renders Part A + Part B combined document + collapsible Oracle panel
- [ ] "Save as Draft" on step 4 calls `api.contracts.create()` with `annexureData`
- [ ] Back/Next navigation works across all 4 steps
- [ ] No `any` types in new code
- [ ] No `slate-*` color classes in new code
- [ ] No unused imports or files

---

## Phase 6 — COMPLETE

**Agent 6A (a2c483b):** Version History & Diff — DONE
- `versions/page.tsx` → full comparison layout with header, breadcrumbs, COMPARING MODE badge
- `version-timeline.tsx` → vertical timeline sidebar with dual-select (from/to), version cards, user avatars
- `version-diff-view.tsx` → two-column side-by-side diff with inline highlighting (emerald/rose/amber)
- `version-detail-panel.tsx` → updated to new VersionDiffView API
- `review-workbench.tsx` → updated to new VersionDiffView API

**Agent 6B (a40ae50):** Upload Workflows — DONE
- `upload-version-modal.tsx` → radio cards (Revised Version / Counterparty Response), warning banner, change notes
- `upload-signed-dialog.tsx` → 3 signature status cards (Counterparty / Company / Fully Executed), execution note

---

## Files Modified/Created Per Phase

### Phase 0: Shell Foundation
- `components/layout/sidebar.tsx` — REWRITTEN (white bg, role nav)
- `components/layout/header.tsx` — REWRITTEN (search, org switcher)
- `components/layout/app-shell.tsx` — UPDATED (padding p-8)

### Phase 1: Auth & Onboarding
- `app/login/page.tsx` + `components/auth/login-form.tsx` — REWRITTEN (60/40 split)
- `app/forgot-password/page.tsx` — NEW (reset request + password form)
- `app/select-org/page.tsx` — REWRITTEN (single-org auto-redirect + multi-org grid)

### Phase 2: Dashboards
- `components/dashboard/business-dashboard.tsx` — REWRITTEN
- `components/dashboard/finance-dashboard.tsx` — REWRITTEN (snap-x carousel)
- `components/dashboard/legal-dashboard.tsx` — REWRITTEN (conic-gradient donut)
- `components/dashboard/legal-head-dashboard.tsx` — NEW
- `components/dashboard/super-admin-dashboard.tsx` — NEW
- `app/dashboard/page.tsx` — UPDATED (routing for all 5 roles)

### Phase 3: Contract List & Detail
- `components/contracts/contract-filters.tsx` — REWRITTEN
- `components/contracts/contract-table.tsx` — REWRITTEN
- `app/dashboard/contracts/page.tsx` — REWRITTEN
- `app/dashboard/contracts/[id]/page.tsx` — REWRITTEN (4 tabs)
- `components/contracts/activity-timeline.tsx` — NEW
- `components/contracts/document-preview-tab.tsx` — NEW (isomorphic-dompurify)

### Phase 4: Editor & Preview
- `components/contracts/contract-nav-sidebar.tsx` — REWRITTEN
- `components/contracts/edit-workspace.tsx` — REFINED
- `components/contracts/ai-assistant-panel.tsx` — REFINED (violet theme)
- `components/contracts/oracle-risk-panel.tsx` — NEW/FIXED
- `app/dashboard/contracts/[id]/preview/page.tsx` — NEW

### Phase 5: Templates
- `app/dashboard/contracts/create/page.tsx` — REWRITTEN (AI prompt banner)
- `components/contracts/template-card.tsx` — REWRITTEN
- `app/dashboard/templates/page.tsx` — NEW
- `components/contracts/create-template-modal.tsx` — NEW

### Phase 6: Version & Upload (COMPLETE)
- `app/dashboard/contracts/[id]/versions/page.tsx` — REWRITTEN (comparison layout, breadcrumbs, COMPARING MODE)
- `components/contracts/version-timeline.tsx` — REWRITTEN (vertical timeline, dual-select)
- `components/contracts/version-diff-view.tsx` — REWRITTEN (side-by-side diff, inline highlighting)
- `components/contracts/version-detail-panel.tsx` — UPDATED (new VersionDiffView API)
- `components/contracts/review-workbench.tsx` — UPDATED (new VersionDiffView API)
- `components/contracts/upload-version-modal.tsx` — REWRITTEN (radio cards, change notes)
- `components/contracts/upload-signed-dialog.tsx` — REWRITTEN (3 signature status cards, execution note)

### Phase 7: Review Workbenches (COMPLETE)
- `app/dashboard/approvals/legal/page.tsx` — REWRITTEN (3-panel: queue + workbench + Oracle)
- `app/dashboard/approvals/finance/page.tsx` — REWRITTEN (3-panel: queue + workbench + financial summary/Oracle toggle)
- `components/contracts/approval-queue.tsx` — REWRITTEN (search, sort, priority badges, avatar initials)
- `components/contracts/review-workbench.tsx` — REWRITTEN (4 tabs, document rendering, viewer avatars, action bar with Send Back/Escalate/Approve)
- `components/contracts/oracle-risk-panel.tsx` — REWRITTEN (risk cards with color bars, suggested actions, chat input)

### Phase 8: Send to Counterparty (COMPLETE)
- `components/contracts/send-counterparty-dialog.tsx` — REWRITTEN (split-pane: email form + live preview, tag inputs, attachments, Desktop/Mobile toggle)

### Phase 9: Admin User & Org Management (COMPLETE)
- `app/dashboard/admin/layout.tsx` — NEW (role guard for SUPER_ADMIN, ENTITY_ADMIN, LEGAL_HEAD)
- `app/dashboard/admin/users/page.tsx` — NEW (data table with 6 columns, search/role/status filters, pagination, 3 stats cards, invite modal, React Query + mock fallback)
- `app/dashboard/admin/roles/page.tsx` — NEW (split layout: role list w-64 + permission matrix with VIEW/CREATE/EDIT/DELETE checkboxes, financial approval limit toggle, select all per group)
- `app/dashboard/admin/organizations/page.tsx` — NEW (org header card, feature flags 2-col grid with toggles, template library 4-col grid, suspend org action)

### Phase 10: Admin Audit Log & Feature Flags (COMPLETE)
- `app/dashboard/admin/audit/page.tsx` — NEW (expandable row table: timestamp/actor/event/action/IP/source, JSON diff panel with line numbers + red/green highlighting, metadata sidebar, search with tag chips, date picker, export button, pagination with page numbers)
- `app/dashboard/admin/feature-flags/page.tsx` — NEW (split layout: flag sidebar w-72 grouped by category with search + right panel with flag detail, per-org toggle list with usage/region stats, floating save bar with dirty state tracking)

---

## Preserved Infrastructure (NOT modified)

- `lib/api-client.ts` — API client with CSRF, refresh, S3
- `lib/auth-context.tsx` — Auth context
- `lib/contract-actions.ts` — Action logic
- `lib/ai-mock.ts` — Mock AI responses
- `lib/hooks/use-*.ts` — React Query hooks (6 hooks)
- `lib/status-utils.ts` — Status display helpers
- `lib/toast-context.tsx` — Toast notifications
- `app/globals.css` — Design tokens
- `packages/ui/` — Badge, Button, Input, Card, Skeleton, Spinner
- `components/editor/` — TipTap editor integration
- `components/ui/material-icon.tsx` — Material Icons

---

## Build Status
- All phases 0-10: BUILD PASSES (0 errors, cached FULL TURBO)

---

## Remaining Work (Phase 11)

| Phase | Key Deliverables |
|-------|-----------------|
| 11 | Delete unused files, color consistency, TypeScript fixes, accessibility |

---

## Route Map

| Route | Purpose |
|-------|---------|
| `/login` | SSO + email login |
| `/forgot-password` | Password recovery |
| `/select-org` | Organization selection |
| `/dashboard` | Role-based dashboard (5 variants) |
| `/dashboard/contracts` | Contract list with filters |
| `/dashboard/contracts/create` | Template selection |
| `/dashboard/contracts/upload` | Third-party document upload |
| `/dashboard/contracts/[id]` | Contract detail (4 tabs) |
| `/dashboard/contracts/[id]/edit` | Editing workspace |
| `/dashboard/contracts/[id]/versions` | Version comparison |
| `/dashboard/contracts/[id]/preview` | Full document preview |
| `/dashboard/templates` | Template library |
| `/dashboard/approvals/legal` | Legal review workbench |
| `/dashboard/approvals/finance` | Finance review workbench |
| `/dashboard/admin/users` | User management (table, filters, invite) |
| `/dashboard/admin/roles` | Roles & permissions matrix |
| `/dashboard/admin/organizations` | Org detail, feature flags, templates |
| `/dashboard/admin/audit` | Audit log with expandable diffs |
| `/dashboard/admin/feature-flags` | Feature flag management per org |

---

## Known Stubs / TODOs
- `lib/ai-mock.ts` — All AI functions mocked. Replace when backend adds endpoints.
- Password recovery is UI-only (no backend API integration)
- Version diff depends on backend `compare` endpoint
- SSO button not wired to real Azure AD flow yet

---

## Phase 13 — AI Visualization Cleanup (COMPLETE)

**Status:** COMPLETE (2026-02-09)
**Build verified:** `npm run build` (passes)
**Agent:** Antigravity

**Scope:** Remove intrusive AI visualizations while preserving the core AI Chat functionality.

### Tasks Completed:

1.  **Dashboard Cleanup:**
    - Removed "AI Observability Panel" from Super Admin Dashboard (`super-admin-dashboard.tsx`).
    - Layout adjusted to fill the gap.

2.  **Contract Preview & Approvals:**
    - Removed "Oracle Risk Panel" sidebar and toggle from `preview-step.tsx`.
    - Removed "Oracle Risk Panel" from Legal Approval page (`approvals/legal/page.tsx`).
    - Removed "Oracle Risk Panel" from Finance Approval page (`approvals/finance/page.tsx`).

3.  **Upload Flow:**
    - Replaced full-screen `AiProcessingOverlay` with a subtle inline loading spinner in `upload/page.tsx`.

4.  **AI Chat Refinements (from previous session):**
    - Simplified `AiAssistantPanel`.
    - Implemented "minimize" state (Floating Action Button) for AI Chat in Editor and Wizard.
    - Fixed Sidebar auto-collapse behavior in Editor routes.

**Verification:**
- Manual verification of UI changes.
- `npm run build` passed.
- `npm run lint` passed (warnings only).
