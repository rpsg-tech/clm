# Design Spec: Flow 5 - Legal Review & Approval (The "Workbench")

> **Goal**: Streamline the Legal Review process by creating a "Legal Workbench" where review, comparison, and action happen in a single, unified interface without context switching.

## 1. UX Vision: The Command Center

### Layout: The "Inbox" Pattern
We adopt a high-density "Inbox" layout tailored for velocity:
- **Left Pane (The Queue)**: Rapid-fire list of pending items.
    - **Visuals**: Priority indicators (High/Low), SLA "Time Left" badges, Requestor Avatar.
    - **Grouping**: Group by "Due Today", "This Week", etc.
- **Right Pane (The Stage)**: A powerful workspace that loads the selected contract *instantly*.

### The Review Workflow (Right Pane)
Unlike the current static preview, the Right Pane becomes a multi-mode editor:
1.  **Tab 1: Review (The Editor)**
    - Embedding the **Flow 3 Editor** (Read-Only by default).
    - "Edit Mode" toggle: Allows immediate in-line redlining (Track Changes).
2.  **Tab 2: Changes (The Diff)**
    - Embedding the **Flow 4 Diff Viewer**.
    - Shows "What changed since approval request?" (or vs previous version).
3.  **Tab 3: Context (The Audit)**
    - "Instructions": Notes from the requestor.
    - "Thread": Comment history.
    - "Logs": Timeline of approvals.

### Action Bar (The Gavel)
A persistent footer for decision making:
- **Approve**: "Sign off".
- **Request Changes**: Opens a comment dialog + optionally switches editor to "Suggest Mode".
- **Reject**: Sends back to draft.

---

## 2. Technical Architecture

### A. Page Refactor: `approvals/legal/page.tsx`
- **Component**: Refactor to use `DualPaneLayout` (Left: Queue, Right: Workbench).
- **State**: `selectedApprovalId`, `reviewMode` ('VIEW' | 'DIFF' | 'EDIT').

### B. New Components

#### 1. `ApprovalQueueList` (Left Pane)
- **Props**: `approvals[]`, `onSelect`, `selectedId`.
- **Features**: Search/Filter by Requestor.

#### 2. `ReviewWorkbench` (Right Pane)
- **Props**: `contractId`, `versionId`.
- **Composition**:
    - Uses `ContractEditorView` (Flow 3 shared component).
    - Uses `ContractDiffView` (Flow 4 shared component).
    - Uses `SmartActionButtons` (Existing).

### C. Data Requirements
- Backend API (`api.approvals.pending`) is sufficient for the list.
- Need `api.contracts.getVersions` for the Diff view.

---

## 3. Implementation Steps

1.  **Refactor Page**: Replace manual grid with `DualPaneLayout`.
2.  **Build Workbench**: Create the Right Pane container with Tabs (Review, Diff, Context).
3.  **Integrate Editor**: Embed `ContractEditorView` (ensure it handles `readOnly` correctly).
4.  **Integrate Diff**: Embed `ContractDiffView`.
5.  **Actions**: Wire up `SmartActionButtons`.

---

## 4. Constraints
- [x] **No Context Switching**: Contract must open *in-place*, not new tab.
- [x] **History Visibility**: Must show "Who reviewed" and "Logs".
- [x] **Consistency**: Reuses Flow 3 & 4 core components.
