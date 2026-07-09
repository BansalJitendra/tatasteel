/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselBannerParser from './parsers/carousel-banner.js';
import carouselQuoteParser from './parsers/carousel-quote.js';
import cardsStatsParser from './parsers/cards-stats.js';
import cardsInvestorParser from './parsers/cards-investor.js';
import cardsMediaParser from './parsers/cards-media.js';
import tabsNavParser from './parsers/tabs-nav.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/tatasteel-cleanup.js';
import sectionsTransformer from './transformers/tatasteel-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Tata Steel corporate homepage - fullPage.js single-page layout with hero banner slideshow, sustainability slider, production/product gallery, investor boxes, media/video gallery, and stats section with footer',
  urls: [
    'https://www.tatasteel.com/'
  ],
  blocks: [
    {
      name: 'carousel-banner',
      instances: ['#section0 div.banner div.banner_slideshow']
    },
    {
      name: 'carousel-quote',
      instances: ['#section2 div.banner.sustainabilityNew']
    },
    {
      name: 'cards-stats',
      instances: ['#section2 div.impacts-wrapper', '#section6 div.stats_box']
    },
    {
      name: 'tabs-nav',
      instances: ['#section3 div.production_sector div.product_gallery', '#section5 div.media_cont div.filter_link']
    },
    {
      name: 'cards-investor',
      instances: ['#section4 div.investor_box div.investor_boxes']
    },
    {
      name: 'cards-media',
      instances: ['#section5 div.media_cont div.media_gallery']
    }
  ],
  sections: [
    {
      id: 'section2',
      name: 'sustainability',
      selector: '#section2',
      style: 'sustainability',
      blocks: ['carousel-quote', 'cards-stats'],
      defaultContent: ['#section2 h3.sectiontitle']
    },
    {
      id: 'section3',
      name: 'products',
      selector: '#section3',
      style: 'products',
      blocks: ['tabs-nav'],
      defaultContent: ['#section3 h3.sectiontitle']
    },
    {
      id: 'section4',
      name: 'investors',
      selector: '#section4',
      style: 'investors',
      blocks: ['cards-investor'],
      defaultContent: ['#section4 h3.sectiontitle']
    },
    {
      id: 'section5',
      name: 'media',
      selector: '#section5',
      style: 'media',
      blocks: ['tabs-nav', 'cards-media'],
      defaultContent: ['#section5 h3.sectiontitle']
    },
    {
      id: 'section6',
      name: 'stats',
      selector: '#section6',
      style: 'stats',
      blocks: ['cards-stats'],
      defaultContent: []
    }
  ]
};

// PARSER REGISTRY
const parsers = {
  'carousel-banner': carouselBannerParser,
  'carousel-quote': carouselQuoteParser,
  'cards-stats': cardsStatsParser,
  'cards-investor': cardsInvestorParser,
  'cards-media': cardsMediaParser,
  'tabs-nav': tabsNavParser,
};

// TRANSFORMER REGISTRY - cleanup runs first, sections last (afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (default homepage "/" to "/index")
    let pathname = new URL(params.originalURL).pathname.replace(/\.html$/, '').replace(/\/$/, '');
    if (pathname === '') pathname = '/index';
    const path = WebImporter.FileUtils.sanitizePath(pathname);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
