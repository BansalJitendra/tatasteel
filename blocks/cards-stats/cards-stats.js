import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // In xwalk/JCR delivery (and when the Universal Editor re-decorates the
  // block) an image reference field renders as a bare <a href="...jpg">, not a
  // <picture>. Convert those anchors to <picture><img> so the image-cell
  // detection below works and the image is visible everywhere.
  block.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(href) && !a.closest('picture')) {
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.setAttribute('src', href);
      img.setAttribute('alt', (a.textContent || '').trim().replace(/^https?:\/\/\S+$/, ''));
      picture.append(img);
      a.replaceWith(picture);
    }
  });

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // An image cell holds only a single media element (a <picture> or a bare
      // <img>, possibly wrapped in a <p>) and no other text. Everything else is
      // the body copy. Checking for the image directly (rather than requiring a
      // <picture>) handles xwalk/EDS delivery, where an image reference can
      // render as <p><img></p> instead of a <picture>.
      const media = div.querySelector('picture, img');
      const textLen = div.textContent.trim().length;
      if (media && textLen === 0) div.className = 'cards-stats-card-image';
      else div.className = 'cards-stats-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // Only run the AEM image optimizer on same-origin media. External absolute
    // URLs (e.g. tatasteel.com banners) must keep their full src — the
    // optimizer rewrites them to a broken relative path, so the image 404s.
    const src = img.getAttribute('src') || '';
    const isExternal = /^https?:\/\//i.test(src) && !src.startsWith(window.location.origin);
    if (isExternal) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
