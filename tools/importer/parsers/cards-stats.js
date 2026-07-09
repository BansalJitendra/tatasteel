/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-stats. Base: cards.
 * Sources: https://www.tatasteel.com/
 *   - #section2 div.impacts-wrapper (grid of `.tile` stat cards, no image)
 *   - #section6 div.stats_box       (single card: background image + richtext)
 * Container block: first row = block name, each subsequent row = one card.
 * Model (card): image (reference/image), imageAlt (collapsed), text (richtext).
 * `image` and `text` are different fields => two cells per card. Per the block
 * description, an image or text cell may be empty but the cell must still exist.
 *
 * Two distinct source shapes map to the same card model:
 *  1) impacts-wrapper: each `.tile` has a `.right-per` stat value and a `<span>` label
 *     (no image). Emit an empty image cell + a text cell with the stat + label.
 *  2) stats_box: a `.stats_bg` div carries the image as a CSS background-image, and
 *     `.stats_text` carries the richtext. Emit image cell (built from bg url) + text cell.
 */
export default function parse(element, { document }) {
  const bgUrl = (el) => {
    if (!el) return '';
    const style = el.getAttribute('style') || '';
    const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : '';
  };

  const cells = [];

  const addCard = (imgUrl, textNodes) => {
    const imageCell = document.createDocumentFragment();
    if (imgUrl) {
      imageCell.appendChild(document.createComment(' field:image '));
      const img = document.createElement('img');
      img.setAttribute('src', imgUrl);
      imageCell.appendChild(img);
    }
    // Empty image cell: leave empty, no field hint (per hinting rules).

    const textCell = document.createDocumentFragment();
    const valid = (textNodes || []).filter((n) => n && (n.textContent ? n.textContent.trim() : true));
    if (valid.length) {
      textCell.appendChild(document.createComment(' field:text '));
      valid.forEach((n) => textCell.appendChild(n.cloneNode(true)));
    }

    if (!imgUrl && valid.length === 0) return; // skip fully empty card
    cells.push([imageCell, textCell]);
  };

  const tiles = Array.from(element.querySelectorAll(':scope > .tile, .impacts-wrapper > .tile'));
  const statsText = element.querySelector('.stats_text');

  if (tiles.length) {
    // Shape 1: impacts-wrapper grid of stat tiles (no images).
    tiles.forEach((tile) => {
      const nodes = [];
      const stat = tile.querySelector('.right-per');
      if (stat) {
        const h = document.createElement('h3');
        h.textContent = stat.textContent.replace(/\s+/g, ' ').trim();
        nodes.push(h);
      }
      // Description spans are the tile's direct <span> children (not inside .right-per).
      Array.from(tile.children).forEach((c) => {
        if (c.tagName === 'SPAN' && c.textContent.trim()) {
          const p = document.createElement('p');
          p.textContent = c.textContent.replace(/\s+/g, ' ').trim();
          nodes.push(p);
        }
      });
      addCard('', nodes);
    });
  } else if (statsText || element.querySelector('.stats_bg')) {
    // Shape 2: stats_box single card (background image + richtext).
    const imgUrl = bgUrl(element.querySelector('.stats_bg'));
    const textNodes = statsText
      ? Array.from(statsText.querySelectorAll('p, h1, h2, h3, h4, h5, h6')).filter((n) => n.textContent.trim())
      : [];
    // Fall back to the whole stats_text content if no block-level children found.
    if (statsText && textNodes.length === 0 && statsText.textContent.trim()) {
      const p = document.createElement('p');
      p.innerHTML = statsText.innerHTML;
      textNodes.push(p);
    }
    addCard(imgUrl, textNodes);
  }

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  element.replaceWith(block);
}
