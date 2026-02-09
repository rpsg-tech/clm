# Stitch CLM Design Guide

**Version:** 2.4.0
**Last Updated:** February 2026
**Platform:** Contract Lifecycle Manager (CLM)

---

## Overview

This design guide documents the visual language, components, and patterns for the Stitch CLM platform. The system is designed for **stark professionalism, clarity, and speed** — optimized for legal and business professionals managing contracts.

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Professional Clarity** | Clean, minimal interfaces that prioritize content over chrome |
| **Accessible Density** | Dense information display without sacrificing readability |
| **Contextual AI** | AI features are visually distinct but non-intrusive |
| **Progressive Disclosure** | Show essential info first, details on demand |

---

## 2. Color System

### 2.1 Core Palette

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Indigo 700** | `#4338CA` | `--color-primary` | Primary actions, links, active states |
| **Indigo 800** | `#3730A3` | `--color-primary-hover` | Primary hover states |
| **Violet 700** | `#6D28D9` | `--color-ai` | AI features, highlights, assistant UI |
| **Slate 900** | `#0F172A` | `--color-text-primary` | Primary text |
| **Slate 600** | `#475569` | `--color-text-secondary` | Body text |
| **Slate 500** | `#64748B` | `--color-text-muted` | Captions, helper text |
| **Slate 300** | `#CBD5E1` | `--color-border` | Borders, dividers, disabled states |
| **Slate 50** | `#F8FAFC` | `--color-background` | Page backgrounds |
| **Rose 600** | `#E11D48` | `--color-destructive` | Delete actions, errors |

### 2.2 Semantic Colors

| Purpose | Color | Hex |
|---------|-------|-----|
| **Success** | Green 600 | `#16A34A` |
| **Warning** | Yellow 600 | `#CA8A04` |
| **Error** | Rose 600 | `#E11D48` |
| **Info** | Blue 600 | `#2563EB` |

### 2.3 AI-Specific Colors

AI features use the **violet spectrum** to differentiate from standard UI:

```css
/* AI Assistant Panel */
background: #F5F3FF;  /* violet-50 */
border: #EDE9FE;      /* violet-100 */
accent: #6D28D9;      /* violet-700 */
```

### 2.4 Status Badge Colors

| Status | Background | Text | Border |
|--------|------------|------|--------|
| Active | `green-50` | `green-700` | `green-600/20` |
| Draft | `slate-50` | `slate-600` | `slate-300` |
| Under Review | `yellow-50` | `yellow-800` | `yellow-600/20` |
| Waiting for Legal | `blue-50` | `blue-700` | `blue-600/20` |
| Blocked | `red-50` | `red-700` | `red-600/20` |

---

## 3. Typography

### 3.1 Font Stack

```css
--font-display: 'Inter', system-ui, sans-serif;
--font-serif: 'Merriweather', Georgia, serif;  /* Document content only */
--font-mono: 'SF Mono', 'Monaco', monospace;
```

### 3.2 Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display 2xl** | 48px / 3rem | Bold (700) | 1.1 | Hero headings |
| **Display xl** | 36px / 2.25rem | Semibold (600) | 1.2 | Page titles |
| **Heading lg** | 24px / 1.5rem | Medium (500) | 1.3 | Section headers |
| **Heading md** | 20px / 1.25rem | Semibold (600) | 1.4 | Card titles |
| **Body base** | 16px / 1rem | Regular (400) | 1.6 | Primary body text |
| **Body sm** | 14px / 0.875rem | Medium (500) | 1.5 | Secondary text, labels |
| **Caption** | 12px / 0.75rem | Medium (500) | 1.4 | Metadata, timestamps |
| **Code** | 14px / 0.875rem | Regular (400) | 1.5 | Code, IDs, refs |

### 3.3 Document Typography

Contract documents use **Merriweather** for legal readability:

```css
.document-content {
  font-family: 'Merriweather', serif;
  font-size: 17px;
  line-height: 1.7;
  text-align: justify;
}
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, icon padding |
| `space-2` | 8px | Inline spacing |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large gaps |
| `space-12` | 48px | Section margins |
| `space-16` | 64px | Page sections |

### 4.2 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small elements, badges |
| `rounded` | 6px | Buttons, inputs (default) |
| `rounded-lg` | 8px | Cards |
| `rounded-xl` | 12px | Modals, large cards |
| `rounded-full` | 9999px | Pills, avatars |

### 4.3 Container Widths

| Context | Max Width |
|---------|-----------|
| **Content area** | 1280px (max-w-7xl) |
| **Document viewer** | 800px |
| **Form columns** | 448px (max-w-md) |
| **Sidebar** | 320px (w-80) |
| **AI Assistant panel** | 384px (w-96) |

---

## 5. Components

### 5.1 Buttons

#### Primary Button
```html
<button class="bg-indigo-700 hover:bg-indigo-800 text-white font-medium
               py-2.5 px-5 rounded-md shadow-sm transition-colors
               focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700">
  Primary Action
</button>
```

#### Secondary Button
```html
<button class="bg-white border border-slate-300 text-slate-700
               hover:bg-slate-50 font-medium py-2.5 px-5 rounded-md
               shadow-sm transition-colors">
  Secondary Action
</button>
```

#### Ghost Button
```html
<button class="text-slate-600 hover:text-indigo-700 hover:bg-indigo-50
               font-medium py-2.5 px-5 rounded-md transition-colors">
  Ghost Button
</button>
```

#### Destructive Button
```html
<button class="bg-rose-600 hover:bg-rose-700 text-white font-medium
               py-2.5 px-5 rounded-md shadow-sm transition-colors">
  Delete
</button>
```

#### Button Sizes

| Size | Padding | Font Size | Radius |
|------|---------|-----------|--------|
| Small | `py-1.5 px-3` | 12px | `rounded` |
| Default | `py-2 px-4` | 14px | `rounded-md` |
| Large | `py-3 px-6` | 16px | `rounded-lg` |

### 5.2 Form Inputs

#### Text Input
```html
<div>
  <label class="block text-sm font-medium text-slate-700 mb-1.5">
    Email Address
  </label>
  <input type="email"
         class="block w-full rounded-md border-slate-300 shadow-sm
                focus:border-indigo-500 focus:ring-indigo-500
                text-slate-900 py-3 px-3 sm:text-sm"
         placeholder="user@company.com" />
</div>
```

#### Select
```html
<select class="block w-full rounded-md border-slate-300 shadow-sm
               focus:border-indigo-500 focus:ring-indigo-500
               text-slate-900 py-3 px-3 sm:text-sm">
  <option>Option 1</option>
</select>
```

#### Checkbox with Label
```html
<div class="flex items-start gap-3">
  <input type="checkbox"
         class="h-4 w-4 rounded border-slate-300 text-indigo-700
                focus:ring-indigo-600" />
  <div class="text-sm">
    <label class="font-medium text-slate-900">Label text</label>
    <p class="text-slate-500">Helper description</p>
  </div>
</div>
```

### 5.3 Cards

#### Standard Card
```html
<div class="rounded-xl border border-slate-200 bg-white shadow-sm">
  <div class="p-6">
    <h3 class="font-semibold text-slate-900">Card Title</h3>
    <p class="text-sm text-slate-500 mt-1">Card description</p>
  </div>
  <div class="p-6 pt-0">
    <!-- Content -->
  </div>
</div>
```

#### AI Feature Card
```html
<div class="rounded-xl border border-violet-100 bg-violet-50/50
            shadow-sm relative overflow-hidden">
  <div class="p-6">
    <div class="flex items-center gap-2 text-violet-700 mb-2">
      <span class="material-symbols-outlined text-[18px]">auto_awesome</span>
      <span class="text-xs font-bold uppercase tracking-wider">AI Assistant</span>
    </div>
    <h3 class="font-semibold text-slate-900">Feature Title</h3>
    <p class="text-sm text-slate-600 mt-2">Description text</p>
  </div>
  <div class="p-6 pt-0 flex gap-3">
    <button class="bg-violet-700 text-white text-sm font-medium px-4 py-2
                   rounded-md shadow-sm hover:bg-violet-800">
      Primary AI Action
    </button>
    <button class="text-violet-700 hover:bg-violet-100 px-4 py-2
                   rounded-md text-sm font-medium">
      Dismiss
    </button>
  </div>
</div>
```

#### Template Card
```html
<div class="group relative flex flex-col bg-white rounded-xl shadow-sm
            border border-slate-200 hover:shadow-lg hover:border-indigo-300
            transition-all duration-300 cursor-pointer overflow-hidden">
  <!-- Color bar -->
  <div class="h-2 bg-indigo-500 w-full"></div>
  <div class="p-6 flex-1 flex flex-col">
    <!-- Icon and status -->
    <div class="flex items-start justify-between mb-4">
      <div class="size-10 rounded-lg bg-indigo-50 flex items-center
                  justify-center text-indigo-700">
        <span class="material-symbols-outlined">handshake</span>
      </div>
      <span class="badge-active">Active</span>
    </div>
    <!-- Content -->
    <h3 class="text-lg font-bold text-slate-900 group-hover:text-indigo-700">
      Template Name
    </h3>
    <p class="text-sm text-slate-500 mt-2 line-clamp-2">Description</p>
    <!-- Footer -->
    <div class="mt-auto pt-6 flex items-center justify-between">
      <span class="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
        Category
      </span>
      <span class="text-sm font-semibold text-indigo-700 flex items-center gap-1
                   group-hover:translate-x-1 transition-transform">
        Select <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
      </span>
    </div>
  </div>
</div>
```

### 5.4 Status Badges

```html
<!-- Active -->
<span class="inline-flex items-center gap-1 rounded-md bg-green-50
             px-2 py-1 text-xs font-medium text-green-700
             ring-1 ring-inset ring-green-600/20">
  <span class="size-1.5 rounded-full bg-green-600"></span>
  Active
</span>

<!-- Under Review -->
<span class="inline-flex items-center gap-1 rounded-md bg-yellow-50
             px-2 py-1 text-xs font-medium text-yellow-800
             ring-1 ring-inset ring-yellow-600/20">
  <span class="size-1.5 rounded-full bg-yellow-600"></span>
  Under Review
</span>

<!-- Draft -->
<span class="inline-flex items-center rounded-md bg-slate-50
             px-2 py-1 text-xs font-medium text-slate-600">
  Draft
</span>
```

### 5.5 Navigation

#### Sidebar Item
```html
<a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg
                   text-slate-600 hover:bg-slate-100 transition-colors">
  <span class="material-symbols-outlined text-[20px]">dashboard</span>
  <span class="font-medium">Dashboard</span>
</a>

<!-- Active state -->
<a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg
                   bg-indigo-50 text-indigo-700">
  <span class="material-symbols-outlined text-[20px]">dashboard</span>
  <span class="font-medium">Dashboard</span>
</a>
```

#### Filter Pills
```html
<div class="flex gap-2 overflow-x-auto">
  <!-- Active -->
  <button class="px-4 py-1.5 rounded-full text-sm font-medium
                 bg-indigo-50 text-indigo-700 border border-indigo-100">
    All Templates
  </button>
  <!-- Inactive -->
  <button class="px-4 py-1.5 rounded-full text-sm font-medium
                 bg-white text-slate-600 border border-slate-200
                 hover:bg-slate-50">
    Sales Agreements
  </button>
</div>
```

---

## 6. Iconography

### 6.1 Icon System

**Primary:** Material Symbols Outlined
**Style:** Outlined, weight 400, optical size 24

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet" />

<style>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
```

### 6.2 Common Icons

| Purpose | Icon Name | Usage |
|---------|-----------|-------|
| Dashboard | `dashboard` | Navigation |
| Contracts | `description` | Document references |
| Templates | `folder_copy` | Template library |
| Create | `add_circle` | New item actions |
| Search | `search` | Search inputs |
| Settings | `settings` | Configuration |
| User | `person` | Profile, avatars |
| AI/Magic | `auto_awesome` | AI features |
| Edit | `edit` | Modification actions |
| Delete | `delete` | Removal actions |
| Download | `download` | Export actions |
| Share | `share` | Sharing features |
| Notifications | `notifications` | Alerts |
| Help | `help` | Support |
| Filter | `filter_list` | Filtering |
| More | `more_horiz` | Overflow menu |
| Arrow Back | `arrow_back` | Navigation |
| Arrow Forward | `arrow_forward` | Progression |
| Check | `check_circle` | Success, approval |
| Warning | `warning` | Alerts |
| Lock | `lock` | Security, NDA |
| Handshake | `handshake` | Agreements |
| Gavel | `gavel` | Legal review |

### 6.3 Icon Sizes

| Context | Class | Size |
|---------|-------|------|
| Inline text | `text-[16px]` | 16px |
| Buttons | `text-[18px]` | 18px |
| Standard | `text-[20px]` | 20px |
| Headers | `text-[24px]` | 24px |
| Feature | `text-[32px]` | 32px |

---

## 7. Patterns

### 7.1 Wizard / Stepper

```html
<div class="flex items-center justify-center gap-4">
  <!-- Completed Step -->
  <div class="flex items-center gap-2">
    <div class="size-8 rounded-full bg-indigo-700 text-white
                flex items-center justify-center">
      <span class="material-symbols-outlined text-[18px]">check</span>
    </div>
    <span class="text-sm font-medium text-slate-900">Details</span>
  </div>

  <!-- Connector -->
  <div class="w-12 h-px bg-indigo-700"></div>

  <!-- Current Step -->
  <div class="flex items-center gap-2">
    <div class="size-8 rounded-full bg-indigo-700 text-white
                flex items-center justify-center ring-4 ring-indigo-100">
      <span class="text-sm font-bold">2</span>
    </div>
    <span class="text-sm font-semibold text-indigo-700">Terms</span>
  </div>

  <!-- Connector -->
  <div class="w-12 h-px bg-slate-300"></div>

  <!-- Upcoming Step -->
  <div class="flex items-center gap-2">
    <div class="size-8 rounded-full border-2 border-slate-300
                text-slate-400 flex items-center justify-center">
      <span class="text-sm font-medium">3</span>
    </div>
    <span class="text-sm font-medium text-slate-400">Review</span>
  </div>
</div>
```

### 7.2 AI Assistant Working State

```html
<div class="bg-violet-50 border border-violet-100 rounded-lg p-4">
  <div class="flex items-center gap-3">
    <div class="size-8 rounded-full bg-violet-700 flex items-center
                justify-center animate-pulse">
      <span class="material-symbols-outlined text-white text-[18px]">
        auto_awesome
      </span>
    </div>
    <div>
      <p class="text-sm font-semibold text-violet-700">AI Assistant Working</p>
      <p class="text-xs text-slate-600">
        Drafting the Indemnity Clause based on previous deals...
      </p>
    </div>
    <!-- Progress bar -->
    <div class="ml-auto w-16 h-1 bg-violet-200 rounded-full overflow-hidden">
      <div class="h-full bg-violet-700 rounded-full animate-pulse"
           style="width: 60%"></div>
    </div>
  </div>
</div>
```

### 7.3 Version History Timeline

```html
<div class="relative pl-6">
  <!-- Timeline line -->
  <div class="absolute left-1.5 top-2 bottom-0 w-px bg-slate-200"></div>

  <!-- Current version -->
  <div class="relative">
    <div class="absolute left-[-22px] top-1.5 size-3 rounded-full
                bg-indigo-700 ring-4 ring-white"></div>
    <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
      <div class="flex justify-between">
        <span class="text-xs font-bold text-indigo-700">v3.2 Current</span>
        <span class="text-[10px] text-slate-500">10:23 AM</span>
      </div>
      <p class="text-xs text-slate-600 mt-1">Updated indemnity clause</p>
      <div class="mt-2 flex gap-2 text-[10px] font-mono">
        <span class="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">+12</span>
        <span class="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">-4</span>
      </div>
    </div>
  </div>
</div>
```

### 7.4 Contract Table Row

```html
<tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
  <td class="py-4 px-4">
    <div class="flex items-center gap-3">
      <div class="size-8 rounded-lg bg-indigo-50 flex items-center
                  justify-center text-indigo-600">
        <span class="material-symbols-outlined text-[18px]">description</span>
      </div>
      <div>
        <p class="font-semibold text-slate-900">Partnership Agreement</p>
        <p class="text-xs text-slate-500">Counterparty: Globex Corporation</p>
      </div>
    </div>
  </td>
  <td class="py-4 px-4 text-sm text-slate-600">Oct 24, 2023</td>
  <td class="py-4 px-4">
    <span class="badge-waiting">Waiting for Legal</span>
  </td>
  <td class="py-4 px-4">
    <button class="text-slate-400 hover:text-slate-600">
      <span class="material-symbols-outlined">more_vert</span>
    </button>
  </td>
</tr>
```

### 7.5 Document Highlight (AI/Edit Marker)

```html
<!-- AI Suggestion highlight -->
<div class="relative group my-6 bg-yellow-50/50 -mx-2 px-2 py-1
            rounded border-l-4 border-yellow-400">
  <p class="text-justify">Clause content here...</p>
  <div class="absolute -right-12 top-0">
    <div class="size-8 bg-yellow-400 text-white rounded-full
                flex items-center justify-center shadow-sm">
      <span class="text-xs font-bold">AI</span>
    </div>
  </div>
</div>

<!-- User edit highlight -->
<div class="relative group my-6 bg-green-50/50 -mx-2 px-2 py-1
            rounded border-l-4 border-green-500">
  <p class="text-justify">
    Payment due within <span class="font-bold bg-green-200 px-1">
    forty-five (45)</span> days...
  </p>
</div>
```

---

## 8. Page Layouts

### 8.1 Standard Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (h-16, sticky, border-b, bg-white)                       │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────┬─────────────────────────────────────────────────┐   │
│ │         │                                                 │   │
│ │ Sidebar │              Main Content                       │   │
│ │ (w-64)  │              (flex-1, p-6)                      │   │
│ │         │                                                 │   │
│ │         │                                                 │   │
│ └─────────┴─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Document Editor with AI Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                                          │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────┬───────────────────────────────────┬─────────────┐   │
│ │ Version │                                   │ AI          │   │
│ │ History │        Document Editor            │ Assistant   │   │
│ │ (w-80)  │        (flex-1, max-w-800px)      │ (w-96)      │   │
│ │         │                                   │             │   │
│ └─────────┴───────────────────────────────────┴─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Wizard Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ← Back to Dashboard                                           │
│                                                                 │
│   Page Title                                                    │
│   Description text                                              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Stepper (centered)                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │              Form Content (max-w-2xl, centered)         │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  ← Back                            Next: Step Name →    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌──────────────────┐  ┌──────────────────┐                    │
│   │ Info Card 1      │  │ Info Card 2      │  (contextual help) │
│   └──────────────────┘  └──────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Motion & Animation

### 9.1 Transition Defaults

```css
/* Standard transition */
transition-colors: 150ms ease-in-out;
transition-all: 200ms ease-in-out;

/* Card hover */
transition-all: 300ms ease-in-out;
```

### 9.2 Animation Classes

```css
/* Pulse for AI/loading states */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Bounce for typing indicators */
.animate-bounce {
  animation: bounce 1s infinite;
}

/* Stagger delays for typing dots */
.delay-75 { animation-delay: 75ms; }
.delay-150 { animation-delay: 150ms; }
```

### 9.3 Hover Effects

- **Cards:** `hover:shadow-lg hover:border-indigo-300`
- **Links:** `hover:text-indigo-700 hover:underline`
- **Buttons:** `hover:bg-[darker-shade]`
- **List items:** `hover:bg-slate-50`
- **Icons (in containers):** `group-hover:text-indigo-700`

---

## 10. Accessibility

### 10.1 Focus States

All interactive elements must have visible focus states:

```css
focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700
```

### 10.2 Color Contrast

- Body text on white: `slate-600` (4.5:1+ ratio)
- Primary actions: `indigo-700` on white (4.5:1+ ratio)
- Disabled text: `slate-400` (informational only, not actionable)

### 10.3 Touch Targets

Minimum touch target: 44x44px for mobile interactions

---

## 11. Dark Mode

The system supports dark mode via the `dark:` prefix. Key mappings:

| Light | Dark |
|-------|------|
| `bg-white` | `bg-slate-900` |
| `bg-slate-50` | `bg-slate-800` |
| `text-slate-900` | `text-white` |
| `text-slate-600` | `text-slate-300` |
| `border-slate-200` | `border-slate-700` |
| `bg-indigo-50` | `bg-indigo-900/30` |

---

## 12. Implementation Notes

### 12.1 Tech Stack

- **CSS Framework:** Tailwind CSS with forms and container-queries plugins
- **Font Loading:** Google Fonts (Inter, Merriweather)
- **Icons:** Material Symbols (Outlined)
- **Component Base:** Shadcn/ui patterns

### 12.2 Tailwind Config

```javascript
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#4338ca",
        "primary-hover": "#3730a3",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
    },
  },
};
```

### 12.3 Required Dependencies

```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

---

## Appendix: Quick Reference

### Color Tokens
```
Primary:     #4338CA (indigo-700)
AI Accent:   #6D28D9 (violet-700)
Destructive: #E11D48 (rose-600)
Success:     #16A34A (green-600)
Warning:     #CA8A04 (yellow-600)
```

### Spacing Quick Reference
```
4px  8px  12px  16px  20px  24px  32px  48px  64px
 1    2    3     4     5     6     8    12    16
```

### Common Component Classes
```
Button Primary:  bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-5 rounded-md
Button Secondary: bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2.5 px-5 rounded-md
Card:            rounded-xl border border-slate-200 bg-white shadow-sm
Badge Active:    inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20
Input:           block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500
```
