/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Tata Steel section breaks + section metadata.
 *
 * Runs in afterTransform only. Reads payload.template.sections (populated from
 * page-templates.json) and, for each section:
 *   - inserts a <hr> before the section element (when content precedes it),
 *   - inserts a "Section Metadata" block at the END of the section's content.
 *
 * The source markup has unbalanced <div>s (fullPage.js panels don't all close
 * cleanly), so appending the metadata *inside* the section element mis-places
 * it. Instead we anchor the metadata just before the NEXT section element (or
 * append to the body for the last section), which reliably lands it at the end
 * of the current section's content.
 *
 * Section selectors (#section2..#section6) verified against
 * migration-work/cleaned.html.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const sections = payload && payload.template && payload.template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;

  const doc = element.ownerDocument;

  // Resolve each section's DOM element up front.
  const resolved = sections.map((section) => ({
    section,
    el: element.querySelector(section.selector || `#${section.id}`),
  })).filter((r) => r.el);

  // Metadata: insert before the next section's element so it closes the current
  // section. Process forward; for the last section, append to body.
  resolved.forEach((entry, idx) => {
    if (!entry.section.style) return;
    const metaBlock = WebImporter.Blocks.createBlock(doc, {
      name: 'Section Metadata',
      cells: { style: entry.section.style },
    });
    const next = resolved[idx + 1];
    if (next && next.el && next.el.parentNode) {
      next.el.parentNode.insertBefore(metaBlock, next.el);
    } else {
      element.appendChild(metaBlock);
    }
  });

  // Section breaks: insert a <hr> before each section element when content
  // precedes it. Process in reverse so earlier inserts don't shift later ones.
  // The hero (#section0) is not in sections[] but always renders before the
  // first mapped section, so the first entry also gets a break.
  for (let i = resolved.length - 1; i >= 0; i -= 1) {
    const { el } = resolved[i];
    if (el.previousElementSibling) {
      const hr = doc.createElement('hr');
      el.parentNode.insertBefore(hr, el);
    }
  }
}
