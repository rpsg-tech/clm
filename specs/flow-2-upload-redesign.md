# Design Spec: Flow 2 - Agreement Upload (Third-Party Paper)

> **Goal**: Create a premium "Intake" experience for users uploading third-party contracts (PDF/Word), replacing the generic form with a "Split View" workspace that mirrors the aesthetics of Flow 1.

## 1. UX Vision: "The Intelligent Intake"

The journey transforms from a "File Input" to an "AI-Assisted Workspace".

### Phase 1: The Launchpad (Entry)
- **Current**: A small "Upload" text button hidden in the Launchpad.
- **New Design**: A Dedicated **"Import Third-Party Paper" Tile** in the `ContractLaunchpad` grid.
    - **Visual**: Distinct icon (e.g., `UploadCloud`), dashed border pattern to imply "Drop Zone".
    - **Interaction**: Users can drag & drop a file directly onto this tile to start.

### Phase 2: Processing (The "Airlock")
- **Action**: User drops file.
- **Micro-Interaction**: Full-screen overlay or modal with "AI Scanning..." animation.
    - *Why*: `api.ai.analyzeFile` takes 2-5 seconds. We turn this wait time into distinct value ("AI is reading dates...", "Extracting Metadata...").
- **Transition**: Smooth fade into the Workspace.

### Phase 3: The Split View Workspace
Adapt the **Flow 1 Split View** pattern for uploads:

| **Left Pane (The Reality)** | **Right Pane (The Metadata)** |
|-----------------------------|-------------------------------|
| **PDF / Document Preview**  | **Smart Extraction Form**     |
| Read-only view of the file. | Auto-filled Title, Counterparty, Dates. |
| Zoom/Scroll controls.       | Clean, linear form inputs. |
| "Original File" badge.      | "AI Confidence" indicators (optional). |

### Phase 4: Action
- **Primary Action**: "Create Contract" (Submits and redirects to Contract Detail).
- **Secondary Action**: "Re-upload" (if wrong file).

---

## 2. Technical Architecture

### A. Component Evolution
We will refactor the highly specific `SplitViewEditor` (from Flow 1) into a generic **`DualPaneLayout`** to support both flows.

**`components/layout/dual-pane-layout.tsx`** (New Generic Container)
- `props.leftPane`: ReactNode (The Template Preview OR PDF Viewer)
- `props.rightPane`: ReactNode (The TipTap Editor OR Stats Form)
- `props.header`: ReactNode (Shared Toolbar)

### B. New Components for Flow 2
1.  **`components/upload/file-preview-pane.tsx`**
    - Usage: Left Pane.
    - Renders: `<iframe src={blobUrl} />` (simple & robust for PDF).
    - Features: Zoom controls, "Page X of Y".

2.  **`components/upload/metadata-form-pane.tsx`**
    - Usage: Right Pane.
    - Renders: Tailwind-styled form for Title, Counterparty, Dates, Amount.
    - Logic: Receives `errors` and `values` from parent.

3.  **`components/upload/upload-drop-zone.tsx`**
    - Usage: Enhance `ContractLaunchpad`.
    - Features: `react-dropzone` logic, distinct visual style.

### C. Page Refactor: `new/page.tsx`
- **Current**: Mixes `DraftingWorkspace` (Legacy) and Upload logic.
- **New**:
    - **State**: Manages `file` and `metadata`.
    - **Layout**: Uses `DualPaneLayout`.
    - **Logic**: Preserves existing `handleUpload` and `api.contracts.create` logic (crucial!).
    - **AI**: Keeps the existing `api.ai.analyzeFile` call but triggers the new Loading UI.

---

## 3. Implementation Steps

1.  **Refactor**: Extract `SplitViewEditor` frame into `DualPaneLayout`.
2.  **Create Components**: Build `FilePreviewPane` and `MetadataFormPane`.
3.  **Update Page**: Rewrite `app/dashboard/contracts/new/page.tsx` to use the new layout.
4.  **Update Launchpad**: Add the "Upload Tile" to `ContractLaunchpad`.
5.  **Verify**: Ensure API payloads match exactly (don't break the backend!).

---

## 4. Constraint Checklist
- [x] **No underlying change**: Uses existing `api.contracts.create` and logic.
- [x] **No editing**: Right pane is strictly metadata form, not a text editor.
- [x] **Flow 1 Alignment**: Uses same layout, toolbar styles, and button placement.
