# Romantic Light Design System

## Brand Direction
A romantic social UI inspired by Tinder velocity, Instagram softness, and Bumble clarity.

- Mood: warm, elevated, approachable
- Core principle: emotional but readable
- Surface language: bright layers, soft borders, depth through shadows not darkness

## Color Tokens
Use these tokens from global CSS variables.

- `--ds-bg`: `#fff7fb` (blush white canvas)
- `--ds-bg-alt`: `#fff1f7` (soft pink layer)
- `--ds-surface`: `#ffffff` (primary cards)
- `--ds-surface-soft`: `#fff8fc` (secondary cards)
- `--ds-stroke`: `rgba(234, 180, 209, 0.46)`
- `--ds-stroke-strong`: `rgba(223, 158, 196, 0.62)`
- `--ds-text`: `#3f2a47`
- `--ds-text-muted`: `#7d638a`
- `--ds-heading`: `#2f1838`
- `--ds-primary`: `#ef5f99`
- `--ds-primary-strong`: `#dd3e82`
- `--ds-secondary`: `#b69add` (lavender)

## Typography
- Headings: `DM Serif Display`
- UI/Body: `Plus Jakarta Sans`
- Scale:
  - H1: 40-56
  - H2: 28-36
  - H3: 22-28
  - Body: 14-16
  - Caption: 12-13

## Spacing
8pt baseline rhythm.

- XS: 4
- SM: 8
- MD: 12
- LG: 16
- XL: 24
- 2XL: 32
- 3XL: 48

Use larger vertical rhythm in feed-like surfaces and tighter spacing only in utility controls.

## Surfaces and Cards
- Default card: white to blush gradient with soft border and medium shadow
- Hover card: stronger stroke + larger shadow + slight lift (`translateY(-2px)`)
- Rounded corners:
  - large containers: 24-32
  - cards: 16-24
  - chips/buttons: full rounded

## Buttons
- Primary: pink gradient, white text, soft glow shadow
- Secondary: white surface, rose border, dark rose text
- Accent (secondary action): lavender gradient
- Motion:
  - hover: slight lift + saturation boost
  - active: subtle scale down

## Motion
Use meaningful motion only.

- Entry duration: `0.5s - 0.6s`
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Pattern:
  - page/shell: fade + slide up
  - cards in lists: stagger fade
  - CTA: gentle hover lift

## Hover and Focus
- Hover: `translateY(-2px)` and soft shadow growth
- Focus: 4px soft pink ring with high contrast border
- Keep interactions visible but calm

## Component Mapping
- `.card`, `.card-premium`, `.glass-panel`, `.swipe-card` use romantic surface styling
- `.btn-primary`, `.btn-action-like`, `.btn-like` share primary CTA style
- `.btn-secondary`, `.btn-action-pass`, `.btn-pass` share secondary style
- `.btn-action-super`, `.btn-super-like` use lavender accent style
- `.bg-premium-gradient` now uses blush + lavender atmospheric background

## Accessibility
- Maintain minimum contrast with `--ds-text` on all light surfaces
- Avoid pure low-opacity text for body copy
- Preserve visible keyboard focus on all interactive controls

## Product Feel Checklist
- Tinder: clear CTA hierarchy and fast scan of profile cards
- Instagram: airy spacing, polished card surfaces, visual softness
- Bumble: conversational warmth and approachable tone
