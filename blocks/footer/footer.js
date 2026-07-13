import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/* White brand glyphs (24x24 viewBox) matching the source footer icons.
   Keyed by a substring of the social link href. */
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.6V13h2.7v8h3.2z"/></svg>',
  'twitter.com': '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6.1L5.6 21H2.5l7-8L2.3 3h6.1l4.3 5.6L17.5 3zm-1 16h1.7L7.6 4.8H5.8L16.5 19z"/></svg>',
  'x.com': '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6.1L5.6 21H2.5l7-8L2.3 3h6.1l4.3 5.6L17.5 3zm-1 16h1.7L7.6 4.8H5.8L16.5 19z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.94 8.5v11H3.56v-11h3.38zM5.25 3.5a1.96 1.96 0 1 1 0 3.92 1.96 1.96 0 0 1 0-3.92zM20.44 19.5h-3.38v-5.9c0-1.4-.5-2.36-1.76-2.36-.96 0-1.53.65-1.78 1.28-.09.22-.11.53-.11.85v6.13H9.03s.04-9.95 0-11h3.38v1.56c.45-.69 1.25-1.68 3.05-1.68 2.23 0 3.98 1.46 3.98 4.6v6.52z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C18.3 5.1 12 5.1 12 5.1s-6.3 0-7.83.42A2.5 2.5 0 0 0 2.4 7.3C2 8.8 2 12 2 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77C5.7 18.9 12 18.9 12 18.9s6.3 0 7.83-.42a2.5 2.5 0 0 0 1.77-1.77C22 15.2 22 12 22 12zM10 15.1V8.9l5.2 3.1-5.2 3.1z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4.6c2.4 0 2.7 0 3.6.05 2.45.11 3.6 1.27 3.7 3.7.05.9.05 1.2.05 3.6s0 2.7-.05 3.6c-.1 2.43-1.25 3.6-3.7 3.7-.9.05-1.2.05-3.6.05s-2.7 0-3.6-.05c-2.46-.11-3.6-1.28-3.7-3.7-.05-.9-.05-1.2-.05-3.6s0-2.7.05-3.6c.1-2.43 1.25-3.6 3.7-3.7.9-.05 1.2-.05 3.6-.05zM12 2.8c-2.44 0-2.75.01-3.7.06-3.28.15-5.1 1.97-5.25 5.25C3 9.05 3 9.36 3 11.8s0 2.75.05 3.7c.15 3.28 1.97 5.1 5.25 5.25.95.05 1.26.06 3.7.06s2.75-.01 3.7-.06c3.28-.15 5.1-1.97 5.25-5.25.05-.95.05-1.26.05-3.7s0-2.75-.05-3.7c-.15-3.28-1.97-5.1-5.25-5.25C14.75 2.81 14.44 2.8 12 2.8zm0 4.86A4.14 4.14 0 1 0 12 16a4.14 4.14 0 0 0 0-8.28zm0 6.83a2.69 2.69 0 1 1 0-5.38 2.69 2.69 0 0 1 0 5.38zm4.31-6.99a.97.97 0 1 0 0 1.94.97.97 0 0 0 0-1.94z"/></svg>',
};

function decorateSocialIcons(footer) {
  // Find the <ul> whose links are social platforms and replace text with icons.
  const links = [...footer.querySelectorAll('a')].filter((a) => {
    const h = (a.getAttribute('href') || '').toLowerCase();
    return Object.keys(SOCIAL_ICONS).some((k) => h.includes(k));
  });
  if (!links.length) return;

  const socialUl = links[0].closest('ul');
  links.forEach((a) => {
    const h = (a.getAttribute('href') || '').toLowerCase();
    const key = Object.keys(SOCIAL_ICONS).find((k) => h.includes(k));
    const label = a.textContent.trim();
    a.setAttribute('aria-label', label);
    a.setAttribute('title', label);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    a.innerHTML = SOCIAL_ICONS[key];
    // Platform class so each icon renders in its brand color (like the source).
    const platform = key.replace('.com', '');
    a.classList.add('footer-social-icon', `footer-social-${platform}`);
  });

  if (socialUl && !socialUl.previousElementSibling?.classList?.contains('footer-follow')) {
    const label = document.createElement('span');
    label.className = 'footer-follow';
    label.textContent = 'Follow Us On';
    socialUl.parentElement.insertBefore(label, socialUl);
    socialUl.parentElement.classList.add('footer-social');
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment. The footer doc lives under /content (co-located
  // with the page content); prefer it, then fall back to metadata / default.
  const footerMeta = getMetadata('footer');
  let footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/content/footer';
  let fragment = await loadFragment(footerPath);
  if (!fragment || !fragment.firstElementChild) {
    footerPath = '/footer';
    fragment = await loadFragment(footerPath);
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  decorateSocialIcons(footer);

  block.append(footer);
}
