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
  // In xwalk/JCR delivery the single rich-text sentence can arrive split into
  // several sibling <p> fragments (one per text run / <strong>). The centered
  // flex body then scatters those fragments across the band with big gaps.
  // Merge every fragment <p> in a body back into one flowing paragraph so the
  // sentence reads normally, like the source.
  ul.querySelectorAll('.cards-stats-card-body').forEach((body) => {
    const paras = [...body.querySelectorAll(':scope > p')];
    if (paras.length <= 1) return;
    const merged = document.createElement('p');
    paras.forEach((p, i) => {
      // Separate fragments with a single space (skip before the first and
      // before a fragment that is only punctuation, e.g. the trailing ".").
      const isPunct = /^[.,;:!?]/.test(p.textContent.trim());
      if (i > 0 && !isPunct) merged.append(document.createTextNode(' '));
      // A lone "TM"/"™" fragment is the trademark mark — render as <sup>.
      if (/^(TM|™)$/i.test(p.textContent.trim())) {
        const sup = document.createElement('sup');
        sup.textContent = p.textContent.trim();
        merged.append(sup);
      } else {
        while (p.firstChild) merged.append(p.firstChild);
      }
    });
    paras.forEach((p) => p.remove());
    body.prepend(merged);
  });

  block.textContent = '';
  block.append(ul);
}
