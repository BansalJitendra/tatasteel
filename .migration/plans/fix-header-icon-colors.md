# Match Top-Right Nav Icon Colors to Live Site

## Problem
On the migrated page (`https://main--tatasteel--bansaljitendra.aem.page/`), all six top-right utility icons render **white**. On the live site (`tatasteel.com`) they are colored:
- **Home, Contact Us, Search, Locations** → **blue** `rgb(51, 122, 183)`
- **Accessibility Tools** (person badge) → **green** `rgb(0, 255, 102)`
- **Accessibility Guide** (gear) → **yellow** `rgb(255, 204, 0)`

## Root Cause (in `blocks/header/header.css`)
1. **Sprite icons** (Home/Contact/Search/Locations, class `.nav-tools-icon`) use the source `sprite.png`, whose glyphs are natively **blue**. The rule at header.css:300‑308 applies `filter: brightness(0) invert(1)`, which forces them **white**. Removing that filter restores the native blue to match live.
2. **SVG icons** (Accessibility Tools/Guide, class `.nav-tools-svg`) are set to `color: #fff` (header.css:334‑345) and inherit white `fill`/`currentColor`. They need green for Tools and yellow for the gear.

## Fix Approach
Edit only `blocks/header/header.css`:
- **Sprite group:** remove/neutralize `filter: brightness(0) invert(1)` on `header nav .nav-tools a.nav-tools-icon` so the sprite shows its native blue (matching live's blue links). Ensure this does not also strip color from the two SVG links (they already override `filter: none`).
- **Accessibility Tools SVG:** set its color/fill to green `rgb(0, 255, 102)`.
- **Accessibility Guide gear SVG:** set its color/fill to yellow `rgb(255, 204, 0)`.
- Target the two SVGs individually (e.g. by `aria-label`, DOM order, or an added modifier class) so each gets the correct distinct color; the shared `.nav-tools-svg` rule currently makes both white.

## Contrast Consideration
The migrated nav overlays the hero banner (blue sky) with a dark scrim, whereas live's utility bar sits on white. Blue icons on the banner may have lower contrast than on live. The request is to match live colors exactly, so I'll implement the live colors and visually verify legibility in the screenshot; if the blue is illegible I'll flag it back rather than silently deviate.

## Verification
- Reload the migrated page and screenshot the header; confirm Home/Contact/Search/Locations are blue, Accessibility Tools is green, gear is yellow — matching the live screenshot.
- Confirm computed `filter`, `color`, and `fill` values match the live values.
- Confirm no regression to the hamburger, logo, Tata group logo, or nav layout.

## Deploy
- Run stylelint on `blocks/header/header.css`.
- Commit, push to `origin main`, and force a code‑sync for `blocks/header/header.css`.
- Re-verify on the deployed page against live.

## Checklist
- [ ] Remove the white `brightness(0) invert(1)` filter on `.nav-tools-icon` so sprite icons show native blue
- [ ] Set Accessibility Tools SVG to green `rgb(0, 255, 102)`
- [ ] Set Accessibility Guide gear SVG to yellow `rgb(255, 204, 0)`
- [ ] Ensure the two SVGs are targeted individually (distinct colors), not the shared white rule
- [ ] Run stylelint on `blocks/header/header.css`
- [ ] Verify locally/deployed: icon colors match live screenshot, no nav layout regressions
- [ ] Commit, push, and force code‑sync `blocks/header/header.css`
- [ ] Re-verify the deployed page matches the live site

> Note: Execution (editing CSS, linting, committing, deploying) requires **Execute mode** — this plan is read-only.
