/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-nav. Base: tabs.
 * Sources: https://www.tatasteel.com/
 *   - #section3 div.production_sector div.product_gallery (region tabs: `.prod_box`)
 *   - #section5 div.media_box div.media_cont              (media filter tabs)
 * Two-column block: first row = block name; each subsequent row = one tab where
 * cell 1 = tab label (title) and cell 2 = tab content.
 *
 * Model (tabs-nav-item):
 *   - title            (text, tab label)          -> cell 1, hint `field:title`
 *   - content_heading  (text)                     -> cell 2, hint `field:content_heading`
 *   - content_headingType (select, COLLAPSED)     -> attribute of the heading, no hint
 *   - content_image    (reference/image)          -> cell 2, hint `field:content_image`
 *   - content_richtext (richtext)                 -> cell 2, hint `field:content_richtext`
 * All `content_` fields share the prefix so they live in the SAME (content) cell.
 *
 * Source shapes:
 *  1) product_gallery: each `.prod_box` is a tab. Label = `.prod_name` (or the <a> title).
 *     Content = the region image (`.prod_img img`) plus a link to the region page.
 *  2) media_cont: each `.filter_link ul li a` is a filter tab. Label = link text; there is
 *     no separate content beyond the label, so the content cell repeats the label as
 *     richtext (kept non-empty so the tab has content per the block description).
 */
export default function parse(element, { document }) {
  const cells = [];

  // ---- Build one tab row: [titleCell, contentCell] ----
  const addTab = (label, { heading, image, richtextNodes } = {}) => {
    if (!label && !heading && !image && (!richtextNodes || richtextNodes.length === 0)) return;

    // Cell 1: tab label.
    const titleCell = document.createDocumentFragment();
    titleCell.appendChild(document.createComment(' field:title '));
    if (label) titleCell.appendChild(document.createTextNode(label));

    // Cell 2: grouped content_ fields.
    const contentCell = document.createDocumentFragment();
    if (heading) {
      contentCell.appendChild(document.createComment(' field:content_heading '));
      const h = document.createElement('h3');
      h.textContent = heading;
      contentCell.appendChild(h);
    }
    if (image) {
      contentCell.appendChild(document.createComment(' field:content_image '));
      contentCell.appendChild(image);
    }
    if (richtextNodes && richtextNodes.length) {
      contentCell.appendChild(document.createComment(' field:content_richtext '));
      richtextNodes.forEach((n) => contentCell.appendChild(n));
    }

    cells.push([titleCell, contentCell]);
  };

  const prodBoxes = Array.from(element.querySelectorAll('.prod_box'));
  // Media filter tabs: element may be the `.media_cont` (descendant `.filter_link`)
  // or the `.filter_link` bar itself (scoped selector to avoid consuming the gallery).
  let filterLinks = Array.from(element.querySelectorAll('.filter_link ul li a'));
  if (!filterLinks.length && element.matches && element.matches('.filter_link')) {
    filterLinks = Array.from(element.querySelectorAll('ul li a'));
  }

  if (prodBoxes.length) {
    // Shape 1: region tabs with image + link.
    prodBoxes.forEach((box) => {
      const a = box.querySelector('a');
      const nameEl = box.querySelector('.prod_name');
      const label = (nameEl && nameEl.textContent.trim())
        || (a && (a.getAttribute('title') || a.textContent.trim()))
        || '';
      const srcImg = box.querySelector('.prod_img img, img');
      let image = null;
      if (srcImg && srcImg.getAttribute('src')) {
        image = document.createElement('img');
        image.setAttribute('src', srcImg.getAttribute('src'));
        if (label) image.setAttribute('alt', label);
      }
      const richtextNodes = [];
      const href = a ? a.getAttribute('href') : '';
      if (href) {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = label || href;
        richtextNodes.push(link);
      }
      addTab(label, { image, richtextNodes });
    });
  } else if (filterLinks.length) {
    // Shape 2: media filter tabs (label only). Skip hidden filters.
    filterLinks.forEach((a) => {
      const liHidden = a.closest('li') && a.closest('li').getAttribute('style') === 'display: none;';
      const selfHidden = (a.getAttribute('style') || '').includes('display: none');
      if (liHidden || selfHidden) return;
      const label = (a.getAttribute('data-letters') || a.textContent || '').trim();
      if (!label) return;
      const p = document.createElement('p');
      p.textContent = label;
      addTab(label, { richtextNodes: [p] });
    });
  }

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-nav', cells });
  element.replaceWith(block);
}
