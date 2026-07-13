import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel-banner');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-banner-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-banner-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

export function showSlide(block, slideIndex = 0, behavior = 'smooth') {
  const slides = block.querySelectorAll('.carousel-banner-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-banner-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior,
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-banner-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    const goToSlide = () => {
      const slideIndicator = button.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    };
    // Source behaviour: hovering a thumbnail switches the banner. Keep click
    // too for touch/keyboard users.
    button.addEventListener('mouseenter', goToSlide);
    button.addEventListener('focus', goToSlide);
    button.addEventListener('click', goToSlide);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-banner-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

// The authored content references the portrait (mobile) banner stills for some
// slides, which crop badly when covered into the landscape hero box. Remap
// those to the published landscape assets so the baked-in text stays visible.
// (The importer parser is also fixed for future imports; this keeps already
// published content correct without a re-import.)
const LANDSCAPE_IMAGE_REMAP = {
  '/media/21664/500x781.jpg': 'https://www.tatasteel.com/media/21690/cfe-vr-new-experence-500x283px.jpg',
  '/media/25719/4qfy26-financial-results-ts-mobile-banner.jpeg': 'https://www.tatasteel.com/media/25720/4qfy26-financial-results-ts-thumb-banner.jpeg',
};

function remapToLandscape(src) {
  if (!src) return src;
  const hit = Object.keys(LANDSCAPE_IMAGE_REMAP).find((portrait) => src.includes(portrait));
  return hit ? LANDSCAPE_IMAGE_REMAP[hit] : src;
}

// The source plays full-bleed background videos on the desktop hero for the
// Centre for Excellence and 4QFY26 slides (there is no high-res still — only a
// 500px thumbnail, which looks stretched when upscaled). Map those slides to
// their published desktop videos so the hero matches the source.
const VIDEO_BY_IMAGE = [
  { match: '/media/21664/500x781.jpg', video: 'https://www.tatasteel.com/media/21667/1400x790px-video.mp4' },
  { match: 'cfe-vr-new-experence', video: 'https://www.tatasteel.com/media/21667/1400x790px-video.mp4' },
  { match: '4qfy26-financial-results-ts-mobile-banner', video: 'https://www.tatasteel.com/media/25717/4qfy26-financial-results-ts.mp4' },
  { match: '4qfy26-financial-results-ts-thumb-banner', video: 'https://www.tatasteel.com/media/25717/4qfy26-financial-results-ts.mp4' },
];

function videoForImage(src) {
  if (!src) return null;
  const hit = VIDEO_BY_IMAGE.find((m) => src.includes(m.match));
  return hit ? hit.video : null;
}

function buildBannerVideo(src) {
  const video = document.createElement('video');
  video.className = 'carousel-banner-slide-video';
  video.setAttribute('autoplay', '');
  video.muted = true;
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'metadata');
  const source = document.createElement('source');
  source.setAttribute('src', src);
  source.setAttribute('type', 'video/mp4');
  video.append(source);
  return video;
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-banner-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-banner-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-banner-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  // The image cell's media_image reference renders as a bare <a href="...jpg">
  // in xwalk (JCR) delivery, and as a <picture> in doc delivery. In the
  // Universal Editor the block is re-decorated without the global
  // decorateExternalImages pass, so convert an image-URL anchor to an <img>
  // here so the banner is always visible (delivery, preview, and UE alike).
  const imageCell = slide.querySelector('.carousel-banner-slide-image');
  const imageAnchor = imageCell?.querySelector('a[href]');
  if (imageAnchor && /\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(imageAnchor.getAttribute('href') || '')) {
    const img = document.createElement('img');
    img.setAttribute('src', remapToLandscape(imageAnchor.getAttribute('href')));
    img.setAttribute('alt', (imageAnchor.textContent || '').trim().replace(/^https?:\/\/\S+$/, ''));
    imageAnchor.replaceWith(img);
  }

  // Delivery renders the reference as <img> directly (or inside <picture>);
  // remap those portrait stills to their landscape equivalents too.
  imageCell?.querySelectorAll('img').forEach((img) => {
    const remapped = remapToLandscape(img.getAttribute('src'));
    if (remapped !== img.getAttribute('src')) {
      img.setAttribute('src', remapped);
      img.removeAttribute('srcset');
    }
  });

  // Slides whose source hero is a background video (CFE, 4QFY26) get the video
  // rendered full-bleed behind the image, with the still kept as a poster
  // fallback until the video loads. Only load the video on larger (desktop)
  // viewports — the autoplaying MP4s are multi-megabyte and tank mobile
  // performance (LCP/TBT), so on mobile we keep just the still image.
  const isDesktopViewport = window.matchMedia('(width >= 900px)').matches;
  const posterImg = imageCell?.querySelector('img');
  const videoSrc = isDesktopViewport ? videoForImage(posterImg ? posterImg.getAttribute('src') : '') : null;
  if (imageCell && videoSrc) {
    const video = buildBannerVideo(videoSrc);
    if (posterImg && posterImg.getAttribute('src')) {
      video.setAttribute('poster', posterImg.getAttribute('src'));
    }
    imageCell.prepend(video);
    if (posterImg) posterImg.style.display = 'none';
  }

  // The content cell only carries the slide's click-through URL (not display
  // copy). Turn the whole slide into a click-through link and hide the raw URL.
  const contentCell = slide.querySelector('.carousel-banner-slide-content');
  const targetLink = contentCell?.querySelector('a[href]');
  if (targetLink && targetLink.getAttribute('href')) {
    const overlay = document.createElement('a');
    overlay.className = 'carousel-banner-slide-link';
    overlay.setAttribute('href', targetLink.getAttribute('href'));
    const label = (targetLink.textContent || '').trim();
    overlay.setAttribute('aria-label', label && !/^https?:\/\//.test(label) ? label : `Slide ${slideIndex + 1}`);
    slide.append(overlay);
  }

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-banner-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-banner-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-banner-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-banner-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);
    // No prev/next arrows: the source hero has no left/right arrows — slides
    // are switched via the bottom thumbnail nav cards only.
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-banner-slide-indicator');
      indicator.dataset.targetSlide = idx;
      // Build a thumbnail nav card (like the source): each card shows the
      // slide's banner image as a background plus the slide title, matching the
      // original hero pager cards.
      const slideImg = slide.querySelector('.carousel-banner-slide-image img');
      const thumbSrc = slideImg ? (slideImg.getAttribute('src') || '') : '';
      const titleLink = slide.querySelector('.carousel-banner-slide-content a');
      const title = titleLink ? (titleLink.textContent || '').trim() : '';
      const hasTitle = title && !/^https?:\/\//.test(title);
      const label = hasTitle
        ? title
        : `${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}`;
      const titleSpan = hasTitle ? `<span class="carousel-banner-thumb-title">${title}</span>` : '';
      indicator.innerHTML = `<button type="button" aria-label="${label}"${thumbSrc ? ` style="background-image:url('${thumbSrc}')"` : ''}>${titleSpan}</button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  // The hero opens on the LAST slide, so that image is the LCP element. Give it
  // high fetch priority + eager load and mark the other slide images lazy, so
  // the browser prioritizes the visible banner and defers the rest. This helps
  // FCP/Speed Index (the LCP image starts downloading right away).
  const slideImages = [...slidesWrapper.querySelectorAll('.carousel-banner-slide-image img')];
  slideImages.forEach((img, idx) => {
    if (idx === slideImages.length - 1) {
      img.setAttribute('fetchpriority', 'high');
      img.setAttribute('loading', 'eager');
    } else {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    }
  });
  // Preload the LCP banner image so it isn't discovered late (it lives inside a
  // JS-decorated block). Only the last slide's image is the initial LCP.
  const lcpImg = slideImages[slideImages.length - 1];
  const lcpSrc = lcpImg?.getAttribute('src');
  if (lcpSrc && !document.head.querySelector(`link[rel="preload"][href="${lcpSrc}"]`)) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = lcpSrc;
    preload.setAttribute('fetchpriority', 'high');
    document.head.append(preload);
  }

  if (!isSingleSlide) {
    bindEvents(block);
    // The source hero opens on its latest (last) slide — the 119th AGM banner —
    // rather than the first. Match that by jumping to the last slide on load.
    // The block starts hidden (CSS, until .carousel-banner-ready) so the first
    // slide never flashes before we scroll to the last one. Position it
    // synchronously, reveal, then re-assert across a few frames and on window
    // load since media loading / scroll-snap can shift the offset.
    const slideCount = slidesWrapper.querySelectorAll('.carousel-banner-slide').length;
    // While hidden the track uses scroll-behavior:auto (CSS), so setting
    // scrollLeft jumps instantly with no cross-slide animation — that animation
    // was the flicker. Jump to the last slide, then reveal only once the scroll
    // offset has actually landed on the target (retrying across frames).
    const lastSlide = () => slidesWrapper.querySelectorAll('.carousel-banner-slide')[slideCount - 1];
    const jumpToLast = () => {
      const last = lastSlide();
      slidesWrapper.scrollLeft = last.offsetLeft;
      updateActiveSlide(last);
    };
    let attempts = 0;
    const settleAndReveal = () => {
      jumpToLast();
      const target = lastSlide().offsetLeft;
      attempts += 1;
      if (Math.abs(slidesWrapper.scrollLeft - target) <= 2 || attempts > 30) {
        block.classList.add('carousel-banner-ready');
      } else {
        requestAnimationFrame(settleAndReveal);
      }
    };
    requestAnimationFrame(settleAndReveal);
    // Re-assert after later layout shifts (media load) so it stays put.
    setTimeout(jumpToLast, 200);
    setTimeout(jumpToLast, 500);
    // Safety: never leave the banner hidden if something above is delayed.
    setTimeout(() => block.classList.add('carousel-banner-ready'), 600);
    window.addEventListener('load', jumpToLast, { once: true });

    // Auto-rotate through the slides like the source hero. Advance every 5s,
    // pause while the pointer is over the banner, and honor reduced-motion.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      const AUTOPLAY_MS = 5000;
      let timer = null;
      const advance = () => {
        const current = parseInt(block.dataset.activeSlide || '0', 10);
        showSlide(block, (current + 1) % slideCount);
      };
      const start = () => {
        if (!timer) timer = setInterval(advance, AUTOPLAY_MS);
      };
      const stop = () => {
        clearInterval(timer);
        timer = null;
      };
      block.addEventListener('mouseenter', stop);
      block.addEventListener('mouseleave', start);
      block.addEventListener('focusin', stop);
      block.addEventListener('focusout', start);
      // Start after the initial jump-to-last settles.
      setTimeout(start, 600);
    }
  }
}
