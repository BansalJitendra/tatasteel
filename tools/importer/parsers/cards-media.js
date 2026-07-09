/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-media. Base: cards.
 * Source: https://www.tatasteel.com/ (#section5 div.media_cont div.media_gallery)
 * Container block: first row = block name, each subsequent row = one card.
 * Model (card): image (reference/image), imageAlt (collapsed), text (richtext).
 * `image` and `text` are different fields => two cells per card. Per the block
 * description, an image or text cell may be empty but the cell must still exist.
 *
 * Source notes: the media gallery is a jScrollPane of `.items` press-release cards.
 * Each card contains an optional thumbnail (`.media_img_bx img`) and a text block
 * (`.media_txt_bx`) with a headline <p> and an `.upload_time` date. The destination URL
 * lives in an inline `onclick="window.open('URL', ...)"` on the `.items` element or its
 * inner `.media_cont_bx`. We wrap the headline in a link to that URL and append the date.
 * Cards without a thumbnail get an empty image cell (no hint on empty cells).
 */
export default function parse(element, { document }) {
  // Extract the URL from an onclick="window.open('URL', ...)" attribute.
  const openUrl = (el) => {
    if (!el) return '';
    const oc = el.getAttribute('onclick') || '';
    const m = oc.match(/window\.open\(\s*['"]([^'"]+)['"]/i);
    return m ? m[1] : '';
  };

  const cells = [];

  // Use a single unambiguous selector. `#media_gallery > .items` matches the press
  // cards. Fall back to `.items` only when the gallery id is absent.
  let items = Array.from(element.querySelectorAll('#media_gallery > .items'));
  if (items.length === 0) items = Array.from(element.querySelectorAll('.items'));

  // jScrollPane clones the item list for its scrolling mechanism, so the same card can
  // appear more than once in the DOM. Dedupe by destination URL + headline.
  const seen = new Set();

  items.forEach((item) => {
    const inner = item.querySelector('.media_cont_bx');
    const href = openUrl(item) || openUrl(inner);

    // Image cell (optional). Prefer a real thumbnail <img>.
    const imageCell = document.createDocumentFragment();
    const img = item.querySelector('.media_img_bx img, img');
    if (img && img.getAttribute('src')) {
      imageCell.appendChild(document.createComment(' field:image '));
      const newImg = document.createElement('img');
      newImg.setAttribute('src', img.getAttribute('src'));
      const alt = img.getAttribute('alt');
      if (alt) newImg.setAttribute('alt', alt);
      imageCell.appendChild(newImg);
    }
    // else: leave image cell empty (no field hint on empty cells).

    // Text cell: headline (linked to the press-release URL) + date.
    const headlineEl = item.querySelector('.media_txt_bx p');
    const dateEl = item.querySelector('.media_txt_bx .upload_time');
    const headline = headlineEl ? headlineEl.textContent.replace(/\s+/g, ' ').trim() : '';
    const date = dateEl ? dateEl.textContent.replace(/\s+/g, ' ').trim() : '';

    if (!headline && !img) return; // skip empty card

    // Skip jScrollPane clones (same URL + headline already emitted).
    const key = `${href}|${headline}`;
    if (seen.has(key)) return;
    seen.add(key);

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (headline) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = headline;
        p.appendChild(a);
      } else {
        p.textContent = headline;
      }
      textCell.appendChild(p);
    }
    if (date) {
      const dp = document.createElement('p');
      dp.textContent = date;
      textCell.appendChild(dp);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-media', cells });
  element.replaceWith(block);
}
