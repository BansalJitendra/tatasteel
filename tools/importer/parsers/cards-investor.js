/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-investor. Base: cards.
 * Source: https://www.tatasteel.com/ (#section4 div.investor_box div.investor_boxes)
 * Container block: first row = block name, each subsequent row = one card.
 * Model (card): image (reference/image), imageAlt (collapsed), text (richtext).
 * `image` and `text` are different fields => two cells per card. Per the block
 * description, an image or text cell may be empty but the cell must still exist.
 *
 * Source notes: each `.invest_box` is a text-only investor card (Stock Quotes,
 * Performance, Exchange Releases) containing an <h5> title plus richtext (paragraphs,
 * bullet lists, and links to PDFs / release pages). There is no card image, so the image
 * cell is left empty (no field hint on empty cells per hinting rules). The tiny market
 * up/down arrow <img>s inside the stock-quote box are decorative and are stripped from
 * the richtext.
 */
export default function parse(element, { document }) {
  const cells = [];

  const boxes = Array.from(element.querySelectorAll('.invest_box'));

  boxes.forEach((box) => {
    // Clone the card so we can clean it without mutating the live DOM.
    const clone = box.cloneNode(true);

    // Remove decorative market up/down arrow images and empty layout helpers.
    clone.querySelectorAll('.market_updown, img').forEach((n) => n.remove());
    clone.querySelectorAll('.clearfix').forEach((n) => n.remove());

    // Headings nested inside links (e.g. <a><h6>4QFY26 Financial Results</h6></a>)
    // serialize to markdown as "###### ..." inside the link text. Replace such
    // headings with their plain text so the link renders cleanly.
    clone.querySelectorAll('a h1, a h2, a h3, a h4, a h5, a h6').forEach((h) => {
      h.replaceWith(document.createTextNode(h.textContent.trim()));
    });

    // Collect meaningful richtext children (headings, paragraphs, lists, links).
    const textNodes = Array.from(clone.children).filter(
      (n) => n.textContent && n.textContent.trim(),
    );

    if (textNodes.length === 0) return; // skip empty card

    // Empty image cell (no field hint per hinting rules for empty cells).
    const imageCell = document.createDocumentFragment();

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => textCell.appendChild(n));

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-investor', cells });
  element.replaceWith(block);
}
