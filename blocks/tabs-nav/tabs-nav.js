// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';
import REGION_MAPS from './region-maps.js';

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

// The Products & Solutions region maps are hotlinked from tatasteel.com, which
// blocks cross-origin image loads from the delivery origin, so they fail to
// render. Swap those specific PNG srcs for inlined data URIs.
const MAP_SRC_REMAP = [
  { match: '/media/2868/', data: REGION_MAPS.india },
  { match: '/media/2867/', data: REGION_MAPS.europe },
  { match: '/media/2869/', data: REGION_MAPS.sea },
];

function remapMapSrc(src) {
  if (!src) return src;
  const hit = MAP_SRC_REMAP.find((m) => src.includes(m.match));
  return hit ? hit.data : src;
}

export default async function decorate(block) {
  // In xwalk/JCR delivery (and when the Universal Editor re-decorates the
  // block) the content_image reference in a tab panel renders as a bare
  // <a href="...png">, not a <picture>. Convert those anchors to <img> so the
  // region/panel image is visible everywhere (delivery, preview, and UE).
  block.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(href) && !a.closest('picture')) {
      const img = document.createElement('img');
      const remapped = remapMapSrc(href);
      img.setAttribute('src', remapped);
      if (remapped !== href) img.setAttribute('loading', 'eager');
      img.setAttribute('alt', (a.textContent || '').trim().replace(/^https?:\/\/\S+$/, ''));
      a.replaceWith(img);
    }
  });

  // Delivery may also render the image directly as <img>/<picture>; remap those
  // blocked map srcs to the inline data URIs too. Load eagerly so the map is
  // ready before the tab is shown (lazy-load defers off-screen tiles).
  block.querySelectorAll('img').forEach((img) => {
    const remapped = remapMapSrc(img.getAttribute('src'));
    if (remapped !== img.getAttribute('src')) {
      img.setAttribute('src', remapped);
      img.setAttribute('loading', 'eager');
      img.removeAttribute('srcset');
    }
  });

  // Products & Solutions is NOT a tabbed control on the source: all three
  // region maps (India / Europe / South East Asia) are shown at once, each a
  // clickable link to its region page. Render every panel visible side-by-side
  // and drop the tab buttons/switching for that section.
  if (block.closest('.section.products')) {
    tabBlockCnt += 1;
    block.classList.add('tabs-nav-all');
    [...block.children].forEach((row, i) => {
      const heading = row.firstElementChild; // title cell
      const panel = row;
      panel.classList.add('tabs-nav-panel');
      panel.id = `tabpanel-${tabBlockCnt}-region-${i + 1}`;
      // Drop the redundant title cell (the region name repeats as the link).
      if (heading) heading.remove();
    });
    return;
  }

  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-nav-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tablist-${tabBlockCnt += 1}`;

  // the first cell of each row is the title of the tab
  const tabHeadings = [...block.children]
    .filter((child) => child.firstElementChild && child.firstElementChild.children.length > 0)
    .map((child) => child.firstElementChild);

  tabHeadings.forEach((tab, i) => {
    const id = `tabpanel-${tabBlockCnt}-tab-${i + 1}`;

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-nav-panel';
    tabpanel.id = id;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-nav-tab';
    button.id = `tab-${id}`;

    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');

    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });

    // add the new tab list button, to the tablist
    tablist.append(button);

    // remove the tab heading from the dom, which also removes it from the UE tree
    tab.remove();

    // remove the instrumentation from the button's h1, h2 etc (this removes it from the tree)
    if (button.firstElementChild) {
      moveInstrumentation(button.firstElementChild, null);
    }
  });

  block.prepend(tablist);
}
