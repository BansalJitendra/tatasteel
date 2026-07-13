import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const TS = 'https://www.tatasteel.com';

// Real "In The News" items (source: tatasteel.com/newsroom/in-the-news). The
// migrated content only carries Press Release cards, so the In The News tab
// content is supplied here to match the live two-tab Media section.
const IN_THE_NEWS = [
  { title: 'Tata Steel partners SMS Group to implement EASyMelt technology', href: `${TS}/newsroom/in-the-news/2026/tata-steel-partners-sms-group-to-implement-easymelt-technology/`, date: 'May 31, 2026' },
  { title: 'INOXAP commissions a 280 TPD ASU at Tata Steel’s Ludhiana facility', href: `${TS}/newsroom/in-the-news/2026/inoxap-commissions-a-280-tpd-asu-at-tata-steels-ludhiana-facility/`, date: 'May 31, 2026' },
  { title: 'Kardemir Awards Primetals Technologies Contract to Modernise Meltshop Automation', href: `${TS}/newsroom/in-the-news/2026/kardemir-awards-primetals-technologies-contract-to-modernise-meltshop-automation-primetals/`, date: 'May 31, 2026' },
  { title: 'Tata Steel hosts eco events ahead of Environment Day', href: `${TS}/newsroom/in-the-news/2026/tata-steel-hosts-eco-events-ahead-of-environment-day/`, date: 'May 29, 2026' },
  { title: 'Tata Steel Foundation Celebrates World Menstrual Hygiene Day', href: `${TS}/newsroom/in-the-news/2026/tata-steel-foundation-celebrates-world-menstrual-hygiene-day/`, date: 'May 29, 2026' },
  { title: 'Tata Sons - should it be listed or remain unlisted?', href: `${TS}/newsroom/in-the-news/2026/tata-sons-should-it-be-listed-or-remain-unlisted/`, date: 'May 29, 2026' },
  { title: 'Mental health at work: Building a culture of emotional well-being', href: `${TS}/newsroom/in-the-news/2026/mental-health-at-work-building-a-culture-of-emotional-well-being/`, date: 'May 28, 2026' },
  { title: 'TSAF Shines in Kolkata Rowing', href: `${TS}/newsroom/in-the-news/2026/tsaf-shines-in-kolkata-rowing/`, date: 'May 31, 2026' },
  { title: 'Tata Steel Signs MoU with University of Science and Technology Beijing', href: `${TS}/newsroom/in-the-news/2026/tata-steel-signs-mou-with-university-of-science-and-technology-beijing/`, date: 'May 27, 2026' },
  { title: 'National Trends', href: `${TS}/newsroom/in-the-news/2026/national-trends/`, date: 'May 31, 2026' },
  { title: '16-day summer camp concludes', href: `${TS}/newsroom/in-the-news/2026/16-day-summer-camp-concludes/`, date: 'May 31, 2026' },
  { title: 'Tata Steel recognised as Steel Sustainability Champion by worldsteel', href: `${TS}/newsroom/in-the-news/2026/tata-steel-recognised-as-steel-sustainability-champion-by-worldsteel/`, date: 'Apr 15, 2026' },
];

function optimizeImages(scope) {
  scope.querySelectorAll('img').forEach((img) => {
    // Media cards sit near the bottom of the page — lazy-load their thumbnails
    // regardless of delivery mode (doc renders <img>; xwalk renders anchors).
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  });
  scope.querySelectorAll('picture > img').forEach((img) => {
    // Only run the AEM image optimizer on same-origin media. External absolute
    // URLs (e.g. tatasteel.com thumbnails) must keep their full src — the
    // optimizer rewrites them to a broken relative path, so the image 404s.
    const src = img.getAttribute('src') || '';
    const isExternal = /^https?:\/\//i.test(src) && !src.startsWith(window.location.origin);
    if (isExternal) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
}

// Build a text-only card <li> (no thumbnail) for the In The News list.
function buildNewsCard({ title, href, date }) {
  const li = document.createElement('li');
  const body = document.createElement('div');
  body.className = 'cards-media-card-body';
  const titleP = document.createElement('p');
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = title;
  titleP.append(a);
  const dateP = document.createElement('p');
  dateP.textContent = date;
  body.append(titleP, dateP);
  li.append(body);
  return li;
}

export default function decorate(block) {
  // In xwalk/JCR delivery (and when the Universal Editor re-decorates the
  // block) an image reference field renders as a bare <a href="...jpg">, not a
  // <picture>. Convert those anchors to <picture><img> so the image-cell
  // detection below works and the thumbnail is visible everywhere.
  block.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(href) && !a.closest('picture')) {
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.setAttribute('src', href);
      img.setAttribute('alt', (a.textContent || '').trim().replace(/^https?:\/\/\S+$/, ''));
      // Media cards sit near the bottom of the page — lazy-load their
      // thumbnails so they stay off the initial (mobile) critical path.
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      picture.append(img);
      a.replaceWith(picture);
    }
  });

  // Press Release list (from authored content).
  const pressList = document.createElement('ul');
  pressList.className = 'cards-media-list';
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-media-card-image';
      else div.className = 'cards-media-card-body';
    });
    pressList.append(li);
  });
  optimizeImages(pressList);

  // In The News list (supplied above).
  const newsList = document.createElement('ul');
  newsList.className = 'cards-media-list';
  IN_THE_NEWS.forEach((item) => newsList.append(buildNewsCard(item)));
  newsList.hidden = true;

  block.textContent = '';
  block.append(pressList, newsList);

  // Wire the sibling tabs-nav buttons (Press Release / In The News) to toggle
  // which list is shown. The tabs-nav block is a sibling inside the same
  // .section.media, so search up to the section.
  const section = block.closest('.section') || document;
  const tabButtons = [...section.querySelectorAll('.tabs-nav .tabs-nav-tab')];
  const lists = [pressList, newsList];
  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      lists.forEach((list, i) => { list.hidden = i !== idx; });
    });
  });
}
