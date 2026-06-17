# Test Plan — Jonathan Au Personal Portfolio

> Revised to correct factual errors and incorporate all identified gaps.

---

## 1. HTML Structure & Content

| # | Test | Assertion |
|---|------|-----------|
| 1.1 | **HTML validity** | `index.html` passes W3C validation — no unclosed tags, proper nesting |
| 1.2 | **Semantic markup** | Correct use of `<main>`, `<header>`, `<section>`, `<footer>`, `<article>`, `<nav>`; `<header>` inside `<main>` is intentional |
| 1.3 | **Required sections present** | Hero (`#home`), About (`#about`), Experience (`#experience`), Projects (`#projects`), Footer all exist |
| 1.4 | **Navigation links** | All `<a>` `href` values resolve to valid in-page anchors or well-formed external URLs |
| 1.5 | **Image `alt` attributes** | Every `<img>` has a meaningful, non-empty `alt` (e.g., `"Jonathan Au Profile Photo"`) |
| 1.6 | **Meta tags** | `description`, `author`, `theme-color`, `canonical`, `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` all present and non-empty |
| 1.7 | **Structured data (JSON-LD)** | Exactly 3 `<script type="application/ld+json">` blocks parse as valid JSON with correct `@context` and `@type` (Person, ItemList, WebSite); ItemList contains 8 items |
| 1.8 | **Heading hierarchy** | Sequence is h1 → h2 → h3 with no skipped levels; single `<h1>` per page |
| 1.9 | **Google verification file** | `/google7dfa797769f133d5.html` is accessible and returns 200 |

---

## 2. CSS / Visual

| # | Test | Assertion |
|---|------|-----------|
| 2.1 | **No parse errors** | `assets/css/index.css` loads without CSS parse errors |
| 2.2 | **Theme swatch `.active`** | `.active` class is toggled on `.theme-option` buttons (not on `.theme-swatch` spans) |
| 2.3 | **All 8 themes defined** | CSS defines styles for: `cyber`, `sunset`, `forest`, `dusk`, `cyber-light`, `sunset-light`, `forest-light`, `dusk-light` |
| 2.4 | **Glassmorphism** | `.glass-card` elements have `backdrop-filter` / transparency applied |
| 2.5 | **Stagger animation classes** | CSS defines `.delay-1` through `.delay-7` — all delay classes are present and correctly applied to project cards |
| 2.6 | **Responsive layout** | Page renders correctly at ≤768px (mobile), 768–1024px (tablet), >1024px (desktop) |
| 2.7 | **Scroll animations** | Elements with `.reveal` class animate into view on scroll (Intersection Observer or equivalent) |
| 2.8 | **Color-scheme property** | Light themes set `color-scheme: light` (affects native scrollbars, form controls) |

---

## 3. JavaScript Behavior

| # | Test | Assertion |
|---|------|-----------|
| 3.1 | **Theme switcher click** | Clicking a `.theme-option` sets `data-theme` on `<html>` to the button's `data-theme` value |
| 3.2 | **Default theme handling** | Default "cyber" theme: `data-theme` attribute is **removed** (via `removeAttribute`), not set to `"cyber"` — test must verify attribute absence |
| 3.3 | **Theme persistence** | Set a theme → reload page → `theme-init.js` applies saved theme to `<html>` before CSS paint (no flash) |
| 3.4 | **Theme popover toggle** | Clicking `#theme-switcher` toggles `#theme-popover` visibility (open ↔ close) |
| 3.5 | **Escape key closes popover** | Pressing `Escape` while popover is open closes it (`script.js:129-133`) |
| 3.6 | **Outside-click closes popover** | Clicking outside the popover closes it (`script.js:122-126`) |
| 3.7 | **Arrow-key navigation in popover** | Arrow keys navigate between theme option buttons within the popover (`script.js:174-191`) |
| 3.8 | **Mobile menu toggle** | Clicking `.menu-toggle` opens/closes `.mobile-menu` |
| 3.9 | **Mobile menu icon swap** | Toggle icon swaps between `ph-list` (closed) ↔ `ph-x` (open) (`script.js:15-16`) |
| 3.10 | **Mobile link auto-closes menu** | Clicking any `.mobile-link` closes the mobile menu (`script.js:28-34`) |
| 3.11 | **Mobile menu locks body scroll** | Menu open: `document.body.style.overflow === 'hidden'`; Menu close: overflow restored (`script.js:17`) |
| 3.12 | **Mobile theme switcher parity** | Mobile menu contains a full duplicate theme switcher that functions identically to the desktop version |
| 3.13 | **Smooth scroll** | Nav anchor links scroll smoothly to target section (verified via `scroll-behavior: smooth` on `<html>`) |
| 3.14 | **Navbar scroll effect** | Scrolling past 50px adds `.scrolled` class to `#navbar` (backdrop blur + background) (`script.js:38-45`) |
| 3.15 | **`meta[name="theme-color"]` updates** | Theme switch dynamically updates the `content` of `meta[name="theme-color"]` |
| 3.16 | **No runtime console errors** | No `ReferenceError`, `TypeError`, or failed resource loads in browser console |

---

## 4. Performance & Optimization

| # | Test | Assertion |
|---|------|-----------|
| 4.1 | **No build step** | Opening `index.html` directly in a browser works with no build tooling |
| 4.2 | **`theme-init.js` is synchronous in `<head>`** | Script is a blocking `<script>` in `<head>` placed before the CSS `<link>` — this is intentional (prevents theme flicker) |
| 4.3 | **CSS placement** | CSS `<link>` is in `<head>` |
| 4.4 | **Main script at body end** | `<script src="./assets/js/script.js">` is the last element before `</body>` (no `defer` attribute — attribute must not be present) |
| 4.5 | **Phosphor Icons in `<head>`** | `@phosphor-icons/web@2.1.2` script loads in `<head>` without `defer`/`async` |
| 4.6 | **Image optimization** | `og-image.jpg` (741KB) should be compressed to < 300KB for optimal OG sharing; `favicon.png` and `profile_photo.jpg` appropriately sized |
| 4.7 | **External resource origins** | Only expected external origins: `fonts.googleapis.com`, `fonts.gstatic.com`, `unpkg.com`, `cdn.jsdelivr.net`, `gc.zgo.at` |

---

## 5. Security & Headers

| # | Test | Assertion |
|---|------|-----------|
| 5.1 | **`_headers` security headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` |
| 5.2 | **CSP full policy** | Meta CSP validates all directives: `default-src 'self'`, `script-src 'self' https://unpkg.com https://gc.zgo.at`, `style-src 'self' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net`, `font-src https://fonts.gstatic.com https://unpkg.com https://cdn.jsdelivr.net`, `img-src 'self' data: https://jonathanau.onrender.com`, `connect-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'none'` |
| 5.3 | **CSP `frame-ancestors` note** | `frame-ancestors` in `<meta>` CSP is spec-ignored by browsers; real framing protection relies on `X-Frame-Options: DENY` from `_headers` |
| 5.4 | **Outbound link security** | All outbound `<a>` tags use `target="_blank"` and `rel` containing `noopener noreferrer` (LinkedIn links additionally include the `me` microformat — tests must use substring match, not exact match) |
| 5.5 | **Analytics async** | GoatCounter script (`gc.zgo.at/count.js`) has the `async` attribute |

---

## 6. SEO & Discoverability

| # | Test | Assertion |
|---|------|-----------|
| 6.1 | **`robots.txt`** | Allows Googlebot, Bingbot, GPTBot, ChatGPT-User, ClaudeBot, Google-Extended, PerplexityBot; Disallows Bytespider; contains Sitemap reference |
| 6.2 | **`sitemap.xml` validity** | Valid XML with `http://www.sitemaps.org/schemas/sitemap/0.9` namespace; contains homepage URL with `<lastmod>`, `<changefreq>`, `<priority>` |
| 6.3 | **`sitemap.xml` `<lastmod>` currency** | `<lastmod>` should update when site content changes (e.g., when projects are added or descriptions change) |
| 6.4 | **`llms.txt` ↔ site parity** | A programmatic check validates that every project listed in `llms.txt` has a corresponding entry in `index.html` (and vice versa), so the two files don't drift when projects are added or removed |
| 6.5 | **Open Graph tags** | `og:type=website`, `og:url`, `og:title`, `og:description`, `og:image` all populated with correct values |
| 6.6 | **Twitter Card tags** | `twitter:card=summary_large_image`, `twitter:url`, `twitter:title`, `twitter:description`, `twitter:image` all populated |
| 6.7 | **Canonical URL** | `<link rel="canonical">` points to `https://jonathanau.onrender.com/` |

---

## 7. Cross-Browser / Compatibility

| # | Test | Assertion |
|---|------|-----------|
| 7.1 | **Browser rendering** | Correct display in latest Chrome, Firefox, Safari, Edge |
| 7.2 | **iOS Safari** | Mobile menu, theme switching, and scroll behavior work correctly on iOS Safari |
| 7.3 | **`scroll-smooth` polyfill** | Not needed — all target browsers support `scroll-behavior: smooth` natively |
| 7.4 | **Phosphor Icons rendering** | All used icons render: `ph-github-logo`, `ph-arrow-up-right`, `ph-list`, `ph-palette`, `ph-arrow-down`, `ph-x` |

---

## 8. Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | ≥ 95 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | 100 |

---

## 9. Suggested Tooling

| Tool | Purpose |
|------|---------|
| **Lighthouse CI** | Automated performance, accessibility, SEO, and best-practices scoring |
| **axe-core** | Programmatic accessibility audits |
| **html-validator** | W3C HTML validation |
| **stylelint** | CSS quality and consistency checks |
| **Playwright** | E2E tests for theme switching, mobile menu, scroll behavior, link validation, keyboard navigation |
| **html-proofer** (via Docker) | Validate all internal/external links, images, and assets |

---

## 10. Known Bugs to Resolve Before Testing

| Priority | Bug | Location |
|----------|-----|----------|
| 🟡 Minor | `og-image.jpg` is 741KB (recommended < 300KB) | `assets/img/og-image.jpg` |