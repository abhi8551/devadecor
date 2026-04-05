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

  // ─── Product Page Data Population ───
  function initProductPage() {
    const detail = $('.product-detail');
    if (!detail) return;
    const products = D.products;
    const productDescriptions = D.productDescriptions;
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const id = paramId ? parseInt(paramId, 10) : parseInt(detail.dataset.productId, 10);
    const product = products.find(p => p.id === id) || products[0];
    if (!product) return;

    const titleEl = $('.product-title');
    const priceEl = $('.price-current');
    const compareEl = $('.price-compare');
    const saveEl = $('.price-save');
    const descEl = $('.product-desc');
    const badgeEl = $('.product-badge');
    const mainImg = $('#mainImage');
    const amazonBtn = $('#buyOnAmazon');
    const ratingContainer = $('.product-meta .product-rating');

    const cur = product.currency || '$';
    if (titleEl) titleEl.textContent = product.name;
    if (priceEl) priceEl.textContent = cur + product.price;
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
    if (descEl) descEl.textContent = productDescriptions[product.id] || '';

    const brandEl = $('.product-badge');
    if (brandEl && product.brand) brandEl.textContent = product.brand;

    const detailsAccordion = $('details.product-accordion .accordion-content ul');
    if (detailsAccordion && product.bullets && product.bullets.length) {
      detailsAccordion.innerHTML = product.bullets.map(b => `<li>${b}</li>`).join('');
    }
    if (amazonBtn) amazonBtn.href = D.getAmazonLink(product);
    if (ratingContainer) ratingContainer.innerHTML = D.renderStars(product.rating) + '<span class="rating-count">(' + Math.floor(product.rating * 27) + ' reviews)</span>';

    const priceNote = $('.price-freshness');
    if (priceNote) priceNote.textContent = 'Price as of ' + new Date('2026-04-03').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

  // ─── Comparison Table ───
  function initComparisonTable() {
    const table = $('#comparisonTable');
    if (!table) return;
    const products = D.products;
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const id = paramId ? parseInt(paramId, 10) : 1;
    const current = products.find(p => p.id === id) || products[0];
    if (!current) return;
    const similar = products.filter(p => p.id !== current.id && p.category === current.category).slice(0, 2);
    if (similar.length < 2) {
      const alt = products.filter(p => p.id !== current.id && !similar.includes(p)).slice(0, 2 - similar.length);
      similar.push(...alt);
    }
    const items = [current, ...similar];
    table.innerHTML = `
      <thead>
        <tr>
          <th>Feature</th>
          ${items.map((p, i) => `<th${i === 0 ? ' class="highlight"' : ''}>${p.name}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Image</td>
          ${items.map((p, i) => `<td${i === 0 ? ' class="highlight"' : ''}><img class="product-thumb" src="${p.image}" alt="${p.name}"></td>`).join('')}
        </tr>
        <tr>
          <td>Price</td>
          ${items.map((p, i) => `<td${i === 0 ? ' class="highlight"' : ''}>${p.currency || '$'}${p.price}${p.comparePrice ? ` <span style="text-decoration:line-through;opacity:.5">${p.currency || '$'}${p.comparePrice}</span>` : ''}</td>`).join('')}
        </tr>
        <tr>
          <td>Rating</td>
          ${items.map((p, i) => `<td${i === 0 ? ' class="highlight"' : ''}>${D.renderStars(p.rating)}</td>`).join('')}
        </tr>
        <tr>
          <td>Category</td>
          ${items.map((p, i) => `<td${i === 0 ? ' class="highlight"' : ''}>${p.category}</td>`).join('')}
        </tr>
        <tr>
          <td>On Sale</td>
          ${items.map((p, i) => `<td${i === 0 ? ' class="highlight"' : ''}>${p.comparePrice ? '<span class="check">✓ Yes</span>' : '<span class="cross">—</span>'}</td>`).join('')}
        </tr>
        <tr>
          <td>Prime Eligible</td>
          ${items.map((p, i) => `<td${i === 0 ? ' class="highlight"' : ''}><span class="check">✓ Yes</span></td>`).join('')}
        </tr>
        <tr>
          <td></td>
          ${items.map((p, i) => `<td class="cta-cell${i === 0 ? ' highlight' : ''}"><a href="${D.getAmazonLink(p)}" target="_blank" rel="nofollow" class="btn btn-amazon">Shop Now</a></td>`).join('')}
        </tr>
      </tbody>`;
  }

  // ─── Sticky ATC Bar ───
  function initStickyATC() {
    const mainBtn = $('#buyOnAmazon');
    if (!mainBtn) return;
    const bar = document.createElement('div');
    bar.className = 'sticky-atc';
    const titleEl = $('.product-title');
    const priceEl = $('.price-current');
    bar.innerHTML = `<span class="sticky-atc-name">${titleEl ? titleEl.textContent : ''}</span><span class="sticky-atc-price">${priceEl ? priceEl.textContent : ''}</span><a href="${mainBtn.href}" target="_blank" rel="nofollow" class="btn btn-primary">Shop Now</a>`;
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

  // ─── Live Viewers on PDP ───
  function initLiveViewers() {
    const container = $('#liveViewers');
    if (!container) return;
    const base = Math.floor(Math.random() * 15) + 8;
    container.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> <span class="viewer-count">${base}</span> people are viewing this right now`;
    const countEl = container.querySelector('.viewer-count');
    setInterval(() => {
      const change = Math.random() > 0.5 ? 1 : -1;
      const current = parseInt(countEl.textContent, 10);
      countEl.textContent = Math.max(5, Math.min(40, current + change));
    }, 4000 + Math.random() * 3000);
  }

  // ─── Initialize Product Page Features ───
  function initProductFeatures() {
    if (!$('.product-detail')) return;
    if (!D.products || !D.products.length) {
      setTimeout(initProductFeatures, 100);
      return;
    }
    initProductPage();
    initProductGallery();
    initGallerySwipe();
    initHoverZoom();
    initComparisonTable();
    initStickyATC();
    initImageMagnifier();
    initColorSwatches();
    initLiveViewers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initProductFeatures, 50));
  } else {
    setTimeout(initProductFeatures, 50);
  }
})();
