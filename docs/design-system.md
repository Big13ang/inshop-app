# InShop Design System

Persian-first (RTL), mobile-optimized marketplace app.  
Stack: Next.js 15 · Tailwind CSS v4 · Vazirmatn variable font · React Compiler.

---

## Color Tokens

All tokens live in `app/globals.css` inside `@theme`. Use the Tailwind class name, never raw hex.

### Base

| Token (CSS var)        | Tailwind class         | Value     | Use                              |
|------------------------|------------------------|-----------|----------------------------------|
| `--color-foreground`   | `text-foreground`      | `#171717` | Body text, headings              |
| `--color-secondary`    | `text-secondary`       | `#5e5e5e` | Subtext, captions, descriptions  |
| `--color-background`   | `bg-background`        | `#ffffff` | Root page background             |
| `--color-outline`      | `border-outline`       | `#cfc4c5` | Dividers, input borders          |

### Brand

| Token                  | Tailwind class         | Value     | Use                              |
|------------------------|------------------------|-----------|----------------------------------|
| `--color-primary`      | `bg-primary`           | `#000000` | Primary buttons, key actions     |
| `--color-on-primary`   | `text-on-primary`      | `#ffffff` | Text on primary backgrounds      |
| `--color-error`        | `bg-error` / `text-error` | `#ba1a1a` | Destructive actions, errors   |

### Surface Hierarchy

Surfaces stack light-to-lighter. Never use a deeper surface on top of a shallower one.

| Token                    | Tailwind class      | Value     | Use                              |
|--------------------------|---------------------|-----------|----------------------------------|
| `--color-surface-l1`     | `bg-surface-l1`     | `#f4f4f5` | Main app background              |
| `--color-surface-l2`     | `bg-surface-l2`     | `#fafafa` | Auth screens, secondary regions  |
| `--color-surface-l3`     | `bg-surface-l3`     | `#ffffff` | Cards, modals, headers           |

### Container (Interactive Elements)

Used for backgrounds of tappable containers (chips, cells, ghost buttons).

| Token                       | Tailwind class            | Value     | Trigger   |
|-----------------------------|---------------------------|-----------|-----------|
| `--color-container-base`    | `bg-container-base`       | `#f3f3f4` | Rest      |
| `--color-container-hover`   | `bg-container-hover`      | `#e8e8e8` | Hover     |
| `--color-container-active`  | `bg-container-active`     | `#e2e2e2` | Pressed   |

---

## Typography

### Fonts

| Token             | Tailwind class    | Family           | Use                              |
|-------------------|-------------------|------------------|----------------------------------|
| `--font-sans`     | `font-sans`       | Vazirmatn        | All UI text (default)            |
| `--font-rounded`  | `font-rounded`    | Outfit           | Decorative / Latin headings      |
| `--font-logo`     | `font-logo`       | Playfair Display | Brand wordmark only              |

Vazirmatn is a **variable font** (weight 100–900). Use `font-{weight}` freely — no extra font files load.

### Type Scale

Use these size steps consistently. Never use `text-[11px]` or other arbitrary sizes except for micro-labels.

| Step         | Tailwind class   | Size  | Weight      | Use                                  |
|--------------|------------------|-------|-------------|--------------------------------------|
| Display      | `text-3xl`       | 30px  | `font-bold` | Hero headings                        |
| Title        | `text-xl`        | 20px  | `font-bold` | Sheet / modal titles                 |
| Headline     | `text-lg`        | 18px  | `font-bold` | Section headings                     |
| Body Large   | `text-[15px]`    | 15px  | `font-medium` | Primary body, descriptions         |
| Body         | `text-sm`        | 14px  | `font-normal` | Default body, button labels        |
| Caption      | `text-xs`        | 12px  | `font-medium` | Timestamps, counts, micro-labels   |

**Rule:** body copy never goes below `text-sm` (14px). Use `text-xs` only for non-critical metadata.

### Line Height

- Body / descriptions: `leading-relaxed` (1.625)
- Headings: `leading-snug` (1.375)
- Single-line UI labels: `leading-none`

---

## Spacing

8dp grid. Every padding, gap, and margin should be a multiple of 4 (prefer multiples of 8).

| Token  | Value | Common use                                 |
|--------|-------|--------------------------------------------|
| `p-2`  | 8px   | Icon padding, tight internal spacing       |
| `p-3`  | 12px  | Chip padding, compact list items           |
| `p-4`  | 16px  | Standard internal component padding        |
| `p-5`  | 20px  | Section padding (tight)                    |
| `p-6`  | 24px  | Standard screen edge padding               |
| `p-8`  | 32px  | Generous section spacing                   |
| `p-10` | 40px  | Bottom safe-area buffer (above home bar)   |

**Screen edge:** always `px-4` (min) or `px-6` (standard). Never `px-3` or `px-5` for full-bleed sections.

---

## Border Radius

Defined as CSS vars in `@theme`; reference via Tailwind's `rounded-*` utilities.

| Token              | Value  | Tailwind equivalent | Use                           |
|--------------------|--------|---------------------|-------------------------------|
| `--radius-chip`    | 8px    | `rounded-lg`        | Tags, badges, small pills     |
| `--radius-input`   | 12px   | `rounded-xl`        | Inputs, small buttons         |
| `--radius-card`    | 16px   | `rounded-2xl`       | Buttons xl, medium cards      |
| `--radius-panel`   | 24px   | `rounded-3xl`       | Large cards                   |
| `--radius-sheet`   | 28px   | `rounded-[28px]`    | Bottom sheets, modals         |
| `--radius-pill`    | 9999px | `rounded-full`      | Avatars, pill badges          |

---

## Elevation (Shadows)

Defined as CSS vars. Use the semantic name, not raw `shadow-[...]` values.

| Token              | Value                                                     | Use                          |
|--------------------|-----------------------------------------------------------|------------------------------|
| `--shadow-raised`  | `0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)`  | Subtle card lift             |
| `--shadow-float`   | `0 4px 16px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04)` | Floating elements, tooltips  |
| `--shadow-sheet`   | `0 8px 30px rgba(0,0,0,.12)`                              | Bottom drawer / dialog       |
| `--shadow-modal`   | `0 20px 50px rgba(0,0,0,.20)`                             | Centered modal, BottomSheet  |

Usage: `shadow-[var(--shadow-float)]` or define Tailwind aliases as needed.

---

## Motion System

### Duration Tokens

| Token                | Value  | Use                                        |
|----------------------|--------|--------------------------------------------|
| `--duration-instant` | 80ms   | Press-down phase of tap interactions       |
| `--duration-fast`    | 150ms  | Color swaps, hover states, opacity changes |
| `--duration-normal`  | 220ms  | Appear / disappear, slide-in, fade         |
| `--duration-slow`    | 350ms  | Complex multi-property transitions         |

In Tailwind: `duration-[var(--duration-normal)]` or use the token directly in custom CSS.

### Easing Tokens

| Token               | Curve                            | Feel                               | Use                       |
|---------------------|----------------------------------|------------------------------------|---------------------------|
| `--ease-spring`     | `cubic-bezier(0.34,1.56,0.64,1)` | Overshoots then settles — alive    | Release from press        |
| `--ease-out-smooth` | `cubic-bezier(0.16,1,0.3,1)`    | Quick start, smooth decelerate     | Enter animations          |
| `--ease-in-smooth`  | `cubic-bezier(0.7,0,0.84,0)`    | Slow start, sharp exit             | Exit animations           |
| `--ease-standard`   | `cubic-bezier(0.4,0,0.2,1)`     | Material standard                  | General state transitions |

### Keyframe Animations

| Token                 | Class              | Duration | Use                                      |
|-----------------------|--------------------|----------|------------------------------------------|
| `--animate-fade-in`   | `animate-fade-in`  | 220ms    | Mounting UI elements                     |
| `--animate-slide-up`  | `animate-slide-up` | 220ms    | Content entering from below              |
| `--animate-pop-in`    | `animate-pop-in`   | 280ms    | Confirmation icons, success states       |
| `--animate-shimmer`   | `animate-shimmer`  | 1.6s     | Skeleton loaders                         |
| `--animate-heart-pop` | `animate-heart-pop`| 1s       | Like / reaction animations               |

---

## Micro-Interactions

This is the core of the premium feel. Every tappable element must respond immediately and spring back.

### The Two-Phase Tap

```
PRESS   → 80ms ease-out   → scale down  (snappy, immediate — finger lands)
RELEASE → 220ms spring    → scale back  (overshoot + settle — feels alive)
```

The spring overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`) is what makes the UI feel physical, not flat.

### Utility Classes

Add these classes to tappable elements. They are defined in `globals.css` and require no Tailwind config.

#### `.tap` — Icon buttons, chips, small interactive elements

```html
<button class="tap ...">...</button>
```
- Press: `scale(0.93)` + `opacity 0.8` in 80ms
- Release: springs back to `scale(1)` in 220ms with overshoot

#### `.tap-cta` — Large CTA buttons, xl size buttons

```html
<button class="tap-cta ...">...</button>
```
- Press: `scale(0.97)` in 80ms (gentle — large targets need less travel)
- Release: springs back in 220ms

> **Already wired** into `Button` `size="xl"`. You don't need to add it to xl buttons manually.

#### `.tap-card` — List rows, gallery cells, tappable cards

```html
<div class="tap-card ...">...</div>
```
- Press: `scale(0.984)` in 80ms (very subtle — content cards shouldn't jump)
- Release: springs back in 220ms

### When to Use Each

| Element                      | Class       |
|------------------------------|-------------|
| Icon button                  | `tap`       |
| Chip / tag (tappable)        | `tap`       |
| xl Button (CTA)              | `tap-cta` ← already in `size="xl"` |
| Small/default Button         | handled by `active:translate-y-px` in base |
| Gallery cell                 | `tap-card`  |
| List row / menu item         | `tap-card`  |
| Post card                    | `tap-card`  |
| Bottom sheet / drawer handle | handled by GSAP in BottomSheet |

---

## Component Conventions

### Button

```tsx
// Small UI action
<Button variant="secondary" size="sm">لغو</Button>

// Standard action
<Button variant="default">تایید</Button>

// Full-width CTA (gets tap-cta spring automatically)
<Button variant="filled" size="xl">ارسال پست</Button>

// Destructive (tinted — for secondary destructive in menus)
<Button variant="destructive">حذف</Button>

// Destructive CTA (confirm-delete)
<Button variant="destructive" size="xl" className="flex-1">حذف</Button>
```

**Variants at a glance:**

| Variant        | Background          | Text           | Use                              |
|----------------|---------------------|----------------|----------------------------------|
| `default`      | Black               | White          | Primary actions                  |
| `filled`       | `zinc-950`          | White          | Strong CTA                       |
| `secondary`    | `container-base`    | Foreground     | Cancel / secondary actions       |
| `outline`      | Transparent         | Foreground     | Tertiary, ghost with border      |
| `ghost`        | Transparent (hover) | Foreground     | Toolbar / icon-adjacent labels   |
| `destructive`  | `error/10` (tint)   | `error` red    | Menu-level destructive options   |
| `link`         | None                | Primary        | Inline text links                |

**Sizes:**

| Size    | Height | Use                               |
|---------|--------|-----------------------------------|
| `xs`    | 24px   | Dense lists, badges               |
| `sm`    | 28px   | Compact UI rows                   |
| `default` | 32px | Standard toolbar/card actions     |
| `lg`    | 36px   | Slightly prominent actions        |
| `xl`    | 56px   | Full-width CTAs, sheet actions    |
| `icon`  | 32px   | Square icon-only buttons          |

### Dialog (Drawer variant)

The primary modal pattern for mobile. Always use `variant="drawer"`.

```tsx
<Dialog.Root isOpen={open} onClose={onClose}>
  <Dialog.Portal>           {/* createPortal → escapes overflow containers */}
    <Dialog.Backdrop />     {/* black/60 backdrop, animates opacity */}
    <Dialog.Content variant="drawer" className="pt-2">
      {/* drag handle is auto-rendered */}

      <div className="px-6 pt-4 pb-7 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-foreground leading-snug">عنوان</h2>
        <p className="mt-3 text-[15px] text-secondary leading-relaxed">توضیحات</p>
      </div>

      <div className="flex gap-3 px-6 pb-10" dir="rtl">
        <Button variant="secondary" size="xl" className="flex-1" onClick={onClose}>انصراف</Button>
        <Button size="xl" className="flex-1 bg-error text-white" onClick={onConfirm}>تأیید</Button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Spacing rules:**
- Horizontal padding: `px-6` (24px)
- Title area bottom: `pb-7` (28px) — generous air before buttons
- Button row bottom: `pb-10` (40px) — clears the home indicator bar
- Two-button rows: `flex gap-3` + `flex-1` on each button

### BottomSheet

Use for more complex content (multi-row menus, option lists with icons). Uses `createPortal` and GSAP.

```tsx
<BottomSheet.Root isOpen={open} onClose={onClose}>
  <BottomSheet.Overlay />
  <BottomSheet.Panel>
    <BottomSheet.Handle />
    <BottomSheet.Header>
      <div className="flex-1">
        <BottomSheet.Title>عنوان</BottomSheet.Title>
        <BottomSheet.Description>توضیحات اختیاری</BottomSheet.Description>
      </div>
      <BottomSheet.Close />
    </BottomSheet.Header>
    <BottomSheet.Content>
      {/* scrollable rows go here */}
    </BottomSheet.Content>
    <BottomSheet.Footer>
      {/* action buttons */}
    </BottomSheet.Footer>
  </BottomSheet.Panel>
</BottomSheet.Root>
```

**Dialog vs BottomSheet — when to use which:**

| Situation                                  | Use            |
|--------------------------------------------|----------------|
| Simple confirm / alert (≤ 2 actions)       | `Dialog`       |
| Option menu with icons / rows              | `BottomSheet`  |
| Form inside a sheet                        | `BottomSheet`  |
| Single destructive confirmation            | `Dialog`       |

---

## RTL Rules

This app is RTL by default. Follow these rules:

1. **`dir="rtl"` on content containers**, not on the root. The `Dialog.Content` is `text-right font-sans` already.
2. **Flex row order is reversed in RTL.** In a `flex` row with `dir="rtl"`, the first child renders on the right. Put the primary action last in JSX so it appears on the left (the natural action position in Persian).
3. **Lucide icons don't auto-mirror.** If an icon implies direction (chevron, arrow), manually flip with `scale-x-[-1]` for RTL.
4. **`gap-*` not `space-x-*`** — spacing utilities are direction-aware in `gap` but not in `space-x`.

---

## Z-Index Scale

| Value      | Use                               |
|------------|-----------------------------------|
| `z-0`      | Default stacking                  |
| `z-10`     | Sticky headers / tab bars         |
| `z-20`     | Floating action buttons           |
| `z-40`     | Overlapping cards / tooltips      |
| `z-[100]`  | Dialog / BottomSheet backdrop     |
| `z-50`     | BottomSheet panel (via portal)    |
