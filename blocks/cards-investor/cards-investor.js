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
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-investor-card-image';
      else div.className = 'cards-investor-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // Only run the AEM image optimizer on same-origin media. External absolute
    // URLs must keep their full src — the optimizer rewrites them to a broken
    // relative path, so the image 404s.
    const src = img.getAttribute('src') || '';
    const isExternal = /^https?:\/\//i.test(src) && !src.startsWith(window.location.origin);
    if (isExternal) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);

  // The source animates the three investor boxes with a staggered "fadeInUp"
  // (rise from far below + fade in) when the section scrolls into view. Apply
  // the same: mark each card for reveal with an increasing duration, then flip
  // the revealed state via an IntersectionObserver.
  const cards = [...ul.children];
  cards.forEach((li, i) => {
    li.classList.add('cards-investor-reveal');
    li.style.setProperty('--reveal-duration', `${1 + i * 0.5}s`);
  });
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('cards-investor-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach((li) => revealObserver.observe(li));
}
