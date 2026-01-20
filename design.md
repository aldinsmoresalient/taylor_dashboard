# Design Language Specification

> A portable design system specification for building clean, professional, data-rich interfaces. This document captures design principles, patterns, and language independent of specific implementation frameworks.

---

## Design Philosophy

### Core Principles

**1. Clarity Over Decoration**
Every visual element serves a purpose. Ornamental elements are avoided in favor of functional design. The interface should feel like a well-organized workspace—everything in its place, nothing superfluous.

**2. Breathing Room**
Generous white space creates visual hierarchy and reduces cognitive load. Content is grouped into well-defined containers with consistent padding. Crowded interfaces create anxiety; spacious interfaces create calm.

**3. Restrained Color**
The foundation is neutral—grayscale backgrounds, dark text, light borders. Color is introduced sparingly and intentionally: brand color for primary actions, semantic colors for status communication. This restraint makes colored elements meaningful signals rather than noise.

**4. Soft Approachability**
Rounded corners, light shadows, and a friendly sans-serif typeface create warmth. The interface should feel modern and approachable, never cold or clinical. Hard edges and sharp contrasts are softened.

**5. Data Forward**
Numbers and status are prominent. Large, bold metrics. Compact tables for dense information. Color-coded indicators for immediate pattern recognition. The design assumes users need to scan and compare data quickly.

**6. Predictable Interactions**
Consistent hover states, focus indicators, and animation timing. Users should develop muscle memory for common patterns. No surprises in how elements behave.

---

## Visual Foundation

### Color System

#### Semantic Approach

Colors communicate meaning, not decoration. The system uses three color categories:

| Category | Purpose | Examples |
|----------|---------|----------|
| **Neutral** | Structure, text, borders | Backgrounds, cards, dividers |
| **Brand** | Identity, primary actions | CTAs, links, focus states |
| **Status** | State communication | Success, warning, error, info |

#### Neutral Palette

A grayscale foundation provides structure without competing for attention.

```
Background:       white (#ffffff) → dark: near-black (#09090b)
Surface:          white → dark: gray-950
Border:           gray-200 → dark: gray-800
Text Primary:     gray-900 → dark: gray-50
Text Secondary:   gray-600 → dark: gray-400
Text Muted:       gray-500 → dark: gray-400
```

#### Brand Colors

A single primary hue with a full scale for flexibility:

```
Primary Family (Blue/Azure):
  50:  Very light tint (backgrounds, highlights)
  100: Light tint (hover backgrounds)
  200: Soft tint (borders on active elements)
  300: Medium light
  400: Medium
  500: Base (primary buttons, links)
  600: Dark (hover states on primary)
  700: Darker (pressed states)
  800: Very dark
  900: Near black (text on light primary backgrounds)
```

#### Status Colors

Each status has a background/text pairing for badges and indicators:

| Status | Background | Text | Use Case |
|--------|------------|------|----------|
| Success | green-100 | green-700 | Completed, verified, positive delta |
| Warning | amber-100 | amber-700 | Pending, attention needed |
| Error | red-100 | red-700 | Failed, blocked, negative delta |
| Info | blue-100 | blue-700 | Informational, neutral highlight |

#### Accent Colors

Optional secondary hues for categorization or visual interest:

- **Violet**: Profile-related, user content
- **Jade/Emerald**: Financial positive, growth
- **Amber**: Warnings, time-sensitive

### Typography

#### Typeface Selection

**Primary Font**: A modern, humanist sans-serif with excellent legibility at small sizes. Examples: Inter, SF Pro, Geist, DM Sans.

**Characteristics to prioritize:**
- Clear distinction between similar characters (I, l, 1)
- Good x-height for readability
- Balanced weight distribution
- Strong number design for data display

#### Type Scale

A restrained scale optimized for data-rich interfaces:

| Size | Use Case | Weight |
|------|----------|--------|
| 12px | Dense data: table cells, badges, captions | Normal (400) |
| 14px | Body text, form labels, navigation | Normal-Medium (400-500) |
| 16px | Card titles, subheadings | Medium-Semibold (500-600) |
| 20px | Page titles, section headers | Semibold (600) |
| 30px | Hero metrics, key numbers | Bold (700) |

#### Weight Usage

| Weight | Name | Application |
|--------|------|-------------|
| 400 | Normal | Body text, descriptions |
| 500 | Medium | Labels, navigation, emphasis |
| 600 | Semibold | Titles, buttons, table headers |
| 700 | Bold | Metrics, key data points |

### Spacing

#### Base Unit

**8px** as the foundational unit. All spacing derives from this:

| Scale | Pixels | Common Use |
|-------|--------|------------|
| 0.5x | 4px | Tight gaps (icon-to-text) |
| 1x | 8px | Small gaps, inline spacing |
| 2x | 16px | Component padding, item gaps |
| 3x | 24px | Section gaps, card padding |
| 4x | 32px | Major section breaks |
| 6x | 48px | Page margins |

#### Rhythm

- **Card internal padding**: 16-24px
- **Gap between cards**: 16-24px
- **Section vertical spacing**: 24-32px
- **List item spacing**: 8-12px

### Shape

#### Border Radius

| Element | Radius | Rationale |
|---------|--------|-----------|
| Buttons | 6-8px (md) | Approachable but not childish |
| Cards | 12-16px (lg/xl) | Soft container definition |
| Badges | 9999px (full) | Pill shape for compact labels |
| Inputs | 6-8px (md) | Match button radius |
| Dialogs | 12-16px (lg) | Match card radius |
| Icons containers | 8px (lg) | Slight rounding |

#### Shadows

Shadows create depth hierarchy. Use sparingly:

| Level | Use | Properties |
|-------|-----|------------|
| None | Flat elements, default state | — |
| SM | Cards, dropdowns | 0 1px 2px rgba(0,0,0,0.05) |
| MD | Hover states, elevated cards | 0 4px 6px rgba(0,0,0,0.1) |
| LG | Dialogs, popovers | 0 10px 15px rgba(0,0,0,0.1) |

---

## Component Language

### Design Primitives

#### Cards

The fundamental container. Cards group related content and create visual boundaries.

**Anatomy:**
- White (or surface color) background
- Light border (gray-200)
- Subtle shadow (sm)
- Rounded corners (lg/xl)
- Consistent internal padding (16-24px)

**States:**
- Default: Subtle border, light shadow
- Hover (interactive): Slightly darker border, increased shadow
- Selected/Active: Brand-colored border, tinted background

**Subcomponents:**
- Header: Title area with optional icon, typically reduced bottom padding
- Content: Main content area
- Footer: Action buttons or metadata

#### Buttons

Three-tier hierarchy communicating action importance:

| Tier | Style | Use |
|------|-------|-----|
| Primary | Solid brand color, white text | Main CTA per section |
| Secondary/Outline | Border, transparent background | Alternative actions |
| Ghost/Tertiary | No border, subtle hover | Minor actions, toolbars |

**Sizing:**
- Small: 32px height, 12px text
- Default: 36px height, 14px text
- Large: 40px height, 16px text
- Icon-only: Square, same heights

**States:** Default → Hover (darken primary, lighten secondary) → Active (pressed) → Disabled (opacity reduction)

#### Badges

Compact status indicators and labels.

**Variants:**
- Semantic (success/warning/error): Soft colored background + darker text
- Neutral: Gray background, dark text
- Outline: Border only, transparent background

**Optional enhancements:**
- Status dot: Small colored circle before text
- Count: Numeric badge for quantities
- Dismissible: Close icon for removable tags

#### Tables

Optimized for scanning dense data.

**Header:**
- Slightly tinted background (gray-50)
- Uppercase or semibold text (12-13px)
- Sticky positioning for long tables

**Rows:**
- Alternating backgrounds optional (subtle: white/gray-50)
- Hover highlight for row selection
- Compact text (12-14px)
- Clear cell boundaries (border or spacing)

**Cell patterns:**
- Numeric data: Right-aligned, monospace optional
- Status: Badge or colored dot
- Actions: Icon buttons, muted hover

#### Tabs

Navigation within a section or view.

**Underline style (preferred):**
- Horizontal row of text buttons
- Active tab has bottom border in brand color
- Inactive tabs have muted text
- Optional icon + text combination

**Container style (alternative):**
- Pill-shaped backgrounds
- Active tab is filled, inactive is ghost

#### Inputs

Form elements for data entry.

**Text inputs:**
- Clear border (gray-200)
- Consistent height with buttons
- Focus: Brand-colored border or ring
- Error: Red border, helper text below

**Specialized:**
- Checkbox: Square with rounded corners, check icon
- Switch/Toggle: Pill-shaped track, circle indicator
- Select: Input-like appearance with dropdown chevron

### Compound Patterns

#### Page Header

Consistent top-of-page structure:

```
[Icon] Section Title | Page Title          [Action Buttons]
```

- Left: Optional icon, breadcrumb-style title
- Right: Primary actions for the page

#### Stat Cards

Metrics displayed prominently in cards:

```
┌─────────────────────────────┐
│ Metric Label        [Icon]  │
│                             │
│ 1,234                       │
│ ▲ +12% vs previous          │
└─────────────────────────────┘
```

- Small label text (muted)
- Large bold number
- Trend indicator with color (green up, red down)
- Optional icon in colored container

#### Split Panel

Two-column layout for list + detail:

```
┌──────────────┬────────────────────────────┐
│ List Panel   │ Detail Panel               │
│              │                            │
│ [Item 1]     │ [Expanded content for      │
│ [Item 2] ◀   │  selected item]            │
│ [Item 3]     │                            │
└──────────────┴────────────────────────────┘
```

#### Empty State

When no content exists:

```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                              │
│      [Illustration]          │
│    No items yet              │
│    [Action Button]           │
│                              │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

- Dashed border indicates placeholder nature
- Centered content
- Optional CTA to resolve the empty state

---

## Layout Principles

### Grid System

Responsive columns based on viewport:

| Breakpoint | Columns | Typical Use |
|------------|---------|-------------|
| Mobile (<640px) | 1 | Stacked full-width |
| Tablet (640-1024px) | 2 | Side-by-side cards |
| Desktop (>1024px) | 3-4 | Dashboard grids |

### Common Layouts

**Dashboard Grid:**
- Top: Page header
- Row 1: 3-4 stat cards
- Row 2: 2 half-width content cards
- Row 3: Full-width table or chart

**Settings Page:**
- Navigation sidebar or tabs
- Form sections with clear labels
- Sticky footer with save/cancel

**List + Detail:**
- Left panel (1/3 width): Scrollable list
- Right panel (2/3 width): Detail view
- Divider between panels

### Responsive Behavior

**Cards:** Stack vertically on mobile, grid on desktop
**Navigation:** Sidebar collapses to hamburger menu on mobile
**Tables:** Horizontal scroll or card-based view on mobile
**Modals:** Full-screen on mobile, centered overlay on desktop

---

## Interaction Design

### State Communication

| State | Visual Treatment |
|-------|-----------------|
| Default | Base styling |
| Hover | Lightened background or darkened border |
| Focus | Brand-colored ring (accessibility) |
| Active/Pressed | Slightly darkened |
| Disabled | Reduced opacity (50-60%), no pointer events |
| Loading | Spinner or skeleton placeholder |
| Selected | Brand-colored background tint or border |

### Transitions

Consistent timing for smoothness without sluggishness:

| Type | Duration | Easing |
|------|----------|--------|
| Color/opacity | 150ms | ease-out |
| Transform (scale, translate) | 200ms | ease-out |
| Enter animations | 200ms | ease-out |
| Exit animations | 150ms | ease-in |

### Focus Management

- Visible focus rings for keyboard navigation
- Logical tab order
- Focus trap in modals
- Skip links for screen readers

---

## Theming

### Light/Dark Mode

The design system supports both themes through CSS variables:

**Strategy:**
- Define all colors as CSS custom properties
- Toggle themes via class on root element
- All components reference variables, not hard-coded colors

**Key inversions:**
- Background: white ↔ near-black
- Text: dark gray ↔ light gray
- Borders: light gray ↔ dark gray
- Shadows: Reduced or adjusted in dark mode
- Brand colors: Slightly adjusted for contrast

### Customization Points

For adapting to different brands:

1. **Primary color family** — Replace the brand hue
2. **Border radius scale** — More rounded or more sharp
3. **Font family** — Swap typeface
4. **Shadow intensity** — Flatter or more elevated
5. **Accent colors** — Additional hues for categorization

---

## Accessibility

### Color Contrast

- Body text: Minimum 4.5:1 against background
- Large text (18px+): Minimum 3:1
- Interactive elements: Clear affordance beyond color alone

### Keyboard Navigation

- All interactive elements focusable
- Logical tab order matching visual order
- Visible focus indicators
- Escape key closes modals/popovers

### Screen Readers

- Semantic HTML elements
- ARIA labels for icon-only buttons
- Live regions for dynamic content
- Proper heading hierarchy

### Motion

- Respect prefers-reduced-motion
- No essential information conveyed only through animation
- Pause/stop controls for auto-playing content

---

## Implementation Guidance

### Technology-Agnostic Recommendations

**CSS Architecture:**
- Use CSS custom properties for theming
- Consider utility-first CSS (Tailwind) or CSS-in-JS
- Layer structure: reset → base → components → utilities

**Component Library:**
- Build on accessible primitives (Radix UI, Headless UI, Reach UI)
- Use variant systems for consistent props (CVA, Stitches, Vanilla Extract)
- Compose small primitives into larger patterns

**State Management:**
- URL-driven state for shareable/bookmarkable views
- Local component state for UI-only concerns
- Minimal global state; avoid over-engineering

### File Organization

```
/components
  /ui          → Primitive components (Button, Card, Input)
  /patterns    → Composed patterns (StatCard, PageHeader)
  /layouts     → Page shells (Sidebar, Topbar)
  /screens     → Full page compositions

/styles
  /tokens      → Design tokens (colors, spacing, typography)
  /base        → Global styles, CSS reset
```

### Naming Conventions

**Components:** PascalCase (Button, StatCard)
**Variants:** camelCase props (variant="primary", size="sm")
**CSS classes:** kebab-case or utility syntax
**Tokens:** Semantic names (--color-primary, --spacing-md)

---

## Quick Reference

### Spacing Scale
`4 / 8 / 16 / 24 / 32 / 48`

### Type Scale
`12 / 14 / 16 / 20 / 30`

### Border Radius
`6 (sm) / 8 (md) / 12 (lg) / 16 (xl) / 9999 (full)`

### Color Usage
- **Brand** → Primary CTAs only
- **Green** → Success, positive
- **Red** → Error, negative
- **Amber** → Warning, pending
- **Gray** → Everything else

### Button Hierarchy
1. Solid (primary)
2. Outline (secondary)
3. Ghost (tertiary)

### Card Anatomy
Header (title + icon) → Content (main) → Footer (actions)

---

*This specification is framework-agnostic and can be implemented with any modern frontend stack. The principles and patterns described create a cohesive, professional interface suitable for data-rich applications.*
