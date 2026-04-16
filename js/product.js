/* ============================================
   DEVA DECOR — Product Page Module
   Loaded only on products page
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
    const product = products.find(p => p.id === id);
    
    if (!product) {
      detail.innerHTML = `
        <div class="product-not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            <path d="M8 8l6 6M14 8l-6 6"/>
          </svg>
          <h2>Product Not Found</h2>
          <p>Sorry, we couldn't find the product you're looking for. It may have been removed or the link might be incorrect.</p>
          <div class="product-not-found-actions">
            <a href="/shop" class="btn btn-primary">Browse All Products</a>
            <a href="/" class="btn btn-outline">Return Home</a>
          </div>
        </div>`;
      document.title = 'Product Not Found — Deva Decor';
      return;
    }

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
      priceEl.textContent = cur + product.price;
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
    if (bulletsList) {
      if (product.bullets && product.bullets.length) {
        bulletsList.innerHTML = product.bullets.map(b => `<li>${escHtml(b)}</li>`).join('');
      } else {
        bulletsList.innerHTML = '<li>Premium quality materials</li><li>Carefully curated design</li><li>See product description for details</li>';
      }
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

    var whatsappBtn = $('#whatsappQuote');
    if (whatsappBtn && product.name) {
      var msg = encodeURIComponent('Hi, I\'d like a bulk quote for: ' + product.name);
      whatsappBtn.href = 'https://wa.me/919251130947?text=' + msg;
    }

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
    const galleryRoot = $('.product-gallery');
    if (thumbContainer) {
      thumbContainer.innerHTML = images.map((img, i) =>
        `<button type="button" class="gallery-thumb${i === 0 ? ' active' : ''}" data-img="${img}" data-idx="${i}" aria-label="View image ${i + 1} of ${images.length}">
          <img src="${img}" alt="" loading="lazy" width="150" height="150">
        </button>`
      ).join('');
      initProductGallery(images, product.name);
    }
    if (galleryRoot) galleryRoot.classList.add('is-ready');

    const breadcrumb = $('.breadcrumb .container');
    if (breadcrumb) {
      const catSlug = product.category.toLowerCase().replace(/\s+/g, '-');
      breadcrumb.innerHTML = `<a href="/">Home</a><span>/</span><a href="/shop?cat=${catSlug}">${escHtml(product.category)}</a><span>/</span><span>${escHtml(product.name)}</span>`;
    }

    document.title = product.name + ' — Deva Decor';

    const canonicalUrl = new URL('products', window.location.origin);
    canonicalUrl.search = 'id=' + encodeURIComponent(String(product.id));
    const canonicalHref = canonicalUrl.href.split('#')[0];
    const canonicalEl = document.getElementById('canonicalLink');
    if (canonicalEl) canonicalEl.setAttribute('href', canonicalHref);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalHref);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && product.image) {
      const imgPath = product.image.startsWith('/') ? product.image : '/' + product.image;
      ogImage.setAttribute('content', window.location.origin + imgPath);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', product.name + ' — Deva Decor');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && product.bullets && product.bullets.length) {
      ogDesc.setAttribute('content', product.bullets[0]);
    }

    var schemaImgPath = product.image ? (product.image.startsWith('/') ? product.image : '/' + product.image) : '';
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'image': window.location.origin + schemaImgPath,
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

  // ─── Product Gallery (thumbs, swipe, lightbox with nav + keyboard) ───
  function initProductGallery(imageList, productName) {
    const main = $('#mainImage');
    const thumbs = $$('.gallery-thumb');
    const galleryMain = $('.gallery-main');
    if (!main || !thumbs.length || !imageList.length) return;

    let currentIdx = 0;

    function showIndex(idx) {
      currentIdx = Math.max(0, Math.min(idx, thumbs.length - 1));
      thumbs.forEach((th, i) => th.classList.toggle('active', i === currentIdx));
      const src = thumbs[currentIdx].dataset.img;
      main.style.opacity = '0';
      setTimeout(() => {
        main.src = src;
        main.alt = `${productName} — image ${currentIdx + 1} of ${thumbs.length}`;
        main.style.opacity = '1';
      }, 160);
    }

    thumbs.forEach((t, i) => {
      t.addEventListener('click', () => showIndex(i));
    });

    function openLightbox(startIdx) {
      const previousFocus = document.activeElement;
      let idx = Math.max(0, Math.min(startIdx, imageList.length - 1));
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay gallery-lightbox-root';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Product images');

      const hasMany = imageList.length > 1;
      overlay.innerHTML = `
        <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
        ${hasMany ? `<button type="button" class="lightbox-prev" aria-label="Previous image"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>` : ''}
        ${hasMany ? `<button type="button" class="lightbox-next" aria-label="Next image"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>` : ''}
        <img class="lightbox-img" src="" alt="">
        ${hasMany ? `<div class="lightbox-counter" aria-live="polite"></div>` : ''}
      `;
      document.body.appendChild(overlay);
      const imgEl = overlay.querySelector('.lightbox-img');
      const closeBtn = overlay.querySelector('.lightbox-close');
      const prevBtn = overlay.querySelector('.lightbox-prev');
      const nextBtn = overlay.querySelector('.lightbox-next');
      const counterEl = overlay.querySelector('.lightbox-counter');

      function paint() {
        imgEl.src = imageList[idx];
        imgEl.alt = `${productName} — enlarged ${idx + 1} of ${imageList.length}`;
        if (counterEl) counterEl.textContent = `${idx + 1} / ${imageList.length}`;
      }

      function getFocusables() {
        return [].slice.call(overlay.querySelectorAll('button:not([disabled])')).filter(el => el.offsetParent !== null);
      }
      function trapFocus(e) {
        if (e.key !== 'Tab') return;
        const focusables = getFocusables();
        if (focusables.length < 2) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      function closeLightbox() {
        overlay.classList.remove('visible');
        document.body.classList.remove('lightbox-open');
        overlay.removeEventListener('keydown', trapFocus);
        document.removeEventListener('keydown', onDocKey);
        setTimeout(() => {
          overlay.remove();
          if (previousFocus) previousFocus.focus();
        }, 280);
      }

      function onDocKey(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeLightbox();
          return;
        }
        if (!hasMany) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          idx = (idx - 1 + imageList.length) % imageList.length;
          paint();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          idx = (idx + 1) % imageList.length;
          paint();
        }
      }

      paint();
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
        document.body.classList.add('lightbox-open');
        closeBtn.focus();
      });
      overlay.addEventListener('keydown', trapFocus);
      document.addEventListener('keydown', onDocKey);

      closeBtn.addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });
      overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });
      if (prevBtn) prevBtn.addEventListener('click', e => { e.stopPropagation(); idx = (idx - 1 + imageList.length) % imageList.length; paint(); });
      if (nextBtn) nextBtn.addEventListener('click', e => { e.stopPropagation(); idx = (idx + 1) % imageList.length; paint(); });
    }

    const zoom = $('#galleryZoom');
    if (zoom) {
      zoom.addEventListener('click', () => openLightbox(currentIdx));
    }
    if (galleryMain) {
      galleryMain.addEventListener('click', e => {
        if (e.target === main || e.target.closest('#mainImage')) openLightbox(currentIdx);
      });
    }

    if (galleryMain && thumbs.length >= 2) {
      let startX = 0;
      let diffX = 0;
      galleryMain.addEventListener('touchstart', e => { startX = e.touches[0].clientX; diffX = 0; }, { passive: true });
      galleryMain.addEventListener('touchmove', e => { diffX = e.touches[0].clientX - startX; }, { passive: true });
      galleryMain.addEventListener('touchend', () => {
        if (Math.abs(diffX) < 48) return;
        if (diffX < 0) showIndex(currentIdx + 1);
        else showIndex(currentIdx - 1);
      });
    }
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
    bar.innerHTML = `<span class="sticky-atc-name">${titleEl ? titleEl.textContent : ''}</span><span class="sticky-atc-price">${priceEl ? priceEl.textContent : ''}</span><a href="${mainBtn.href}" target="_blank" rel="nofollow" class="btn btn-primary">Buy on Amazon</a>`;
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
