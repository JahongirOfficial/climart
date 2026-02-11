# ERP Dashboard Style Guide

This document outlines the strict styling rules applied to the ERP dashboard interface for a stable, professional enterprise software experience.

## Border Radius Rules

- **Cards**: 4px (`border-radius: 4px`)
- **Buttons**: 3px (`border-radius: 3px`)
- **Inputs**: 3px (`border-radius: 3px`)
- **NO rounded pill shapes**
- **NO fully rounded corners**

## Spacing & Layout

- Use strict 12-column grid system
- Apply consistent padding and margins
- Prevent overlapping components
- Disable floating cards
- No overlapping shadows

## Hover Behavior Rules

### ❌ DO NOT:
- Scale elements on hover
- Move elements on hover
- Change layout size
- Increase padding on hover
- Animate position
- Add glow effects

### ✅ ALLOW ONLY:
- Background color change (subtle)
- Border color change
- Shadow slight increase
- Text color change
- Cursor pointer

### Hover Example:
```css
/* Normal state */
background: white;
border: light gray;

/* Hover state */
background: #F3F6FA;
border: blue accent;
shadow: subtle elevation;
```

## Cards Behavior

- Use fixed card height
- Prevent content overflow
- Enable text truncation
- Use consistent card sizes
- No auto expand on hover
- Apply `.erp-card` class for consistent styling

## Tables Behavior

- Sticky header enabled (`.erp-table-header`)
- Row hover only color highlight
- No row movement
- No shadow popups
- Apply `.erp-table-row` class for rows

## Buttons Behavior

- Rectangular shape (3px border-radius)
- No bounce animation
- No scale animation
- Hover: only color shade change
- Apply `.erp-button` and `.no-scale` classes

## Dropdowns & Modals

- Use fixed z-index layering system:
  - Dropdowns: `z-index: 1000` (`.erp-z-dropdown`)
  - Modals: `z-index: 2000` (`.erp-z-modal`)
  - Tooltips: `z-index: 3000` (`.erp-z-tooltip`)
- Prevent overlapping conflicts
- Backdrop blur disabled
- Solid background overlay (`.erp-modal-backdrop`)

## Animation Rules

- Disable fancy animations
- Only allow fade-in (150ms)
- Ease-in-out only
- No scale, bounce, or movement animations
- All transforms disabled on hover/focus/active

## Performance UI Style

- Fast rendering look
- Business enterprise software feel
- Stable interface behavior
- Minimal animation overhead

## CSS Classes Reference

### Utility Classes

- `.erp-card` - Standard card styling with hover behavior
- `.erp-button` - Button styling with 3px radius
- `.erp-input` - Input field styling with 3px radius
- `.erp-table-row` - Table row with hover behavior
- `.erp-table-header` - Sticky table header
- `.erp-hover-bg` - Applies #F3F6FA background on hover
- `.erp-hover-border` - Applies blue border on hover
- `.no-scale` - Prevents any scale transforms
- `.erp-truncate` - Text truncation for cards
- `.erp-z-dropdown` - z-index for dropdowns (1000)
- `.erp-z-modal` - z-index for modals (2000)
- `.erp-z-tooltip` - z-index for tooltips (3000)
- `.erp-modal-backdrop` - Modal backdrop without blur

## Component Implementation

### Cards
```tsx
<div className="erp-card p-6 no-scale">
  {/* Card content */}
</div>
```

### Buttons
```tsx
<Button className="erp-button no-scale">
  Click me
</Button>
```

### Tables
```tsx
<table>
  <thead className="erp-table-header">
    {/* Header rows */}
  </thead>
  <tbody>
    <tr className="erp-table-row">
      {/* Table cells */}
    </tr>
  </tbody>
</table>
```

### Inputs
```tsx
<input className="erp-input" />
```

## Color Palette

- **Hover Background**: `#F3F6FA`
- **Primary**: `hsl(211 90% 51%)`
- **Border**: `hsl(0 0% 92%)`
- **Success**: `hsl(145 64% 49%)`
- **Warning**: `hsl(38 92% 50%)`
- **Destructive**: `hsl(0 84.2% 60.2%)`

## Transition Standards

All transitions use:
- **Duration**: 150ms
- **Timing**: ease-in-out
- **Properties**: color, background-color, border-color, opacity, box-shadow only

## Notes

- All components in `client/components/ui/` have been updated to follow these rules
- Global styles are defined in `client/global.css`
- Tailwind config updated in `tailwind.config.ts`
- Always use the utility classes for consistency
- Avoid inline styles unless absolutely necessary for dynamic values
