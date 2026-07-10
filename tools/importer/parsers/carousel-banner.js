/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-banner. Base: carousel.
 * Source: https://www.tatasteel.com/ (#section0 div.banner div.banner_slideshow)
 * Container block: first row = block name, each subsequent row = one slide.
 * Model (carousel-banner-item): media_image (reference/image), media_imageAlt (collapsed),
 * content_text (richtext). media_ and content_ are different prefixes => two cells per slide.
 *
 * Source notes: the live DOM is a bxSlider. Slide images are NOT <img> tags — they are
 * CSS `background-image` styles on `.banner_images` divs (desktop = .hidden-xs, mobile =
 * .visible-xs). Some desktop slides use a <video> instead of a background image. The
 * #bx-pager is the stable source of truth: one <a.thumblink> per real slide, carrying the
 * title (<em>) and slide href. We drive extraction from the pager, match each pager href to
 * a slide <li>, and build an <img> from the slide's background-image (desktop first, then
 * mobile). Video-only desktop slides fall back to the mobile background image.
 */
export default function parse(element, { document }) {
  // Pull the background-image URL out of a style string, if present.
  const bgUrl = (el) => {
    if (!el) return '';
    const style = el.getAttribute('style') || '';
    const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : '';
  };

  // Known landscape (desktop) banner stills keyed by slide href fragment. The
  // scraped DOM only carries the mobile portrait bg for these slides (the
  // desktop .hidden-xs bg / video is set by JS at runtime and isn't captured),
  // so map to the wide desktop asset where one is published.
  const DESKTOP_IMAGE_BY_HREF = [
    { match: '119th-annual-general-meeting', url: 'https://www.tatasteel.com/media/26156/ts-119-agm-banner.jpg' },
  ];

  // Choose the best image URL for a slide <li>: an explicit desktop still for
  // known slides, then the desktop bg, else the mobile bg.
  const slideImageUrl = (li, href) => {
    if (href) {
      const mapped = DESKTOP_IMAGE_BY_HREF.find((m) => href.includes(m.match));
      if (mapped) return mapped.url;
    }
    if (!li) return '';
    const desktop = li.querySelector('.banner_images.hidden-xs');
    const mobile = li.querySelector('.banner_images.visible-xs');
    return bgUrl(desktop) || bgUrl(mobile) || '';
  };

  const pagerLinks = Array.from(element.querySelectorAll('#bx-pager li a.thumblink'));
  const lis = Array.from(element.querySelectorAll('ul.bxslider > li'));

  // Map slide href -> slide <li> (first occurrence wins; bxSlider may clone).
  const liByHref = new Map();
  lis.forEach((li) => {
    const a = li.querySelector('a[href]');
    const href = a ? a.getAttribute('href') : '';
    if (href && !liByHref.has(href)) liByHref.set(href, li);
  });

  const buildRow = (href, labelText, li) => {
    const imgUrl = slideImageUrl(li, href);

    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:media_image '));
    if (imgUrl) {
      const img = document.createElement('img');
      img.setAttribute('src', imgUrl);
      if (labelText) img.setAttribute('alt', labelText);
      imageCell.appendChild(img);
    }

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:content_text '));
    if (href) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = labelText || href;
      textCell.appendChild(a);
    } else if (labelText) {
      const h = document.createElement('h3');
      h.textContent = labelText;
      textCell.appendChild(h);
    }

    return [imageCell, textCell];
  };

  const cells = [];

  if (pagerLinks.length) {
    pagerLinks.forEach((pager) => {
      const href = pager.getAttribute('href') || '';
      const em = pager.querySelector('em');
      const labelText = em ? em.textContent.trim() : '';
      const li = href ? liByHref.get(href) : null;
      if (href || labelText) cells.push(buildRow(href, labelText, li));
    });
  } else {
    // Fallback: no pager — iterate distinct slides directly.
    const seen = new Set();
    lis.forEach((li) => {
      const a = li.querySelector('a[href]');
      const href = a ? a.getAttribute('href') : '';
      if (href && seen.has(href)) return;
      if (href) seen.add(href);
      if (!href && !slideImageUrl(li)) return;
      cells.push(buildRow(href, '', li));
    });
  }

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-banner', cells });
  element.replaceWith(block);
}
