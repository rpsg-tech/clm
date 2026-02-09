# Design Spec: Flow 3 - Contract Workspace (The "Cockpit")

> **Goal**: Unify the editing experience into a role-aware "Cockpit". Legal users get full architectural control (AI, Full Edit), while Business users get a pristine "Read & Update" view that aligns with the new "Intake Airlock" aesthetic.

## 1. UX Vision: Two Modes, One Soul

### Mode A: The Architect (Legal User)
- **Metaphor**: "IDE for Contracts".
- **Capabilities**:
    - **Full Write Access**: Can edit *both* Main Agreement and Annexures (Breaking the current "Main is locked" constraint for admins).
    - **AI Copilot**: The Right Pane (`ContractAssistantSidebar`) is open by default.
    - **Track Changes**: Visual indicators for edited clauses (simulated for now via highlights).

### Mode B: The Keeper (Business User)
- **Metaphor**: "Secure Viewer".
- **Capabilities**:
    - **Read-Only**: The document is locked. 
    - **Action**: "Upload New Version" (Versioning Flow).
    - **Review**: Visual diffs for history (using the Version timeline).

---

## 2. Technical Architecture

### A. Page Refactor: `[id]/edit/page.tsx`
We will upgrade existing `EditContractPage` to match the "Dual Pane" aesthetic of Flow 1 & 2.

- **Layout**: 
    - Use `DualPaneLayout` style (or genericize it further to `WorkspaceLayout` to support the Navigation Sidebar).
    - **Left**: `ContractNavigationSidebar` (Navigation).
    - **Center**: `ContractEditorView` (The Document).
    - **Right**: `AiClauseAssistant` (The Brain).

### B. Logic Upgrades
1.  **Permission State**:
    - Add `const [userRole, setUserRole] = useState<'LEGAL' | 'BUSINESS'>('LEGAL')` (for dev toggle).
    - `isEditable = userRole === 'LEGAL'`.

2.  **Main Agreement Unlocking**:
    - Currently: `readOnly={activeDocId === 'main'}`.
    - New: `readOnly={activeDocId === 'main' && userRole !== 'LEGAL'}`.

3.  **Upload Version Action**:
    - Add "Upload New Version" button to the toolbar for Business Users.
    - Triggers a Modal utilizing the `UploadDropZone` (reused from Flow 2).

### C. Component Reuse
- **`UploadDropZone`**: Reuse this component inside a Dialog for the "Upload New Version" action.
- **`DualPaneLayout`**: Enhance to support `sidebar` prop (Left Navigation).

---

## 3. Implementation Steps

1.  **Enhance Layout**: Update `DualPaneLayout` to accept an optional `sidebar` prop (for the Navigation Sidebar).
2.  **Update Page**:
    - Import `DualPaneLayout`.
    - replace the manual flex layout in `edit/page.tsx`.
    - Implement the `userRole` toggle (Dev Mode).
3.  **Unlock Editing**: Update the `readOnly` logic passed to `ContractEditorView`.
4.  **Add Upload Action**: Implement the "Upload New Version" modal using `UploadDropZone`.

---

## 4. Constraints
- [x] **No underlying change**: `api.contracts.update` remains the save method.
- [x] **Business Logic**: Business users blocked from editing Main text; can only edit Annexures (if allowed) or Upload.
- [x] **Style**: Must match Flow 1/2 (Indigo/Slate palette, rounded buttons).
