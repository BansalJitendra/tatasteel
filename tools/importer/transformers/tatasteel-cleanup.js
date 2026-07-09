/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Tata Steel site-wide cleanup.
 *
 * Removes non-authorable site chrome (top-bar mega nav, header, footer,
 * scripts/tracking) and flattens third-party widget wrappers (bxSlider,
 * jScrollPane) so block parsers can extract the real slides/items cleanly.
 *
 * ALL selectors below were verified against migration-work/cleaned.html.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Replace a wrapper element with its children (unwrap), preserving content.
 * Used for bxSlider / jScrollPane wrappers whose descendants hold the
 * authorable slides/items — removing the wrapper outright would remove them.
 */
function unwrap(el) {
  if (!el || !el.parentNode) return;
  const parent = el.parentNode;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Non-authorable accessibility widget, fullPage.js dot nav, and mouse-trail
    // cursor decorations. These are interactive tooling injected by the site,
    // not page content. Found in cleaned.html: div.accessibility-tools,
    // div#consolPopup (+ .consolPopup variants), div#fp-nav, div.mouse-trail.
    WebImporter.DOMUtils.remove(element, [
      '.accessibility-tools',
      '#consolPopup',
      '.consolPopup',
      '#fp-nav',
      '.mouse-trail',
    ]);

    // bxSlider chrome: pager + prev/next controls are non-authorable widget UI.
    // Found in cleaned.html: div.bx-controls, div#bx-pager (section0),
    // div.bx-pager (section2/3/4), div.bx-controls-direction.
    WebImporter.DOMUtils.remove(element, [
      '.bx-controls',
      '#bx-pager',
      '.bx-pager',
      '.bx-controls-direction',
      '.bx-clone', // cloned slides bxSlider injects for infinite loop (if present)
    ]);

    // jScrollPane scrollbar chrome (media gallery, section5). Non-authorable.
    // Found in cleaned.html: div.jspHorizontalBar (with jspTrack/jspDrag/jspArrow/jspCap),
    // div.jspVerticalBar.
    WebImporter.DOMUtils.remove(element, [
      '.jspHorizontalBar',
      '.jspVerticalBar',
    ]);

    // Flatten bxSlider wrappers so the parser sees ul.bxslider > li directly.
    // Order matters: unwrap viewport (inner) before wrapper (outer).
    // Found in cleaned.html: div.bx-wrapper > div.bx-viewport > ul.bxslider.
    element.querySelectorAll('.bx-viewport').forEach(unwrap);
    element.querySelectorAll('.bx-wrapper').forEach(unwrap);

    // Flatten jScrollPane wrappers so the parser sees the media items directly.
    // Found in cleaned.html: div.jspContainer > div.jspPane > div#media_gallery.
    element.querySelectorAll('.jspPane').forEach(unwrap);
    element.querySelectorAll('.jspContainer').forEach(unwrap);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome.
    // Found in cleaned.html:
    //   div.over_menu  -> top-bar mega navigation (line 4)
    //   div.wrapper > header -> site header/logo/menu toggle (line 1700-1702)
    //   footer -> site footer inside #section6 (line 3125)
    WebImporter.DOMUtils.remove(element, [
      '.over_menu',
      'header',
      'footer',
    ]);

    // The header shell also injected loose <link>/<img> font+logo elements and
    // Google Fonts <link> tags; strip leftover non-content elements.
    // Found in cleaned.html: <link> tags (line 1705-1707), <script>/<noscript>.
    WebImporter.DOMUtils.remove(element, [
      'link',
      'script',
      'noscript',
      'iframe',
      'source',
    ]);

    // Strip inline event/style attributes left by the fullPage.js layout so the
    // import contains only authorable markup.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('style');
    });
  }
}
