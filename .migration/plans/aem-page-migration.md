# Tata Steel Homepage Migration to AEM (XWalk)

Migrate the live homepage **https://www.tatasteel.com** into this AEM Edge Delivery Services **crosswalk (Universal Editor)** project, ensuring the migrated page visually matches the original, with a section-by-section and block-by-block critique and fixes for style/design issues.

## Project Context
- **Project type:** XWalk / Universal Editor (has `models/`, `component-models.json`, `component-definition.json`)
- **Site config:** `tatasteel` → previewOrg `bansaljitendra`, previewSite `tatasteel`, baseUrl `https://www.tatasteel.com/`
- **Existing blocks:** accordion, cards, carousel, columns, embed, footer, form, fragment, header, hero, modal, quote, search, table, tabs, video
- **Target:** single page (homepage `/`)

## Migration Approach
The migration will be orchestrated end-to-end: scrape → analyze structure → map to blocks (reuse existing, create variants as needed) → generate import infrastructure (parsers/transformers) → import content → convert to JCR/XWalk XML → preview → visual critique & fix.

## Checklist

### 1. Setup & Discovery
- [ ] Confirm project type as XWalk and load the project-specific block library endpoint
- [ ] Scrape the live homepage (HTML, images, metadata, computed styles) into migration workspace
- [ ] Survey available blocks (project blocks + Block Collection) for mapping

### 2. Page Analysis
- [ ] Identify section boundaries and content sequences on the homepage
- [ ] Determine authoring decisions per sequence (default content vs. block)
- [ ] Map each section to an existing block or define a new block variant
- [ ] Create any new block variants needed (with models for Universal Editor authoring)

### 3. Import Infrastructure
- [ ] Generate block parsers for each block/variant
- [ ] Generate page transformers (cleanup, sections, Dynamic Media/Scene7 if present)
- [ ] Build the bundled import script for the homepage

### 4. Content Import & XWalk Conversion
- [ ] Run the import to produce structured content
- [ ] Convert imported HTML to JCR XML (XWalk), validating Universal Editor block models & field hints
- [ ] Ensure metadata (title, description, OG tags) is carried over

### 5. Preview & Visual Verification
- [ ] Render the migrated page in local preview
- [ ] Compare migrated page against the live original (structure + appearance)

### 6. Section & Block Critique + Fixes
- [ ] Critique the header/navigation — fix style/design mismatches
- [ ] Critique the hero/carousel section — fix mismatches
- [ ] Critique each content section (cards, columns, tabs, etc.) — fix mismatches
- [ ] Critique the footer — fix style/design mismatches
- [ ] Extract exact computed styles from source for each block and align EDS CSS
- [ ] Re-preview and iterate until each block visually matches the original

### 7. Final Validation
- [ ] Full-page visual comparison against live site
- [ ] Verify responsive/mobile rendering matches
- [ ] Confirm all images and links resolve correctly
- [ ] Report summary of migrated sections, blocks created/reused, and any remaining deviations

## Notes
- The homepage may include a complex mega-menu navigation and footer; these will be handled with dedicated navigation/footer instrumentation using screenshot evidence.
- New block variants will include Universal Editor models so content is authorable in the crosswalk environment.
- **Execution requires Execute mode** — approve this plan to begin scraping and migration.
