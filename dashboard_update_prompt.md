Update the Dashboard UI to match the new "Trustworthy Professional" Design System.

**current_state:**
- The current dashboard uses a "Vibrant Orange" theme (`bg-orange-600`, etc.).
- Cards use generic shadows and `rounded-2xl` corners.
- The "Lumina Oracle" FAB is inconsistent with the new professional tone.

**DESIGN SYSTEM (REQUIRED - from DESIGN.md):**
- **Theme:** "Trustworthy Professional" (Deep Indigo & Slate).
- **Primary Color:** Deep Indigo (`#463acb` / `bg-indigo-600`) for primary actions and accents.
- **Secondary Color:** Slate (`#64748b` / `text-slate-500`) for metadata.
- **Background:** Slate Neutral (`#f8fafc` / `bg-slate-50`) for the page background.
- **Corners:** Standardized `rounded-md` (6px) for buttons, inputs, and cards. No `rounded-2xl` or `rounded-xl`.
- **Typography:** Inter font, tight tracking (-0.015em).
- **Shadows:** Subtle, diffused shadows (`shadow-sm`).

**Specific Changes Required:**
1.  **Header:**
    - Change "Create New Contract" button from Orange to **Indigo**.
    - Update button radius to `rounded-md`.
2.  **Stats Cards:**
    - Change corner radius to `rounded-md`.
    - Update icon backgrounds (currently blue/emerald/amber) to be consistent with the professional palette (use Indigo/Slate where appropriate, or keep semantic colors but mute them).
    - Ensure shadows are `shadow-sm`.
3.  **Recent Contracts Table:**
    - Update "View All" button text color to **Indigo**.
    - Ensure table container radius is `rounded-md`.
    - Update status badges to match the Indigo-based design language (e.g., use Slate for Draft, Indigo for Signed).
4.  **Oracle FAB:**
    - Ensure the FAB button uses the primary **Indigo** color (already seems to be Indigo in code, but verify).
    - Update the input field focus ring to **Indigo**.

**Context:**
Refactor the existing `dashboard/page.tsx` to strictly adhere to these rules. Replace all `orange-*` classes with their `indigo-*` equivalents.
