/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-banner.js
  function parse(element, { document }) {
    const bgUrl = (el) => {
      if (!el) return "";
      const style = el.getAttribute("style") || "";
      const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      return m ? m[1] : "";
    };
    const slideImageUrl = (li) => {
      if (!li) return "";
      const desktop = li.querySelector(".banner_images.hidden-xs");
      const mobile = li.querySelector(".banner_images.visible-xs");
      return bgUrl(desktop) || bgUrl(mobile) || "";
    };
    const pagerLinks = Array.from(element.querySelectorAll("#bx-pager li a.thumblink"));
    const lis = Array.from(element.querySelectorAll("ul.bxslider > li"));
    const liByHref = /* @__PURE__ */ new Map();
    lis.forEach((li) => {
      const a = li.querySelector("a[href]");
      const href = a ? a.getAttribute("href") : "";
      if (href && !liByHref.has(href)) liByHref.set(href, li);
    });
    const buildRow = (href, labelText, li) => {
      const imgUrl = slideImageUrl(li);
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:media_image "));
      if (imgUrl) {
        const img = document.createElement("img");
        img.setAttribute("src", imgUrl);
        if (labelText) img.setAttribute("alt", labelText);
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:content_text "));
      if (href) {
        const a = document.createElement("a");
        a.setAttribute("href", href);
        a.textContent = labelText || href;
        textCell.appendChild(a);
      } else if (labelText) {
        const h = document.createElement("h3");
        h.textContent = labelText;
        textCell.appendChild(h);
      }
      return [imageCell, textCell];
    };
    const cells = [];
    if (pagerLinks.length) {
      pagerLinks.forEach((pager) => {
        const href = pager.getAttribute("href") || "";
        const em = pager.querySelector("em");
        const labelText = em ? em.textContent.trim() : "";
        const li = href ? liByHref.get(href) : null;
        if (href || labelText) cells.push(buildRow(href, labelText, li));
      });
    } else {
      const seen = /* @__PURE__ */ new Set();
      lis.forEach((li) => {
        const a = li.querySelector("a[href]");
        const href = a ? a.getAttribute("href") : "";
        if (href && seen.has(href)) return;
        if (href) seen.add(href);
        if (!href && !slideImageUrl(li)) return;
        cells.push(buildRow(href, "", li));
      });
    }
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-quote.js
  function parse2(element, { document }) {
    const bgUrl = (el) => {
      if (!el) return "";
      const style = el.getAttribute("style") || "";
      const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      return m ? m[1] : "";
    };
    const slideImageUrl = (slide) => {
      const desktop = slide.querySelector(".bxSlideWrapper.hidden-xs");
      const mobile = slide.querySelector(".bxSlideWrapper.visible-xs");
      const bg = bgUrl(desktop) || bgUrl(mobile);
      if (bg) return bg;
      const img = slide.querySelector(".bxSlideWrapper.hidden-xs img, .bxSlideWrapper.visible-xs img, img");
      return img && img.getAttribute("src") ? img.getAttribute("src") : "";
    };
    const slideTextNodes = (slide) => {
      const cap = slide.querySelector(".banner_cap_txt");
      if (!cap) return [];
      return Array.from(cap.querySelectorAll("p, h1, h2, h3, h4, blockquote, span, strong")).filter((n) => n.textContent && n.textContent.trim());
    };
    const slides = Array.from(element.querySelectorAll(".bxSlide"));
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    slides.forEach((slide) => {
      const imgUrl = slideImageUrl(slide);
      if (imgUrl) {
        if (seen.has(imgUrl)) return;
        seen.add(imgUrl);
      }
      const textNodes = slideTextNodes(slide);
      if (!imgUrl && textNodes.length === 0) return;
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:media_image "));
      if (imgUrl) {
        const img = document.createElement("img");
        img.setAttribute("src", imgUrl);
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:content_text "));
      textNodes.forEach((n) => textCell.appendChild(n.cloneNode(true)));
      cells.push([imageCell, textCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-quote", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stats.js
  function parse3(element, { document }) {
    const bgUrl = (el) => {
      if (!el) return "";
      const style = el.getAttribute("style") || "";
      const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      return m ? m[1] : "";
    };
    const cells = [];
    const addCard = (imgUrl, textNodes) => {
      const imageCell = document.createDocumentFragment();
      if (imgUrl) {
        imageCell.appendChild(document.createComment(" field:image "));
        const img = document.createElement("img");
        img.setAttribute("src", imgUrl);
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      const valid = (textNodes || []).filter((n) => n && (n.textContent ? n.textContent.trim() : true));
      if (valid.length) {
        textCell.appendChild(document.createComment(" field:text "));
        valid.forEach((n) => textCell.appendChild(n.cloneNode(true)));
      }
      if (!imgUrl && valid.length === 0) return;
      cells.push([imageCell, textCell]);
    };
    const tiles = Array.from(element.querySelectorAll(":scope > .tile, .impacts-wrapper > .tile"));
    const statsText = element.querySelector(".stats_text");
    if (tiles.length) {
      tiles.forEach((tile) => {
        const nodes = [];
        const stat = tile.querySelector(".right-per");
        if (stat) {
          const h = document.createElement("h3");
          h.textContent = stat.textContent.replace(/\s+/g, " ").trim();
          nodes.push(h);
        }
        Array.from(tile.children).forEach((c) => {
          if (c.tagName === "SPAN" && c.textContent.trim()) {
            const p = document.createElement("p");
            p.textContent = c.textContent.replace(/\s+/g, " ").trim();
            nodes.push(p);
          }
        });
        addCard("", nodes);
      });
    } else if (statsText || element.querySelector(".stats_bg")) {
      const imgUrl = bgUrl(element.querySelector(".stats_bg"));
      const textNodes = statsText ? Array.from(statsText.querySelectorAll("p, h1, h2, h3, h4, h5, h6")).filter((n) => n.textContent.trim()) : [];
      if (statsText && textNodes.length === 0 && statsText.textContent.trim()) {
        const p = document.createElement("p");
        p.innerHTML = statsText.innerHTML;
        textNodes.push(p);
      }
      addCard(imgUrl, textNodes);
    }
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-investor.js
  function parse4(element, { document }) {
    const cells = [];
    const boxes = Array.from(element.querySelectorAll(".invest_box"));
    boxes.forEach((box) => {
      const clone = box.cloneNode(true);
      clone.querySelectorAll(".market_updown, img").forEach((n) => n.remove());
      clone.querySelectorAll(".clearfix").forEach((n) => n.remove());
      clone.querySelectorAll("a h1, a h2, a h3, a h4, a h5, a h6").forEach((h) => {
        h.replaceWith(document.createTextNode(h.textContent.trim()));
      });
      const textNodes = Array.from(clone.children).filter(
        (n) => n.textContent && n.textContent.trim()
      );
      if (textNodes.length === 0) return;
      const imageCell = document.createDocumentFragment();
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => textCell.appendChild(n));
      cells.push([imageCell, textCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-investor", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-media.js
  function parse5(element, { document }) {
    const openUrl = (el) => {
      if (!el) return "";
      const oc = el.getAttribute("onclick") || "";
      const m = oc.match(/window\.open\(\s*['"]([^'"]+)['"]/i);
      return m ? m[1] : "";
    };
    const cells = [];
    let items = Array.from(element.querySelectorAll("#media_gallery > .items"));
    if (items.length === 0) items = Array.from(element.querySelectorAll(".items"));
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const inner = item.querySelector(".media_cont_bx");
      const href = openUrl(item) || openUrl(inner);
      const imageCell = document.createDocumentFragment();
      const img = item.querySelector(".media_img_bx img, img");
      if (img && img.getAttribute("src")) {
        imageCell.appendChild(document.createComment(" field:image "));
        const newImg = document.createElement("img");
        newImg.setAttribute("src", img.getAttribute("src"));
        const alt = img.getAttribute("alt");
        if (alt) newImg.setAttribute("alt", alt);
        imageCell.appendChild(newImg);
      }
      const headlineEl = item.querySelector(".media_txt_bx p");
      const dateEl = item.querySelector(".media_txt_bx .upload_time");
      const headline = headlineEl ? headlineEl.textContent.replace(/\s+/g, " ").trim() : "";
      const date = dateEl ? dateEl.textContent.replace(/\s+/g, " ").trim() : "";
      if (!headline && !img) return;
      const key = `${href}|${headline}`;
      if (seen.has(key)) return;
      seen.add(key);
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (headline) {
        const p = document.createElement("p");
        if (href) {
          const a = document.createElement("a");
          a.setAttribute("href", href);
          a.textContent = headline;
          p.appendChild(a);
        } else {
          p.textContent = headline;
        }
        textCell.appendChild(p);
      }
      if (date) {
        const dp = document.createElement("p");
        dp.textContent = date;
        textCell.appendChild(dp);
      }
      cells.push([imageCell, textCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-nav.js
  function parse6(element, { document }) {
    const cells = [];
    const addTab = (label, { heading, image, richtextNodes } = {}) => {
      if (!label && !heading && !image && (!richtextNodes || richtextNodes.length === 0)) return;
      const titleCell = document.createDocumentFragment();
      titleCell.appendChild(document.createComment(" field:title "));
      if (label) titleCell.appendChild(document.createTextNode(label));
      const contentCell = document.createDocumentFragment();
      if (heading) {
        contentCell.appendChild(document.createComment(" field:content_heading "));
        const h = document.createElement("h3");
        h.textContent = heading;
        contentCell.appendChild(h);
      }
      if (image) {
        contentCell.appendChild(document.createComment(" field:content_image "));
        contentCell.appendChild(image);
      }
      if (richtextNodes && richtextNodes.length) {
        contentCell.appendChild(document.createComment(" field:content_richtext "));
        richtextNodes.forEach((n) => contentCell.appendChild(n));
      }
      cells.push([titleCell, contentCell]);
    };
    const prodBoxes = Array.from(element.querySelectorAll(".prod_box"));
    let filterLinks = Array.from(element.querySelectorAll(".filter_link ul li a"));
    if (!filterLinks.length && element.matches && element.matches(".filter_link")) {
      filterLinks = Array.from(element.querySelectorAll("ul li a"));
    }
    if (prodBoxes.length) {
      prodBoxes.forEach((box) => {
        const a = box.querySelector("a");
        const nameEl = box.querySelector(".prod_name");
        const label = nameEl && nameEl.textContent.trim() || a && (a.getAttribute("title") || a.textContent.trim()) || "";
        const srcImg = box.querySelector(".prod_img img, img");
        let image = null;
        if (srcImg && srcImg.getAttribute("src")) {
          image = document.createElement("img");
          image.setAttribute("src", srcImg.getAttribute("src"));
          if (label) image.setAttribute("alt", label);
        }
        const richtextNodes = [];
        const href = a ? a.getAttribute("href") : "";
        if (href) {
          const link = document.createElement("a");
          link.setAttribute("href", href);
          link.textContent = label || href;
          richtextNodes.push(link);
        }
        addTab(label, { image, richtextNodes });
      });
    } else if (filterLinks.length) {
      filterLinks.forEach((a) => {
        const liHidden = a.closest("li") && a.closest("li").getAttribute("style") === "display: none;";
        const selfHidden = (a.getAttribute("style") || "").includes("display: none");
        if (liHidden || selfHidden) return;
        const label = (a.getAttribute("data-letters") || a.textContent || "").trim();
        if (!label) return;
        const p = document.createElement("p");
        p.textContent = label;
        addTab(label, { richtextNodes: [p] });
      });
    }
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-nav", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/tatasteel-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function unwrap(el) {
    if (!el || !el.parentNode) return;
    const parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".accessibility-tools",
        "#consolPopup",
        ".consolPopup",
        "#fp-nav",
        ".mouse-trail"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".bx-controls",
        ".bx-pager",
        ".bx-controls-direction",
        ".bx-clone"
        // cloned slides bxSlider injects for infinite loop (if present)
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".jspHorizontalBar",
        ".jspVerticalBar"
      ]);
      element.querySelectorAll(".bx-viewport").forEach(unwrap);
      element.querySelectorAll(".bx-wrapper").forEach(unwrap);
      element.querySelectorAll(".jspPane").forEach(unwrap);
      element.querySelectorAll(".jspContainer").forEach(unwrap);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".over_menu",
        "header",
        "footer",
        "#bx-pager"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "link",
        "script",
        "noscript",
        "iframe",
        "source"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("style");
      });
    }
  }

  // tools/importer/transformers/tatasteel-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const doc = element.ownerDocument;
    const resolved = sections.map((section) => ({
      section,
      el: element.querySelector(section.selector || `#${section.id}`)
    })).filter((r) => r.el);
    resolved.forEach((entry, idx) => {
      if (!entry.section.style) return;
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: "Section Metadata",
        cells: { style: entry.section.style }
      });
      const next = resolved[idx + 1];
      if (next && next.el && next.el.parentNode) {
        next.el.parentNode.insertBefore(metaBlock, next.el);
      } else {
        element.appendChild(metaBlock);
      }
    });
    for (let i = resolved.length - 1; i >= 0; i -= 1) {
      const { el } = resolved[i];
      if (el.previousElementSibling) {
        const hr = doc.createElement("hr");
        el.parentNode.insertBefore(hr, el);
      }
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Tata Steel corporate homepage - fullPage.js single-page layout with hero banner slideshow, sustainability slider, production/product gallery, investor boxes, media/video gallery, and stats section with footer",
    urls: [
      "https://www.tatasteel.com/"
    ],
    blocks: [
      {
        name: "carousel-banner",
        instances: ["#section0 div.banner div.banner_slideshow"]
      },
      {
        name: "carousel-quote",
        instances: ["#section2 div.banner.sustainabilityNew"]
      },
      {
        name: "cards-stats",
        instances: ["#section2 div.impacts-wrapper", "#section6 div.stats_box"]
      },
      {
        name: "tabs-nav",
        instances: ["#section3 div.production_sector div.product_gallery", "#section5 div.media_cont div.filter_link"]
      },
      {
        name: "cards-investor",
        instances: ["#section4 div.investor_box div.investor_boxes"]
      },
      {
        name: "cards-media",
        instances: ["#section5 div.media_cont div.media_gallery"]
      }
    ],
    sections: [
      {
        id: "section2",
        name: "sustainability",
        selector: "#section2",
        style: "sustainability",
        blocks: ["carousel-quote", "cards-stats"],
        defaultContent: ["#section2 h3.sectiontitle"]
      },
      {
        id: "section3",
        name: "products",
        selector: "#section3",
        style: "products",
        blocks: ["tabs-nav"],
        defaultContent: ["#section3 h3.sectiontitle"]
      },
      {
        id: "section4",
        name: "investors",
        selector: "#section4",
        style: "investors",
        blocks: ["cards-investor"],
        defaultContent: ["#section4 h3.sectiontitle"]
      },
      {
        id: "section5",
        name: "media",
        selector: "#section5",
        style: "media",
        blocks: ["tabs-nav", "cards-media"],
        defaultContent: ["#section5 h3.sectiontitle"]
      },
      {
        id: "section6",
        name: "stats",
        selector: "#section6",
        style: "stats",
        blocks: ["cards-stats"],
        defaultContent: []
      }
    ]
  };
  var parsers = {
    "carousel-banner": parse,
    "carousel-quote": parse2,
    "cards-stats": parse3,
    "cards-investor": parse4,
    "cards-media": parse5,
    "tabs-nav": parse6
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      let pathname = new URL(params.originalURL).pathname.replace(/\.html$/, "").replace(/\/$/, "");
      if (pathname === "") pathname = "/index";
      const path = WebImporter.FileUtils.sanitizePath(pathname);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
