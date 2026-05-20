# 🎨 RozgarSync Enterprise Design System

## Overview

Professional, accessible, production-ready design system built with Tailwind CSS and advanced CSS patterns.

---

## 📊 Color Palette

### Primary Brand
- **Brand 500**: `#22C55E` — Main action, CTAs, primary elements
- **Brand 400**: `#4ADE80` — Hover states, lighter emphasis
- **Brand 600**: `#16A34A` — Active/pressed states
- **Brand 700-900**: Dark variants for text, borders

### Semantic Colors
- **Success**: `#10B981` — Confirmations, positive states
- **Warning**: `#F59E0B` — Alerts, caution, pending
- **Error**: `#EF4444` — Destructive, critical alerts
- **Info**: `#3B82F6` — Information, secondary actions

### Surface & Background
- **Dark 950**: Base background (darkest)
- **Dark 900**: Cards, elevated surfaces
- **Dark 800**: Subtle surfaces, hover states
- **Surface Border**: Subtle borders with transparency

---

## 🔤 Typography

### Font Stack
- **Display**: Outfit (headlines, h1-h6)
- **Sans**: Inter (body text, UI)
- **Mono**: JetBrains Mono / Fira Code (code blocks)
- **Urdu**: Noto Nastaliq (RTL support)

### Font Sizes
```
2xs: 0.625rem (10px)
xs:  0.75rem  (12px)
sm:  0.875rem (14px)
base: 1rem    (16px)
lg:  1.125rem (18px)
xl:  1.25rem  (20px)
2xl: 1.5rem   (24px)
3xl: 1.875rem (30px)
4xl: 2.25rem  (36px)
5xl: 3rem     (48px)
6xl: 3.75rem  (60px)
```

### Font Weights
- **300**: Light (fine details, secondary text)
- **400**: Normal (body copy)
- **500**: Medium (emphasis, labels)
- **600**: Semibold (sub-headings, buttons)
- **700**: Bold (headings)
- **800-900**: Extra-bold, Black (display)

---

## ✨ Component Patterns

### Cards

**Basic Card**
```html
<div class="card p-6">
  <h3 class="text-lg font-bold">Title</h3>
  <p class="text-sm text-dark-400">Content</p>
</div>
```

**Elevated Card**
```html
<div class="card-elevated p-6">Elevated content</div>
```

**Interactive Card**
```html
<div class="card-interactive hover:shadow-lg">Clickable card</div>
```

**Glass Card (Premium)**
```html
<div class="glass-premium p-6">Premium glassmorphism</div>
```

### Buttons

**Primary Button**
```html
<button class="btn btn-primary">Action</button>
```

**Secondary Button**
```html
<button class="btn btn-secondary">Secondary</button>
```

**Outline Button**
```html
<button class="btn btn-outline">Outline</button>
```

**Ghost Button**
```html
<button class="btn btn-ghost">Ghost</button>
```

**Sizes**: `btn-sm`, `btn-lg` (normal is default)

### Badges

```html
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
<span class="badge badge-neutral">Neutral</span>
```

### Alerts

```html
<div class="alert alert-success">✓ Success message</div>
<div class="alert alert-warning">⚠️ Warning message</div>
<div class="alert alert-error">✕ Error message</div>
<div class="alert alert-info">ℹ️ Info message</div>
```

---

## 🎭 Effects & Animations

### Glassmorphism
```html
<div class="glass p-6">Blurred glass effect</div>
<div class="glass-premium">Premium glassmorphic card</div>
```

### Gradients
```html
<div class="gradient-text">Gradient text effect</div>
<div class="bg-gradient-brand p-8">Brand gradient background</div>
```

### Glow Effects
```html
<div class="glow-effect">Soft glow</div>
<div class="glow-effect-lg">Strong glow</div>
<div class="neon-text">Neon glowing text</div>
```

### Background Patterns
```html
<div class="mesh-bg">Mesh gradient pattern</div>
<div class="grid-pattern">Grid dot pattern</div>
<div class="mesh-bg-alt">Alt mesh pattern</div>
```

---

## 🎬 Animations

### Entrance Animations
- `animate-fade-in` — Fade in (0.5s)
- `animate-fade-up` — Fade + slide up (0.6s)
- `animate-fade-down` — Fade + slide down (0.6s)
- `animate-slide-in-right` — Slide from right (0.4s)
- `animate-slide-in-left` — Slide from left (0.4s)
- `animate-scale-up` — Scale up entrance (0.3s)
- `animate-blur-in` — Blur entrance (0.6s)

### Loop Animations
- `animate-float` — Gentle floating (6s)
- `animate-float-slow` — Slower floating (8s)
- `animate-breathe` — Breathing pulse (3s)
- `animate-glow` — Glow pulsing (2s)
- `animate-spin-slow` — Slow rotation (20s)
- `animate-scale-pulse` — Scale pulse (2s)

### Interactive Animations
- `animate-bounce-in` — Bounce entrance (0.6s)
- `animate-bounce-out` — Bounce exit (0.6s)
- `animate-rotate-in` — Rotate entrance (0.5s)

### Timing
- `duration-fast` (150ms)
- `duration-base` (250ms)
- `duration-slow` (400ms)
- `duration-slower` (600ms)

---

## 🎯 Shadows

### Elevation Hierarchy
```
shadow-xs  — Subtle lift
shadow-sm  — Light elevation
shadow-md  — Medium elevation
shadow-lg  — Strong elevation
shadow-xl  — Maximum elevation

shadow-brand-soft  — Brand colored soft shadow
shadow-brand-md    — Brand medium shadow
shadow-brand-lg    — Brand strong shadow

shadow-glow        — Brand glow effect
shadow-glow-lg     — Strong brand glow
```

---

## 🔲 Border Radius

```
rounded-sm   — 0.375rem (6px)
rounded-md   — 0.5rem   (8px)
rounded-lg   — 0.75rem  (12px)
rounded-xl   — 1rem     (16px)
rounded-2xl  — 1.5rem   (24px)
rounded-3xl  — 2rem     (32px)
rounded-full — 9999px
```

**Use Cases**:
- Buttons: `rounded-lg`
- Cards: `rounded-2xl`
- Inputs: `rounded-lg`
- Avatars: `rounded-full`

---

## 📐 Spacing Scale

Consistent 4px base:
```
px/py-1  → 0.25rem (4px)
px/py-2  → 0.5rem  (8px)
px/py-3  → 0.75rem (12px)
px/py-4  → 1rem    (16px)
px/py-6  → 1.5rem  (24px)
px/py-8  → 2rem    (32px)
```

**Layout Containers**:
- `.section-container` — Max 7xl with standard padding
- `.section-small` — Max 2xl for focused content
- `.section-large` — Full width with padding

---

## ♿ Accessibility

### Focus States
- All interactive elements have brand-colored focus ring
- `.focus-ring` utility for standard focus styling
- Keyboard navigation fully supported

### Semantic Colors
- Color is not the only indicator (use icons/text too)
- High contrast text on backgrounds
- `sr-only` class for screen-reader-only content

### Motion Preferences
- `motion-reduce` respects `prefers-reduced-motion`
- No auto-playing animations for users with motion sensitivity

---

## 🌍 Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
```html
<div class="text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```

### Visibility Utilities
- `hidden-sm` — Hidden on small screens
- `hidden-md` — Hidden on medium screens
- `hidden-lg` — Hidden on large screens

---

## 🎨 Real-World Examples

### Dashboard Hero
```html
<div class="bg-dark-950 mesh-bg relative min-h-screen">
  <div class="section-container py-20 relative z-10">
    <h1 class="gradient-text text-5xl font-bold mb-4">Agent Command Center</h1>
    <p class="text-dark-300 text-lg mb-8">Autonomous orchestration</p>
    <button class="btn btn-primary shadow-brand-lg">Get Started</button>
  </div>
</div>
```

### Premium Card Grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="glass-premium p-6 group hover:border-brand-500/50 transition-colors">
    <h3 class="text-lg font-bold mb-2">Feature</h3>
    <p class="text-dark-400">Description</p>
  </div>
</div>
```

### Interactive Agent Status
```html
<div class="card-interactive p-6 border border-dark-800 hover:border-brand-500/30">
  <div class="flex items-center justify-between mb-4">
    <h3 class="font-bold">Agent Name</h3>
    <span class="badge badge-success animate-pulse">Active</span>
  </div>
  <div class="glow-effect p-4 rounded-lg bg-dark-800">
    Status indicator
  </div>
</div>
```

### Terminal/Code Block
```html
<div class="terminal">
  <code>$ rozgarsync --orchestrate</code>
</div>
```

---

## 🚀 Performance Tips

1. **Use CSS variables** for theme consistency
2. **Lazy-load animations** for off-screen elements
3. **Prefer CSS over JavaScript** for transitions
4. **Use `will-change`** sparingly for animations
5. **Test on real devices** for animation smoothness

---

## 📝 CSS Custom Properties

All available as CSS variables:
- `--brand-primary`, `--brand-light`, `--brand-glow`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--surface-bg`, `--surface-card`, `--surface-border`
- `--transition-fast`, `--transition-base`, `--transition-slow`
- `--radius-sm` through `--radius-full`
- `--z-dropdown` through `--z-tooltip`

---

## 🎯 Best Practices

✅ **Do**:
- Use semantic color names (success, warning, error)
- Maintain consistent spacing rhythm
- Test focus states for accessibility
- Use motion-reduce for respecting user preferences
- Keep animations under 600ms

❌ **Don't**:
- Mix multiple font families unnecessarily
- Use animations for all interactions
- Forget focus/hover/active states
- Rely on color alone for meaning
- Add animations that distract from content

---

**Last Updated**: 2026-05-20
