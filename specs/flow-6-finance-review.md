# Design Spec: Flow 6 - Finance Review (The "Auditor")

> **Goal**: Provide Finance users with a "Financial Auditor" workbench—a specialized, read-only view of the contract that highlights financial terms, risks, and changes without allowing text modification.

## 1. UX Vision: The Auditor's Lens

### Layout: Use the "Workbench" Layout (Shared with Legal)
We reuse the Flow 5 "Workbench" structure for consistency, but with strict constraints:
- **Left Pane (The Ledger)**: The Queue.
    - **Visuals**: Focus on *Deadlines* and *Contract Value*.
- **Right Pane (The Audit)**: The Read-Only Workbench.

### The Audit Workflow (Right Pane)
1.  **Tab 1: Review (Read-Only)**
    - Embedding the **Flow 3 Editor** in strict `readOnly={true}` mode.
    - **Finance Lens**: AI highlights "Commercial Terms" (Payment terms, penalties, caps) automatically? (Future scope).
2.  **Tab 2: Changes (The Diff)**
    - **Crucial for Finance**: "Did the payment terms change since the last version?"
    - Uses **Flow 4 Diff Viewer**.
3.  **Tab 3: Context (The Paper Trail)**
    - Essential for audit compliance. Shows who requested, who approved previously.

### Action Bar (The Stamp)
- **Approve**: "Clear for Payment/Execution".
- **Approve with Note**: "Approved, but noted X budget code".
- **Request Revision**: "Reject - Incorrect Payment Terms".

---

## 2. Technical Architecture

### A. Page Refactor: `approvals/finance/page.tsx`
- **Reuse**: Deep reuse of `ReviewWorkbench` component designed in Flow 5.
- **Config**:
    - `mode="AUDIT"` (Implies Read Only).
    - `actions={['APPROVE', 'APPROVE_WITH_NOTE', 'REQUEST_REVISION']}`.

### B. Logic Differences vs Legal
- **Permissions**: Hardcode `readOnly` to `true`. Finance users *never* see the line-edit tools.
- **Actions**:
    - "Request Revision" triggers the same backend transition (Status -> Draft), but the notification context is "Finance Rejection".

---

## 3. Implementation Steps

> *Dependency*: This flow heavily depends on Flow 5's `ReviewWorkbench` component.

1.  **Refactor Page**: Replace manual grid with `DualPaneLayout`.
2.  **Integrate Workbench**: Import `ReviewWorkbench`.
3.  **Configure Props**: Pass `readOnly={true}`.
4.  **Connect Actions**: Wire up `SmartActionButtons` with Finance context.

---

## 4. Constraints
- [x] **Strict Read-Only**: Editor must not accept input.
- [x] **Diff Visibility**: Must serve diffs to catch discrete changes.
- [x] **AI Assistant**: Available for "What are the payment terms?" queries.
