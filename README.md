# Bolly Landing Page — WordPress + Elementor + Three.js

This package replicates the reference screenshot (hero section: logo, pill nav,
"Knock Out Flakes" headline, interactive 3D shampoo bottle, and the
"Journey in to the wonderful world of shampoo" side copy) and adds a
draggable Three.js 3D bottle in place of the static product photo.

## Live Demo
https://bolly-knock-out-flakes-landing.vercel.app/

## YouTube Demo
https://www.youtube.com/watch?v=PlNpEoWD3eg

## What's in this folder

```
bolly-landing/
├── index.html                 → standalone preview (open directly in a browser)
├── assets/css/style.css       → all custom CSS (paste into Elementor Custom CSS)
├── assets/js/bottle-3d.js     → the interactive 3D bottle (Three.js)
└── README.md                  → this file
```

Open `index.html` in any browser to see/test the page and the 3D bottle
before wiring it into WordPress.

---

## 1. WordPress setup

1. Install WordPress + the **Elementor** plugin (free version is enough;
   Elementor Pro just gives nicer nav/theme-builder UI).
2. Install **Google Fonts** — either via a plugin (e.g. "OMGF") or by
   keeping the `<link>` tags from `index.html`'s `<head>` (Archivo Black,
   Inter, Playfair Display).
3. Create a new Page → "Home" → Edit with Elementor.

## 2. Elementor section structure

Build the hero as **one full-width Section** with the class `bolly-hero`
(Advanced tab → CSS Classes), containing:

```
Section: bolly-hero  (Content Width: Full Width, Padding: 0)
│
├── Row 1 — Nav (Columns: 20% / 60% / 20%)
│     ├── Col A → Text widget: "bolly"  (class: bolly-logo)
│     ├── Col B → Nav Menu widget (Elementor Pro) OR 4x Button widgets
│     │            wrapped in an Inner Section (class: bolly-nav-pill)
│     └── Col C → Text "Cart" + Icon Button (class: bolly-cart-btn)
│
└── Row 2 — Hero grid (Columns: 30% / 40% / 30%, vertically centered)
      ├── Col 1 (bolly-hero-copy)
      │     ├── Inner row: eyebrow text "FROM ROOT" + Text badge "TO SHINE"
      │     │              (badge class: badge, wrapped span class: bolly-eyebrow)
      │     └── Heading widget "Knock Out Flakes" (class: bolly-headline,
      │              use <br> between the 3 words or 3 stacked Heading widgets)
      │
      ├── Col 2 (bolly-bottle-stage)
      │     └── HTML widget → paste:
      │         <div id="bolly-bottle-canvas" style="width:100%;height:560px;"></div>
      │         <span class="bolly-drag-hint">Drag to rotate</span>
      │
      └── Col 3 (bolly-side-copy)
            ├── Text widget: 'Journey in to the <em>wonderful</em> world of shampoo'
            │    (enable "Text is HTML" or use the HTML widget so <em> renders)
            └── Inner section (bolly-cta-row):
                  ├── Button widget "EXPLORE MORE" (class: bolly-btn-explore)
                  └── Icon Button, arrow icon (class: bolly-arrow-btn)
```

Give each column/row the exact class names shown in parentheses — the
CSS in `assets/css/style.css` targets those classes directly, so no
Elementor styling panel work is required beyond assigning classes.

## 3. Adding the CSS

**Elementor menu → Site Settings → Custom CSS** (Pro), or
**Appearance → Customize → Additional CSS** (free) → paste the entire
contents of `assets/css/style.css`.

If you're using a child theme instead, enqueue it properly:

```php
function bolly_enqueue_assets() {
    wp_enqueue_style( 'bolly-style', get_stylesheet_directory_uri() . '/assets/css/style.css' );
    wp_enqueue_script( 'three-js', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js', [], null, true );
    wp_enqueue_script( 'bolly-bottle', get_stylesheet_directory_uri() . '/assets/js/bottle-3d.js', ['three-js'], null, true );
}
add_action( 'wp_enqueue_scripts', 'bolly_enqueue_assets' );
```

Also add `bolly-page` as a body class (functions.php):

```php
add_filter( 'body_class', function( $classes ) {
    if ( is_front_page() ) $classes[] = 'bolly-page';
    return $classes;
});
```

## 4. Adding the 3D bottle

1. Drop an **HTML widget** into the center hero column with:
   ```html
   <div id="bolly-bottle-canvas" style="width:100%;height:560px;"></div>
   <span class="bolly-drag-hint">Drag to rotate</span>
   ```
2. Make sure `three.min.js` loads **before** `bottle-3d.js` (handled by
   the `wp_enqueue_script` dependency array above, or by script order in
   `index.html`).
3. `bottle-3d.js` auto-initializes on `DOMContentLoaded` by looking for
   `#bolly-bottle-canvas` — no further wiring needed.
4. The bottle is fully procedural (Three.js `LatheGeometry` for the
   body + a canvas-drawn label texture for the "bolly / Clarify
   Shampoo" text), so there's no external `.glb` model dependency —
   it just works once the two scripts load.

### Interaction behavior
- **Desktop:** click-and-drag (mouse) rotates the bottle on Y (and a
  clamped tilt on X); releasing lets a soft inertia spin-down happen,
  then it eases back into a slow idle auto-rotate after ~2.2s.
- **Mobile/tablet:** single-finger drag does the same via `touchstart /
  touchmove / touchend`, with `touch-action: none` on the stage so the
  page doesn't scroll while rotating.

## 5. Responsive breakpoints (already in style.css)

| Breakpoint | Behavior |
|---|---|
| `> 1024px` (desktop) | 3-column grid: copy / bottle / side copy |
| `≤ 1024px` (tablet) | Grid stacks to 1 column, centered text, nav pill shrinks |
| `≤ 640px` (mobile) | Headline scales with `vw`, nav pill wraps full-width, bottle stage shrinks to 320px tall |
| `≤ 360px` (320px devices) | Extra tightening of nav gaps and headline size so nothing wraps or overflows |

Also set matching **Elementor responsive visibility / column widths**
under each widget's Advanced → Responsive tab so the editor preview
matches this CSS (Elementor's own breakpoints: Desktop / Tablet 1024 /
Mobile 767 — close enough to align with the CSS above; adjust
Elementor's global breakpoints in Site Settings → Layout if you want
them pixel-identical).

## 6. QA checklist before submitting

- [ ] No horizontal scrollbar at 320px, 375px, 768px, 1024px, 1440px
- [ ] Bottle rotates smoothly with mouse drag (desktop) and finger drag (mobile emulator)
- [ ] Nav pill, headline, and CTA button colors match the reference (`#6C4FE0` purple, `#C9F53B` lime, `#141414` black)
- [ ] Fonts load (Archivo Black headline, Inter body, Playfair italic accent)
- [ ] Page works with JS disabled fallback (optional: add a static `<img>` inside `#bolly-bottle-canvas` as a `<noscript>` fallback)

## 7. Submission steps (per the assignment)

1. Push this folder (plus your WordPress theme files) to a GitHub repo.
2. Record a 3–5 minute screen recording: desktop scroll-through +
   dragging the bottle, then resize/emulate mobile and repeat.
3. Upload the recording to Drive/Loom/YouTube (unlisted) and set
   "Anyone with the link can view."
4. Submit the repo link + video link before the deadline.
