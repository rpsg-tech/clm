# Design Spec: Flow 4 - Version Management (The "Time Machine")

> **Goal**: Transform the Version History from a simple list into a "Time Machine" that provides instant context. Users should not just see *that* a file changed, but understand *why* (AI Change Summary) and *what it contains* (Executive Summary).

## 1. UX Vision: Contextual Timeline

### Layout: The Dual Pane "Time Machine"
We continue the **Dual Pane** language (Flow 2 & 3):
- **Left Pane (The Timeline)**: A vertically scrolling, rich list of version events. Focuses on *Who* and *When*.
- **Right Pane (The Intelligence)**: Display details for the *selected* version. Focuses on *What* (Snapshots) and *Why* (AI Analysis).

### The "Version Intelligence" View (Right Pane)
For any selected version, we show:
1.  **Header**: Big status badge (Draft/Active), Version Number, Author.
2.  **Executive Summary**: "What is this document?" (AI Generated 1-paragraph brief).
3.  **Change Impact**: "What changed since v(N-1)?" (AI Generated bullet points).
4.  **Actions**: "Compare with Current", "Restore", "Download", "View File".

---

## 2. Technical Architecture

### A. Page Refactor: `[id]/versions/page.tsx`
- **Layout**: Use `DualPaneLayout`.
- **State**: `selectedVersionId` (Controls Right Pane).

### B. New Components

#### 1. `VersionTimelinePanel` (Left Pane)
- **Role Awareness**: Show distinct avatars/badges for "Legal Team" vs "Counterparty" vs "Business User".
- **Visuals**: Vertical connector line. Active state highlighting (Indigo).
- **Grouping**: Group by Date (Today, Yesterday, Last Month).

#### 2. `VersionIntelligencePanel` (Right Pane)
- **Tabs**:
    - **Overview**: The AI Summaries & Metadata.
    - **Preview**: Read-only render of the document content (reusing `ContractEditorView` or `FilePreviewPane`).
- **AI Integration**:
    - `api.ai.generateSummary(versionId)`
    - `api.ai.generateChangeLog(versionId, previousVersionId)`

### C. Data Requirements
- Extend `ContractVersion` interface to support:
    - `summary`: string (cached AI summary).
    - `changeLog`: string[] (cached AI diff points).
- *Mocking*: If backend doesn't support these fields yet, we will mock the AI response in the frontend for the demo.

---

## 3. Implementation Steps

1.  **Refactor Page**: Implement `DualPaneLayout` in `versions/page.tsx`.
2.  **Timeline Component**: Build `VersionTimelinePanel` with persona-based styling.
3.  **Intelligence Component**: Build `VersionIntelligencePanel` with tabs.
4.  **Integration**: Wire up selection state.
5.  **AI Simulation**: Add a "Generate Summary" button that simulates the AI call (loading state -> text appearance).

---

## 4. Constraints
- [x] **Date-driven**: Timeline must emphasize dates.
- [x] **Dual Summaries**: Must show both "Executive Summary" and "Change Summary".
- [x] **Consistency**: Use the same `DualPaneLayout` structure as Flow 2/3.
