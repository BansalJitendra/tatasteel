/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-quote. Base: carousel.
 * Source: https://www.tatasteel.com/ (#section2 div.banner.sustainabilityNew)
 * Container block: first row = block name, each subsequent row = one slide.
 * Model (carousel-quote-item): media_image (reference/image), media_imageAlt (collapsed),
 * content_text (richtext). media_ and content_ are different prefixes => two cells per slide.
 *
 * Source notes: this is a bxSlider. On the live page each slide (`.bxSlide`) holds two
 * `.bxSlideWrapper` divs — desktop (`.hidden-xs`) and mobile (`.visible-xs`) — and the slide
 * image is a CSS `background-image` style on the wrapper (NOT an <img> tag). We build an
 * <img> from the desktop background URL (falling back to mobile). The quote caption
 * (`.banner_cap_txt`) is empty on the live page, so content_text is usually empty — we still
 * emit the cell to preserve the two-cell model shape.
 */
export default function parse(element, { document }) {
  // Pull the background-image URL out of a style string, if present.
  const bgUrl = (el) => {
    if (!el) return '';
    const style = el.getAttribute('style') || '';
    const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : '';
  };

  // Best image URL for a slide: desktop bg first, then mobile bg. Also handle any
  // real <img> tag as a fallback (older markup variant).
  const slideImageUrl = (slide) => {
    const desktop = slide.querySelector('.bxSlideWrapper.hidden-xs');
    const mobile = slide.querySelector('.bxSlideWrapper.visible-xs');
    const bg = bgUrl(desktop) || bgUrl(mobile);
    if (bg) return bg;
    const img = slide.querySelector('.bxSlideWrapper.hidden-xs img, .bxSlideWrapper.visible-xs img, img');
    return img && img.getAttribute('src') ? img.getAttribute('src') : '';
  };

  // Extract any live (non-commented) caption text/markup for the slide.
  const slideTextNodes = (slide) => {
    const cap = slide.querySelector('.banner_cap_txt');
    if (!cap) return [];
    return Array.from(cap.querySelectorAll('p, h1, h2, h3, h4, blockquote, span, strong'))
      .filter((n) => n.textContent && n.textContent.trim());
  };

  const slides = Array.from(element.querySelectorAll('.bxSlide'));

  const cells = [];

  const seen = new Set();
  slides.forEach((slide) => {
    const imgUrl = slideImageUrl(slide);
    // Dedupe by image URL (bxSlider clones slides).
    if (imgUrl) {
      if (seen.has(imgUrl)) return;
      seen.add(imgUrl);
    }

    const textNodes = slideTextNodes(slide);

    // Skip slides that have neither image nor text.
    if (!imgUrl && textNodes.length === 0) return;

    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:media_image '));
    if (imgUrl) {
      const img = document.createElement('img');
      img.setAttribute('src', imgUrl);
      imageCell.appendChild(img);
    }

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:content_text '));
    textNodes.forEach((n) => textCell.appendChild(n.cloneNode(true)));

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard: no real slides found.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-quote', cells });
  element.replaceWith(block);
}
