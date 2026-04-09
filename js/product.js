/* ============================================
   DEVA DECOR — Product Page Module
   Loaded only on product.html
   ============================================ */

(function () {
  'use strict';

  const D = window.DevaDecor;
  if (!D) return;
  const $ = D.$;
  const $$ = D.$$;

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function formatDescription(raw) {
    const blocks = raw.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
    if (!blocks.length) return '';
    let html = '';
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const isListBlock = lines.length > 1 && lines.every(l => l.length < 120);
      if (i === 0 && lines.length === 1 && lines[0].length < 120) {
        html += `<h4 class="desc-heading">${escHtml(lines[0])}</h4>`;
      } else if (isListBlock) {
        const headerIdx = lines.findIndex(l => l.endsWith(':'));
        if (headerIdx >= 0) {
          html += `<p class="desc-subhead">${escHtml(lines[headerIdx])}</p>`;
          const items = lines.filter((_, j) => j !== headerIdx);
          if (items.length) html += '<ul class="desc-list">' + items.map(l => `<li>${escHtml(l)}</li>`).join('') + '</ul>';
        } else {
          html += '<ul class="desc-list">' + lines.map(l => `<li>${escHtml(l)}</li>`).join('') + '</ul>';
        }
      } else {
        html += lines.map(l => `<p>${escHtml(l)}</p>`).join('');
      }
    }
    return html;
  }

  // ─── Product Page Data Population ───
  function initProductPage() {
    const detail = $('.product-detail');
    if (!detail) return;
    const products = D.products;
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const id = paramId ? parseInt(paramId, 10) : parseInt(detail.dataset.productId, 10);
    const product = products.find(p => p.id === id) || products[0];
    if (!product) return;

    const titleEl = $('.product-title');
    const priceEl = $('.price-current');
    const compareEl = $('.price-compare');
    const saveEl = $('.price-save');
    const badgeEl = $('.product-badge');
    const mainImg = $('#mainImage');
    const amazonBtn = $('#buyOnAmazon');
    const ratingContainer = $('.product-meta .product-rating');

    const cur = product.currency || '₹';
    if (titleEl) titleEl.textContent = product.name;
    if (priceEl) {
      if (product.price) {
        priceEl.textContent = cur + product.price;
      } else {
        priceEl.textContent = 'See price on Amazon';
        priceEl.classList.add('price-check-amazon');
      }
    }
    if (compareEl) {
      if (product.comparePrice) {
        compareEl.textContent = cur + product.comparePrice;
        compareEl.style.display = '';
        if (saveEl) {
          const pct = Math.round((1 - product.price / product.comparePrice) * 100);
          saveEl.textContent = 'Save ' + pct + '%';
          saveEl.style.display = '';
        }
      } else {
        compareEl.style.display = 'none';
        if (saveEl) saveEl.style.display = 'none';
      }
    }
    if (badgeEl) badgeEl.textContent = product.badge || 'Curated Pick';

    const brandEl = $('.product-brand');
    if (brandEl && product.brand) brandEl.textContent = product.brand;

    const bulletsList = $('#bulletsList');
    if (bulletsList && product.bullets && product.bullets.length) {
      bulletsList.innerHTML = product.bullets.map(b => `<li>${escHtml(b)}</li>`).join('');
    }

    const descContent = $('#descriptionContent');
    const descAccordion = $('#accordionDescription');
    const rawDesc = product.description || '';
    if (descContent && rawDesc) {
      descContent.innerHTML = formatDescription(rawDesc);
    } else if (descAccordion) {
      descAccordion.style.display = 'none';
    }

    if (amazonBtn) amazonBtn.href = D.getAmazonLink(product);
    const reviewsLink = $('#reviewsAmazonLink');
    if (reviewsLink) reviewsLink.href = D.getAmazonLink(product);
    if (ratingContainer) ratingContainer.innerHTML = D.renderStars(product.rating);

    const priceNote = $('.price-freshness');
    if (priceNote) {
      if (product.price) {
        priceNote.textContent = 'Price as of ' + new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
      } else {
        priceNote.style.display = 'none';
      }
    }

    const images = product.images && product.images.length ? product.images : [product.image];
    if (mainImg) { mainImg.src = images[0]; mainImg.alt = product.name; }
    const thumbContainer = $('.gallery-thumbs');
    if (thumbContainer) {
      thumbContainer.innerHTML = images.map((img, i) =>
        `<button class="gallery-thumb${i === 0 ? ' active' : ''}" data-img="${img}">
          <img src="${img}" alt="${product.name} view ${i + 1}" loading="lazy" width="150" height="150">
        </button>`
      ).join('');
      initProductGallery();
    }

    const breadcrumb = $('.breadcrumb .container');
    if (breadcrumb) {
      const catSlug = product.category.toLowerCase().replace(/\s+/g, '-');
      breadcrumb.innerHTML = `<a href="index.html">Home</a><span>/</span><a href="shop.html?cat=${catSlug}">${product.category}</a><span>/</span><span>${product.name}</span>`;
    }

    document.title = product.name + ' — Deva Decor';

    const canonicalUrl = new URL('product.html', window.location.href);
    canonicalUrl.search = 'id=' + encodeURIComponent(String(product.id));
    const canonicalHref = canonicalUrl.href.split('#')[0];
    const canonicalEl = document.getElementById('canonicalLink');
    if (canonicalEl) canonicalEl.setAttribute('href', canonicalHref);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalHref);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && product.image) {
      ogImage.setAttribute('content', window.location.origin + '/' + product.image);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', product.name + ' — Deva Decor');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && product.bullets && product.bullets.length) {
      ogDesc.setAttribute('content', product.bullets[0]);
    }

    var schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'image': window.location.origin + '/' + (product.image || ''),
      'description': product.description || product.name,
      'brand': { '@type': 'Brand', 'name': product.brand || 'Deva Decor' }
    };
    if (product.price) {
      schema.offers = {
        '@type': 'Offer',
        'url': window.location.href,
        'priceCurrency': 'INR',
        'price': String(product.price),
        'availability': 'https://schema.org/InStock'
      };
    }
    var schemaEl = document.getElementById('productSchema');
    if (schemaEl) schemaEl.textContent = JSON.stringify(schema);
  }

  // ─── Product Gallery ───
  function initProductGallery() {
    const main = $('#mainImage');
    const thumbs = $$('.gallery-thumb');
    if (!main || !thumbs.length) return;
    thumbs.forEach(t => {
      t.addEventListener('click', () => {
        thumbs.forEach(th => th.classList.remove('active'));
        t.classList.add('active');
        main.style.opacity = '0';
        setTimeout(() => { main.src = t.dataset.img; main.style.opacity = '1'; }, 200);
      });
    });
    const zoom = $('#galleryZoom');
    if (zoom) {
      zoom.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'gallery-lightbox';
        overlay.innerHTML = `<img src="${main.src}" alt="Zoomed view"><button class="gallery-lightbox-close" aria-label="Close">&times;</button>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        overlay.addEventListener('click', () => { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 300); });
      });
    }
  }

  // ─── Gallery Swipe (Mobile) ───
  function initGallerySwipe() {
    const galleryMain = $('.gallery-main');
    const mainImg = $('#mainImage');
    const thumbs = $$('.gallery-thumb');
    if (!galleryMain || !mainImg || thumbs.length < 2 || window.innerWidth >= 1024) return;
    let currentIdx = 0, startX = 0, diffX = 0;
    galleryMain.addEventListener('touchstart', e => { startX = e.touches[0].clientX; diffX = 0; }, { passive: true });
    galleryMain.addEventListener('touchmove', e => { diffX = e.touches[0].clientX - startX; }, { passive: true });
    galleryMain.addEventListener('touchend', () => {
      if (Math.abs(diffX) < 40) return;
      currentIdx = diffX < 0 ? Math.min(currentIdx + 1, thumbs.length - 1) : Math.max(currentIdx - 1, 0);
      thumbs.forEach((t, i) => t.classList.toggle('active', i === currentIdx));
      mainImg.style.opacity = '0';
      setTimeout(() => { mainImg.src = thumbs[currentIdx].dataset.img; mainImg.style.opacity = '1'; }, 200);
    });
  }

  // ─── Hover Zoom ───
  function initHoverZoom() {
    const galleryMain = $('.gallery-main');
    const mainImg = $('#mainImage');
    if (!galleryMain || !mainImg || window.innerWidth < 1024) return;
    galleryMain.addEventListener('mousemove', e => {
      const rect = galleryMain.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
    });
  }

  // ─── Sticky ATC Bar ───
  function initStickyATC() {
    const mainBtn = $('#buyOnAmazon');
    if (!mainBtn) return;
    const bar = document.createElement('div');
    bar.className = 'sticky-atc';
    const titleEl = $('.product-title');
    const priceEl = $('.price-current');
    bar.innerHTML = `<span class="sticky-atc-name">${titleEl ? titleEl.textContent : ''}</span><span class="sticky-atc-price">${priceEl ? priceEl.textContent : ''}</span><a href="${mainBtn.href}" target="_blank" rel="nofollow" class="btn btn-primary">Check Price on Amazon</a>`;
    document.body.appendChild(bar);
    const observer = new IntersectionObserver(entries => {
      bar.classList.toggle('visible', !entries[0].isIntersecting);
    }, { threshold: 0 });
    observer.observe(mainBtn);
  }

  // ─── Product Image Magnifier ───
  function initImageMagnifier() {
    const galleryMain = $('.gallery-main');
    const mainImg = $('#mainImage');
    const gallery = $('.product-gallery');
    if (!galleryMain || !mainImg || !gallery || window.innerWidth < 1024) return;
    const result = document.createElement('div');
    result.className = 'magnifier-result';
    gallery.appendChild(result);
    const crosshair = document.createElement('div');
    crosshair.className = 'magnifier-crosshair';
    galleryMain.appendChild(crosshair);
    galleryMain.addEventListener('mouseenter', () => {
      result.style.display = 'block';
      crosshair.style.display = 'block';
    });
    galleryMain.addEventListener('mouseleave', () => {
      result.style.display = 'none';
      crosshair.style.display = 'none';
    });
    galleryMain.addEventListener('mousemove', e => {
      const rect = galleryMain.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cw = 80, ch = 80;
      crosshair.style.left = Math.max(0, Math.min(x - cw / 2, rect.width - cw)) + 'px';
      crosshair.style.top = Math.max(0, Math.min(y - ch / 2, rect.height - ch)) + 'px';
      const bgX = (x / rect.width) * 100;
      const bgY = (y / rect.height) * 100;
      result.style.backgroundImage = `url(${mainImg.src})`;
      result.style.backgroundPosition = `${bgX}% ${bgY}%`;
    });
  }

  // ─── Color Variant Swatches ───
  function initColorSwatches() {
    const container = $('#productSwatches');
    if (!container) return;
    const products = D.products;
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    const product = products.find(p => p.id === id);
    if (!product || !product.variants || !product.variants.length) {
      container.style.display = 'none';
      return;
    }
    const mainImg = $('#mainImage');
    container.innerHTML = `
      <span class="swatch-label">Color:</span>
      <div class="swatch-options">
        ${product.variants.map((v, i) =>
          `<button class="swatch-btn${i === 0 ? ' active' : ''}" data-idx="${i}" title="${v.name}" style="background:${v.color}"></button>`
        ).join('')}
      </div>
      <span class="swatch-name">${product.variants[0].name}</span>`;
    const nameEl = container.querySelector('.swatch-name');
    $$('.swatch-btn', container).forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.swatch-btn', container).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const idx = parseInt(btn.dataset.idx, 10);
        nameEl.textContent = product.variants[idx].name;
        if (mainImg && product.variants[idx].image) {
          mainImg.style.opacity = '0';
          setTimeout(() => { mainImg.src = product.variants[idx].image; mainImg.style.opacity = '1'; }, 150);
        }
      });
    });
  }

  // ─── Initialize Product Page Features ───
  function initProductFeatures() {
    if (!$('.product-detail')) return;
    if (!D.products || !D.products.length) {
      setTimeout(initProductFeatures, 100);
      return;
    }
    initProductPage();
    initGallerySwipe();
    initHoverZoom();
    initStickyATC();
    initImageMagnifier();
    initColorSwatches();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initProductFeatures, 50));
  } else {
    setTimeout(initProductFeatures, 50);
  }
})();
