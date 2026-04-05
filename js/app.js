/* ============================================
   DEVA DECOR — Premium Home Decor Store
   ============================================ */

(function () {
  'use strict';

  const AFFILIATE_TAG = 'devadecor-20';
  const PRICES_UPDATED = '2026-04-03';

  let products = [];
  let productDescriptions = {};
  let favoriteProducts = [];
  let _resolveReady;
  const dataReady = new Promise(r => { _resolveReady = r; });

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // Shared scroll bus — one rAF-throttled listener for all scroll-dependent features
  const scrollBus = {
    _cbs: [],
    _ticking: false,
    _bound: false,
    register(fn) {
      this._cbs.push(fn);
      if (!this._bound) {
        this._bound = true;
        window.addEventListener('scroll', () => {
          if (this._ticking) return;
          this._ticking = true;
          requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const docH = document.documentElement.scrollHeight;
            const winH = window.innerHeight;
            for (let i = 0; i < this._cbs.length; i++) this._cbs[i](scrollY, docH, winH);
            this._ticking = false;
          });
        }, { passive: true });
      }
    },
    unregister(fn) { this._cbs = this._cbs.filter(cb => cb !== fn); }
  };

  function getAmazonLink(product) {
    return product.amazonUrl + '?tag=' + AFFILIATE_TAG;
  }

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.3;
    const empty = 5 - full - (half ? 1 : 0);
    let html = '';
    for (let i = 0; i < full; i++) html += '<span class="star star-full">★</span>';
    if (half) html += '<span class="star star-half">★</span>';
    for (let i = 0; i < empty; i++) html += '<span class="star star-empty">★</span>';
    return `<div class="star-rating" title="${rating} out of 5"><span class="stars-wrap">${html}</span><span class="star-count">${rating}</span></div>`;
  }

  window.DevaDecor = {
    get products() { return products; },
    get productDescriptions() { return productDescriptions; },
    get favoriteProducts() { return favoriteProducts; },
    dataReady,
    renderProductCard, attachCardEvents, showToast, getAmazonLink, renderStars,
    $, $$, scrollBus
  };

  // ─── Page Loader ───
  function initLoader() {
    const loader = $('#pageLoader');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('loaded');
      setTimeout(() => loader.remove(), 600);
    }, 800);
  }

  // ─── Navbar ───
  function initNavbar() {
    const hamburger = $('#navHamburger');
    const menu = $('#navMenu');
    const navbar = $('#navbar');
    if (hamburger && menu) {
      hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); menu.classList.toggle('active'); });
      $$('.nav-link', menu).forEach(link => link.addEventListener('click', () => { hamburger.classList.remove('active'); menu.classList.remove('active'); }));
    }
    let lastScroll = 0;
    if (navbar) {
      scrollBus.register((scrollY) => {
        navbar.classList.toggle('scrolled', scrollY > 50);
        navbar.classList.toggle('nav-hidden', scrollY > lastScroll && scrollY > 200);
        lastScroll = scrollY;
      });
    }
  }

  // ─── Theme ───
  function initTheme() {
    const toggle = $('#themeToggle');
    const saved = localStorage.getItem('devaTheme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    if (toggle) {
      toggle.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('devaTheme', next);
      });
    }
  }

  // ─── Search ───
  function initSearch() {
    const toggle = $('#searchToggle');
    const overlay = $('#searchOverlay');
    const input = $('#searchInput');
    const close = $('#searchClose');
    const suggestions = $('#searchSuggestions');
    if (!toggle || !overlay) return;
    function openSearch() { overlay.classList.add('active'); setTimeout(() => input?.focus(), 300); }
    function closeSearch() { overlay.classList.remove('active'); if (input) input.value = ''; if (suggestions) suggestions.innerHTML = ''; }
    toggle.addEventListener('click', openSearch);
    if (close) close.addEventListener('click', closeSearch);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });
    if (input && suggestions) {
      input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        if (q.length < 2) { suggestions.innerHTML = ''; return; }
        const matches = products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 5);
        suggestions.innerHTML = matches.length ? matches.map(p => `<a href="${p.link}" class="search-suggestion"><img src="${p.image}" alt="${p.name}" width="50" height="50"><div><strong>${p.name}</strong><span>${p.currency || '$'}${p.price}</span></div></a>`).join('') : '<div class="search-no-results">No products found</div>';
      });
    }
  }

  // ─── Toast Notification ───
  function showToast(title, message) {
    const existing = $('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  // ─── Product Card Renderer ───
  function renderProductCard(product) {
    const amazonLink = getAmazonLink(product);
    return `<div class="product-card" data-id="${product.id}">
      <div class="product-card-img">
        ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
        <div class="product-card-actions">
          <button class="product-card-action" data-wishlist-id="${product.id}" aria-label="Add to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button class="product-card-action product-card-quickview" data-quickview-id="${product.id}" aria-label="Quick view">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <a href="${product.link}">
          <img src="${product.image}" alt="${product.name}" loading="lazy" width="600" height="800" class="${product.image.startsWith('images/') ? 'local-img' : ''}">
        </a>
        <a href="${amazonLink}" target="_blank" rel="nofollow" class="product-card-amazon-btn">Shop Now</a>
      </div>
      <div class="product-card-info">
        <div class="product-card-category">${product.category}</div>
        ${renderStars(product.rating)}
        <h3 class="product-card-name"><a href="${product.link}">${product.name}</a></h3>
        <div class="product-card-price">
          <span class="current">${product.currency || '$'}${product.price}</span>
          ${product.comparePrice ? `<span class="compare">${product.currency || '$'}${product.comparePrice}</span>` : ''}
        </div>
      </div>
    </div>`;
  }

  function attachCardEvents(container) {
    if (!container) return;
    $$('.product-card-name a', container).forEach(link => {
      link.addEventListener('click', e => {
        if (document.startViewTransition) { e.preventDefault(); document.startViewTransition(() => { window.location.href = link.href; }); }
      });
    });
  }

  // ─── Carousel Engine ───
  function initCarousel(trackId, items, autoScroll = false) {
    const track = $(`#${trackId}`);
    if (!track || !items.length) return;
    track.innerHTML = items.map(p => renderProductCard(p)).join('');
    attachCardEvents(track);
    const wrapper = track.closest('.carousel-wrapper');
    if (!wrapper) return;
    const prevBtn = wrapper.querySelector('.carousel-prev');
    const nextBtn = wrapper.querySelector('.carousel-next');
    const card = track.querySelector('.product-card');
    const scrollAmount = card ? card.offsetWidth + 24 : 300;
    if (prevBtn) prevBtn.addEventListener('click', () => track.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    if (nextBtn) nextBtn.addEventListener('click', () => track.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
    if (autoScroll) {
      let interval = setInterval(() => track.scrollBy({ left: scrollAmount, behavior: 'smooth' }), 5000);
      wrapper.addEventListener('mouseenter', () => clearInterval(interval));
      wrapper.addEventListener('mouseleave', () => { interval = setInterval(() => track.scrollBy({ left: scrollAmount, behavior: 'smooth' }), 5000); });
    }
  }

  // ─── Testimonials ───
  function initTestimonials() {
    const track = $('#testimonialTrack');
    const dots = $('#testimonialDots');
    if (!track || !dots) return;
    const cards = $$('.testimonial-card', track);
    if (cards.length === 0) return;
    let current = 0;
    dots.innerHTML = cards.map((_, i) => `<button class="testimonial-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Testimonial ${i + 1}"></button>`).join('');
    function goTo(i) {
      current = i;
      track.style.transform = `translateX(-${current * 100}%)`;
      $$('.testimonial-dot', dots).forEach((d, idx) => d.classList.toggle('active', idx === current));
    }
    $$('.testimonial-dot', dots).forEach(d => d.addEventListener('click', () => goTo(Number(d.dataset.index))));
    setInterval(() => goTo((current + 1) % cards.length), 6000);
  }


  // productDescriptions loaded from products.json

  // Product page functions moved to js/product.js

  // ─── Hero Slideshow ───
  function initHeroSlideshow() {
    const slides = $$('.hero-slide');
    if (slides.length < 2) return;
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 6000);
  }

  // ─── Scroll Animations ───
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const anim = el.dataset.animate;
          const delay = parseInt(el.dataset.delay || '0', 10);
          const reveal = () => {
            if (anim === 'stagger') {
              $$(':scope > *', el).forEach((child, i) => {
                setTimeout(() => child.classList.add('animate-in'), i * 120);
              });
            } else if (anim === 'counter') {
              $$('.stat-num', el).forEach(num => {
                const target = parseInt(num.textContent);
                let count = 0;
                const step = Math.ceil(target / 60);
                const timer = setInterval(() => {
                  count += step;
                  if (count >= target) { count = target; clearInterval(timer); }
                  num.textContent = count.toLocaleString() + (num.textContent.includes('+') ? '+' : '');
                }, 25);
              });
            } else if (anim === 'clip-reveal') {
              el.classList.add('revealed');
            } else {
              el.classList.add('animate-in');
            }
          };
          if (delay > 0) setTimeout(reveal, delay);
          else reveal();
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('[data-animate]').forEach(el => observer.observe(el));
  }

  // ─── Split-Text Hero Reveal ───
  function initSplitText() {
    const title = $('.hero-title');
    if (!title) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const html = title.innerHTML;
    title.innerHTML = html.replace(/(<br\s*\/?>)|([^\s<])/g, (match, br) => br ? br : `<span class="split-char">${match}</span>`);
    const chars = $$('.split-char', title);
    chars.forEach((c, i) => { c.style.transitionDelay = `${0.4 + i * 0.025}s`; });
    requestAnimationFrame(() => title.classList.add('split-ready'));
  }

  // ─── Magnetic Buttons ───
  function initMagneticButtons() {
    if (window.innerWidth < 1024) return;
    $$('.btn-primary, .btn-lg').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }


  // ─── Scroll Progress Bar ───
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress-bar';
    document.body.prepend(bar);
    scrollBus.register((scrollY, docH, winH) => {
      const h = docH - winH;
      bar.style.width = h > 0 ? (scrollY / h * 100) + '%' : '0%';
    });
  }

  // ─── Custom Cursor ───
  function initCursor() {
    if (window.innerWidth < 1024 || 'ontouchstart' in window) return;
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!cursor.classList.contains('visible')) cursor.classList.add('visible');
    });
    (function loop() {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mousedown', () => cursor.classList.add('cursor-click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('cursor-click'));
    const observed = new WeakSet();
    const observe = () => {
      $$('a, button, .product-card, .collection-card, .category-card, .gallery-item, .journal-card, input, textarea').forEach(el => {
        if (observed.has(el)) return;
        observed.add(el);
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
      });
    };
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // ─── 3D Card Tilt ───
  function initCardTilt() {
    if (window.innerWidth < 1024) return;
    let activeCard = null;
    document.addEventListener('mouseover', e => {
      const card = e.target.closest('.product-card');
      if (card === activeCard) return;
      if (activeCard) activeCard.style.transform = '';
      activeCard = card;
    });
    document.addEventListener('mousemove', e => {
      if (!activeCard) return;
      const rect = activeCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      activeCard.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    document.addEventListener('mouseout', e => {
      if (activeCard && !activeCard.contains(e.relatedTarget)) {
        activeCard.style.transform = '';
        activeCard = null;
      }
    });
  }

  // ─── Parallax ───
  function initParallax() {
    const bg = $('.parallax-bg');
    if (!bg) return;
    const section = bg.closest('.parallax-banner');
    scrollBus.register((scrollY, docH, winH) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > winH) return;
      bg.style.transform = `translate3d(0, ${rect.top * 0.3}px, 0)`;
    });
  }

  // ─── Back to Top ───
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>';
    btn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(btn);
    scrollBus.register((scrollY) => btn.classList.toggle('visible', scrollY > 500));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ─── Newsletter ───
  function initNewsletter() {
    const form = $('#newsletterForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;
      const btn = form.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Subscribing…';
      try {
        const res = await fetch(form.action || 'https://formspree.io/f/YOUR_FORM_ID', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email })
        });
        if (res.ok) {
          showToast('Welcome!', 'Thank you for subscribing to Deva Decor.');
          form.reset();
        } else {
          showToast('Oops', 'Something went wrong. Please try again.');
        }
      } catch {
        showToast('Welcome!', 'Thank you for subscribing to Deva Decor.');
        form.reset();
      }
      btn.disabled = false;
      btn.textContent = 'Subscribe';
    });
  }

  // ─── Smooth Scroll ───
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (id === '#') return;
        const target = $(id);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
      });
    });
  }

  // ─── Page Transitions ───
  function initPageTransitions() {
    if (!document.startViewTransition) return;
    $$('a[href$=".html"]').forEach(link => {
      if (link.target === '_blank') return;
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http')) return;
        e.preventDefault();
        document.startViewTransition(() => { window.location.href = href; });
      });
    });
  }

  // ─── Today's Deals Section ───
  function initDeals() {
    const grid = $('#dealsGrid');
    if (!grid) return;
    const deals = products.filter(p => p.comparePrice).sort((a, b) => {
      const aSave = 1 - a.price / a.comparePrice;
      const bSave = 1 - b.price / b.comparePrice;
      return bSave - aSave;
    }).slice(0, 6);
    grid.innerHTML = deals.map(p => {
      const pct = Math.round((1 - p.price / p.comparePrice) * 100);
      return `<div class="deal-card">
        <span class="deal-card-badge">${pct}% Off</span>
        <div class="deal-card-countdown"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> <span class="deal-card-timer">00:00:00</span></div>
        <a href="${p.link}" class="deal-card-img">
          <img src="${p.image}" alt="${p.name}" loading="lazy" width="600" height="800">
        </a>
        <div class="deal-card-body">
          <div class="deal-card-name">${p.name}</div>
          ${renderStars(p.rating)}
          <div class="deal-card-price">
            <span class="current">${p.currency || '$'}${p.price}</span>
            <span class="compare">${p.currency || '$'}${p.comparePrice}</span>
          </div>
          <a href="${getAmazonLink(p)}" target="_blank" rel="nofollow" class="btn btn-amazon">Shop Now</a>
        </div>
      </div>`;
    }).join('');
    initDealCountdown();
  }


  // ─── Journal Affiliate Callout Cards ───
  function initJournalCallouts() {
    const callout1 = $('#journalCallout1');
    const callout2 = $('#journalCallout2');
    if (!callout1 && !callout2) return;
    const picks = [products[0], products[4]];
    [callout1, callout2].forEach((el, i) => {
      if (!el) return;
      const p = picks[i] || picks[0];
      el.innerHTML = `
        <div class="product-callout-img">
          <a href="${p.link}"><img src="${p.image}" alt="${p.name}" loading="lazy" width="120" height="120"></a>
        </div>
        <div class="product-callout-body">
          <div class="product-callout-label">Editor's Pick</div>
          <div class="product-callout-name">${p.name}</div>
          ${renderStars(p.rating)}
          <div class="product-callout-price">
            <span class="current">${p.currency || '$'}${p.price}</span>
            ${p.comparePrice ? `<span class="compare">${p.currency || '$'}${p.comparePrice}</span>` : ''}
          </div>
          <a href="${getAmazonLink(p)}" target="_blank" rel="nofollow" class="btn btn-amazon">Shop Now</a>
        </div>`;
    });
  }

  // ─── Help Widget ───
  function initHelpWidget() {
    const widget = document.createElement('div');
    widget.className = 'help-widget';
    widget.innerHTML = `<button class="help-widget-trigger" aria-label="Need help?"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button><div class="help-widget-panel"><h4>Need Help?</h4><a href="contact.html#faq" class="help-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>FAQ</a><a href="contact.html" class="help-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Contact Us</a></div>`;
    document.body.appendChild(widget);
    widget.querySelector('.help-widget-trigger').addEventListener('click', () => widget.classList.toggle('open'));
    document.addEventListener('click', e => { if (!widget.contains(e.target)) widget.classList.remove('open'); });
  }


  // ─── Blur-up Image Placeholders ───
  function initBlurUp() {
    $$('.product-card-img img, .deal-card-img img').forEach(img => {
      if (img.complete) return;
      const wrap = img.closest('.product-card-img') || img.closest('.deal-card-img');
      if (!wrap) return;
      wrap.classList.add('img-blur-wrap');
      img.dataset.loaded = 'false';
      img.addEventListener('load', () => { img.dataset.loaded = 'true'; wrap.classList.add('loaded'); }, { once: true });
    });
  }

  // ─── Article TOC + Reading Time ───
  function initArticleTOC() {
    const article = $('.article-content');
    if (!article) return;
    const headings = $$('h2', article);
    if (headings.length < 2) return;

    const words = article.textContent.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 230));
    const metaEl = $('.journal-meta');
    if (metaEl && !metaEl.querySelector('.reading-time')) {
      metaEl.innerHTML += ` <span class="reading-time"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${minutes} min read</span>`;
    }

    const toc = document.createElement('nav');
    toc.className = 'article-toc';
    toc.setAttribute('aria-label', 'Table of contents');
    toc.innerHTML = '<div class="article-toc-title">In This Article</div><ol>' +
      headings.map((h, i) => {
        const id = 'section-' + (i + 1);
        h.id = id;
        return `<li><a href="#${id}">${h.textContent}</a></li>`;
      }).join('') + '</ol>';
    article.insertBefore(toc, article.firstChild);
  }

  // ─── Social Share Buttons ───
  function initSocialShare() {
    const header = $('.article-header') || $('.product-detail .product-info');
    if (!header) return;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const share = document.createElement('div');
    share.className = 'social-share';
    share.innerHTML = `<span class="social-share-label">Share</span>
      <a class="share-btn" href="https://pinterest.com/pin/create/button/?url=${url}&description=${title}" target="_blank" rel="noopener" aria-label="Share on Pinterest"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.4-5.96s-.36-.72-.36-1.78c0-1.66.97-2.9 2.17-2.9 1.02 0 1.52.77 1.52 1.7 0 1.03-.66 2.57-.99 4-.28 1.2.6 2.17 1.78 2.17 2.13 0 3.77-2.25 3.77-5.5 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.42 2.56-5.42 5.21 0 1.03.4 2.14.89 2.74a.36.36 0 0 1 .08.35l-.33 1.36c-.05.22-.18.27-.4.16-1.49-.7-2.42-2.88-2.42-4.64 0-3.78 2.75-7.25 7.92-7.25 4.16 0 7.4 2.97 7.4 6.93 0 4.14-2.6 7.46-6.22 7.46-1.22 0-2.36-.63-2.75-1.38l-.75 2.86c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/></svg></a>
      <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener" aria-label="Share on Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
      <a class="share-btn" href="https://twitter.com/intent/tweet?url=${url}&text=${title}" target="_blank" rel="noopener" aria-label="Share on Twitter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
      <button class="share-btn" aria-label="Copy link" id="copyLinkBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>`;
    header.after(share);
    const copyBtn = share.querySelector('#copyLinkBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => showToast('Copied!', 'Link copied to clipboard'));
      });
    }
  }

  // ─── Outbound Click Tracking ───
  function initClickTracking() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href*="amazon.com"]');
      if (!link) return;
      if (typeof gtag === 'function') {
        gtag('event', 'click', {
          event_category: 'outbound',
          event_label: link.href,
          transport_type: 'beacon'
        });
      }
    });
  }

  // ─── Button Ripple ───
  function initRipple() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  // ─── Lazy Image Reveal ───
  function initLazyReveal() {
    const imgs = $$('img[loading="lazy"]');
    imgs.forEach(img => {
      if (img.complete) { img.classList.add('loaded'); return; }
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
    });
    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        const newImgs = n.tagName === 'IMG' ? [n] : [...(n.querySelectorAll ? n.querySelectorAll('img[loading="lazy"]') : [])];
        newImgs.forEach(img => {
          if (img.complete) { img.classList.add('loaded'); return; }
          img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
        });
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  // ─── Smooth Section Parallax ───
  function initSectionParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sections = $$('.section-header');
    if (!sections.length) return;
    scrollBus.register((scrollY, docH, winH) => {
      sections.forEach(s => {
        const rect = s.getBoundingClientRect();
        if (rect.top > winH || rect.bottom < 0) return;
        const progress = (winH - rect.top) / (winH + rect.height);
        s.style.transform = `translateY(${(progress - 0.5) * -15}px)`;
      });
    });
  }

  // ─── Quick View Modal ───
  function initQuickView() {
    let overlay = null;
    function getProductImages(product) {
      if (product.images && product.images.length) return product.images;
      return [product.image];
    }
    function open(product) {
      if (overlay) overlay.remove();
      const desc = productDescriptions[product.id] || 'Beautifully crafted piece to elevate your living space.';
      const amazonLink = getAmazonLink(product);
      const savePct = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
      const images = getProductImages(product);
      overlay = document.createElement('div');
      overlay.className = 'quickview-overlay';
      overlay.innerHTML = `
        <div class="quickview-modal">
          <button class="quickview-close" aria-label="Close quick view">&times;</button>
          <div class="quickview-grid">
            <div class="quickview-img-col">
              <div class="quickview-img-main">
                <img src="${images[0]}" alt="${product.name}" width="600" height="800" class="qv-main-img">
                ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
              </div>
              <div class="quickview-thumbs">
                ${images.map((img, i) => `<button class="qv-thumb${i === 0 ? ' active' : ''}" data-idx="${i}"><img src="${img}" alt="View ${i + 1}" width="80" height="80"></button>`).join('')}
              </div>
            </div>
            <div class="quickview-details">
              <span class="quickview-category">${product.category}</span>
              <h2 class="quickview-title">${product.name}</h2>
              ${renderStars(product.rating)}
              <div class="quickview-price">
                <span class="current">${product.currency || '$'}${product.price}</span>
                ${product.comparePrice ? `<span class="compare">${product.currency || '$'}${product.comparePrice}</span>` : ''}
                ${savePct ? `<span class="quickview-save">Save ${savePct}%</span>` : ''}
              </div>
              <p class="quickview-desc">${desc}</p>
              <div class="quickview-actions">
                <a href="${amazonLink}" target="_blank" rel="nofollow" class="btn btn-primary quickview-buy">Shop Now</a>
                <a href="${product.link}" class="btn btn-outline">View Details</a>
              </div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
      const mainImg = overlay.querySelector('.qv-main-img');
      overlay.querySelectorAll('.qv-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          overlay.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          mainImg.style.opacity = '0';
          setTimeout(() => { mainImg.src = images[parseInt(thumb.dataset.idx, 10)]; mainImg.style.opacity = '1'; }, 180);
        });
      });
      overlay.querySelector('.quickview-close').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onEsc);
    }
    function close() {
      if (!overlay) return;
      overlay.classList.remove('visible');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
      setTimeout(() => { if (overlay) { overlay.remove(); overlay = null; } }, 400);
    }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-quickview-id]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const id = parseInt(btn.dataset.quickviewId, 10);
      const product = products.find(p => p.id === id);
      if (product) open(product);
    });
  }

  // ─── Deals Countdown Timer ───
  function initDealCountdown() {
    const badges = $$('.deal-card-timer');
    if (!badges.length) return;
    function getMidnight() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    let target = getMidnight();
    function tick() {
      const now = Date.now();
      let diff = target - now;
      if (diff <= 0) { target = getMidnight(); diff = target - now; }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const str = `${h}:${m}:${s}`;
      badges.forEach(el => { el.textContent = str; });
    }
    tick();
    setInterval(tick, 1000);
  }

  // ─── Social Proof Notifications ───
  function initSocialProof() {
    if (window.location.pathname.includes('product.html')) return;
    const firstNames = ['Emma','Liam','Olivia','Noah','Ava','James','Sophia','Lucas','Isabella','Mason','Mia','Ethan','Charlotte','Logan','Amelia'];
    const cities = ['Austin, TX','Brooklyn, NY','San Francisco, CA','Portland, OR','Denver, CO','Nashville, TN','Chicago, IL','Seattle, WA','Savannah, GA','Miami, FL'];
    let lastId = -1;
    function show() {
      const pool = products.filter(p => p.id !== lastId);
      const p = pool[Math.floor(Math.random() * pool.length)];
      lastId = p.id;
      const name = firstNames[Math.floor(Math.random() * firstNames.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const mins = Math.floor(Math.random() * 12) + 1;
      const el = document.createElement('div');
      el.className = 'social-proof';
      el.innerHTML = `
        <img src="${p.image}" alt="" class="social-proof-img">
        <div class="social-proof-body">
          <strong>${name}</strong> from ${city}
          <span>purchased <a href="${p.link}">${p.name}</a></span>
          <small>${mins} min ago</small>
        </div>
        <button class="social-proof-close" aria-label="Dismiss">&times;</button>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
      el.querySelector('.social-proof-close').addEventListener('click', () => dismiss(el));
      setTimeout(() => dismiss(el), 6000);
    }
    function dismiss(el) {
      if (!el.parentNode) return;
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 400);
    }
    setTimeout(show, 8000);
    setInterval(show, 25000 + Math.random() * 15000);
  }

  // ─── Cookie Consent ───
  function initCookieConsent() {
    if (localStorage.getItem('dd_cookie_consent')) return;
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <p>We use cookies to enhance your experience and analyze site traffic. By continuing, you agree to our <a href="privacy.html">Privacy Policy</a>.</p>
        <div class="cookie-banner-actions">
          <button class="btn btn-primary cookie-accept">Accept</button>
          <button class="btn btn-outline cookie-decline">Decline</button>
        </div>
      </div>`;
    document.body.appendChild(banner);
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('visible')));
    banner.querySelector('.cookie-accept').addEventListener('click', () => {
      localStorage.setItem('dd_cookie_consent', 'accepted');
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 500);
    });
    banner.querySelector('.cookie-decline').addEventListener('click', () => {
      localStorage.setItem('dd_cookie_consent', 'declined');
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 500);
    });
  }

  // ─── Recently Viewed ───
  function initRecentlyViewed() {
    const KEY = 'dd_recently_viewed';
    const params = new URLSearchParams(window.location.search);
    const pid = parseInt(params.get('id'), 10);
    if (pid && window.location.pathname.includes('product.html')) {
      let viewed = JSON.parse(localStorage.getItem(KEY) || '[]');
      viewed = viewed.filter(id => id !== pid);
      viewed.unshift(pid);
      if (viewed.length > 12) viewed = viewed.slice(0, 12);
      localStorage.setItem(KEY, JSON.stringify(viewed));
    }
    const container = document.getElementById('recentlyViewedGrid');
    if (!container) return;
    const viewed = JSON.parse(localStorage.getItem(KEY) || '[]').filter(id => id !== pid);
    if (!viewed.length) { const sec = container.closest('.recently-viewed-section'); if (sec) sec.style.display = 'none'; return; }
    const items = viewed.slice(0, 6).map(id => products.find(p => p.id === id)).filter(Boolean);
    if (!items.length) { const sec = container.closest('.recently-viewed-section'); if (sec) sec.style.display = 'none'; return; }
    container.innerHTML = items.map(p => renderProductCard(p)).join('');
  }

  // ─── Wishlist (unified handler with animation feedback + undo) ───
  function initWishlist() {
    const KEY = 'dd_wishlist';
    function getWishlist() { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    function saveWishlist(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
    function updateAllHearts() {
      const list = getWishlist();
      $$('[data-wishlist-id]').forEach(btn => {
        const id = parseInt(btn.dataset.wishlistId, 10);
        btn.classList.toggle('wishlisted', list.includes(id));
        btn.setAttribute('aria-label', list.includes(id) ? 'Remove from wishlist' : 'Add to wishlist');
      });
    }
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-wishlist-id]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const id = parseInt(btn.dataset.wishlistId, 10);
      let list = getWishlist();
      const wasWishlisted = list.includes(id);
      if (wasWishlisted) list = list.filter(i => i !== id);
      else list.push(id);
      saveWishlist(list);
      updateAllHearts();
      btn.classList.add('wishlist-pop');
      setTimeout(() => btn.classList.remove('wishlist-pop'), 500);
      if (!wasWishlisted) {
        for (let i = 0; i < 6; i++) {
          const particle = document.createElement('span');
          particle.className = 'wishlist-particle';
          particle.style.setProperty('--angle', (i / 6) * 360 + 'deg');
          btn.appendChild(particle);
          setTimeout(() => particle.remove(), 600);
        }
        showUndoToast('Added to Wishlist', 'We\'ll remember this one for you.', () => {
          let l = getWishlist();
          l = l.filter(i => i !== id);
          saveWishlist(l);
          updateAllHearts();
        });
      } else {
        showUndoToast('Removed from Wishlist', 'Item removed.', () => {
          let l = getWishlist();
          if (!l.includes(id)) l.push(id);
          saveWishlist(l);
          updateAllHearts();
        });
      }
    });
    updateAllHearts();
    new MutationObserver(() => updateAllHearts()).observe(document.body, { childList: true, subtree: true });
  }

  // ─── Exit-Intent Popup ───
  function initExitIntent() {
    if (sessionStorage.getItem('dd_exit_shown') || window.innerWidth < 768) return;
    let shown = false;
    document.addEventListener('mouseout', e => {
      if (shown || e.clientY > 5 || e.relatedTarget || e.toElement) return;
      shown = true;
      sessionStorage.setItem('dd_exit_shown', '1');
      const overlay = document.createElement('div');
      overlay.className = 'exit-popup-overlay';
      overlay.innerHTML = `
        <div class="exit-popup">
          <button class="exit-popup-close" aria-label="Close">&times;</button>
          <div class="exit-popup-body">
            <span class="exit-popup-tag">Wait — Before You Go</span>
            <h2>Get 10% Off Your First Order</h2>
            <p>Join 5,000+ homeowners who trust Deva Decor for curated, artisan-quality home decor.</p>
            <form class="exit-popup-form" id="exitPopupForm">
              <input type="email" placeholder="Enter your email" required>
              <button type="submit" class="btn btn-primary">Claim My 10%</button>
            </form>
            <small>No spam. Unsubscribe anytime.</small>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
      function close() {
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
        setTimeout(() => overlay.remove(), 400);
      }
      overlay.querySelector('.exit-popup-close').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      overlay.querySelector('#exitPopupForm').addEventListener('submit', e => {
        e.preventDefault();
        showToast('Welcome!', 'Check your inbox for your 10% discount code.');
        close();
      });
    });
  }

  // ─── Animated Counters (already in scroll observer, this is the trigger) ───
  // Counter logic is in initScrollAnimations via data-animate="counter"

  // Wishlist feedback merged into initWishlist

  // ─── Carousel Keyboard & Swipe ───
  function initCarouselEnhancements() {
    $$('.carousel-wrapper').forEach(wrapper => {
      const track = wrapper.querySelector('.carousel-track');
      const prevBtn = wrapper.querySelector('.carousel-prev');
      const nextBtn = wrapper.querySelector('.carousel-next');
      if (!track || !prevBtn || !nextBtn) return;

      wrapper.setAttribute('tabindex', '0');
      wrapper.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevBtn.click(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
      });

      let startX = 0, diffX = 0, swiping = false;
      track.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse') return;
        startX = e.clientX; diffX = 0; swiping = true;
        track.setPointerCapture(e.pointerId);
      });
      track.addEventListener('pointermove', e => {
        if (!swiping) return;
        diffX = e.clientX - startX;
      });
      track.addEventListener('pointerup', () => {
        if (!swiping) return;
        swiping = false;
        if (Math.abs(diffX) > 50) {
          if (diffX < 0) nextBtn.click();
          else prevBtn.click();
        }
      });
    });
  }

  // ─── Floating Labels ───
  function initFloatingLabels() {
    $$('.form-group--float').forEach(group => {
      const input = group.querySelector('.form-input');
      if (!input) return;
      function check() { group.classList.toggle('has-value', input.value.length > 0); }
      input.addEventListener('focus', () => group.classList.add('focused'));
      input.addEventListener('blur', () => { group.classList.remove('focused'); check(); });
      check();
    });
  }

  // ─── Mobile Bottom Nav ───
  function initMobileNav() {
    if (window.innerWidth > 768) return;
    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    const wishlistCount = JSON.parse(localStorage.getItem('dd_wishlist') || '[]').length;
    nav.innerHTML = `
      <a href="index.html" class="mobile-nav-item${window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') ? ' active' : ''}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <span>Home</span>
      </a>
      <a href="shop.html" class="mobile-nav-item${window.location.pathname.includes('shop') ? ' active' : ''}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <span>Shop</span>
      </a>
      <a href="#" class="mobile-nav-item" id="mobileNavWishlist">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        ${wishlistCount ? `<span class="mobile-nav-badge">${wishlistCount}</span>` : ''}
        <span>Wishlist</span>
      </a>
      <a href="#" class="mobile-nav-item" id="mobileNavSearch">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>Search</span>
      </a>`;
    document.body.appendChild(nav);
    const searchBtn = nav.querySelector('#mobileNavSearch');
    if (searchBtn) searchBtn.addEventListener('click', e => {
      e.preventDefault();
      const toggle = $('#searchToggle');
      if (toggle) toggle.click();
    });
    const wishlistBtn = nav.querySelector('#mobileNavWishlist');
    if (wishlistBtn) wishlistBtn.addEventListener('click', e => {
      e.preventDefault();
      window.location.href = 'shop.html';
    });
  }

  // ─── Smart 404 Products ───
  function initSmart404() {
    const grid = $('#smart404Grid');
    if (!grid) return;
    const popular = products.filter(p => p.rating >= 4.7 || p.badge === 'Best Seller').slice(0, 6);
    grid.innerHTML = popular.map(p => renderProductCard(p)).join('');
    attachCardEvents(grid);
  }

  // ─── Sticky Shop Toolbar ───
  function initStickyToolbar() {
    const toolbar = $('.shop-toolbar');
    if (!toolbar) return;
    const sentinel = document.createElement('div');
    sentinel.className = 'toolbar-sentinel';
    toolbar.parentNode.insertBefore(sentinel, toolbar);
    const observer = new IntersectionObserver(([entry]) => {
      toolbar.classList.toggle('stuck', !entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(sentinel);
  }

  // ─── Back-to-Top Progress Ring ───
  function initProgressRing() {
    const btn = $('.back-to-top');
    if (!btn) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'progress-ring');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.innerHTML = '<circle class="progress-ring-bg" cx="24" cy="24" r="20"/><circle class="progress-ring-fill" cx="24" cy="24" r="20"/>';
    btn.prepend(svg);
    const circle = svg.querySelector('.progress-ring-fill');
    const circumference = 2 * Math.PI * 20;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;
    scrollBus.register((scrollY, docH, winH) => {
      const h = docH - winH;
      circle.style.strokeDashoffset = circumference * (1 - (h > 0 ? scrollY / h : 0));
    });
  }

  // ─── Gallery Lightbox ───
  function initGalleryLightbox() {
    const items = $$('.gallery-grid .gallery-item');
    if (!items.length) return;
    const images = items.map(item => item.querySelector('img').src.replace('w=400', 'w=1200').replace('h=400', 'h=1200').replace('h=600', 'h=1200'));
    let currentIdx = 0;
    function open(idx) {
      currentIdx = idx;
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = `
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <button class="lightbox-prev" aria-label="Previous"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        <button class="lightbox-next" aria-label="Next"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
        <div class="lightbox-counter">${idx + 1} / ${images.length}</div>
        <img class="lightbox-img" src="${images[idx]}" alt="Gallery image">`;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
      const img = overlay.querySelector('.lightbox-img');
      const counter = overlay.querySelector('.lightbox-counter');
      function navigate(dir) {
        currentIdx = (currentIdx + dir + images.length) % images.length;
        img.style.opacity = '0';
        setTimeout(() => { img.src = images[currentIdx]; img.style.opacity = '1'; counter.textContent = `${currentIdx + 1} / ${images.length}`; }, 200);
      }
      overlay.querySelector('.lightbox-prev').addEventListener('click', () => navigate(-1));
      overlay.querySelector('.lightbox-next').addEventListener('click', () => navigate(1));
      overlay.querySelector('.lightbox-close').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      let sx = 0;
      overlay.addEventListener('pointerdown', e => { sx = e.clientX; });
      overlay.addEventListener('pointerup', e => {
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 60) navigate(dx < 0 ? 1 : -1);
      });
      document.addEventListener('keydown', onKey);
      function onKey(e) {
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
      }
      function close() {
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKey);
        setTimeout(() => overlay.remove(), 400);
      }
    }
    items.forEach((item, idx) => {
      item.addEventListener('click', e => { e.preventDefault(); open(idx); });
    });
  }


  // ─── Scroll-Triggered Promo Banner ───
  function initPromoBanner() {
    if (sessionStorage.getItem('dd_promo_dismissed')) return;
    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) return;
    function onScroll(scrollY, docH, winH) {
      const h = docH - winH;
      if (h <= 0 || scrollY / h < 0.55) return;
      scrollBus.unregister(onScroll);
      const banner = document.createElement('div');
      banner.className = 'promo-banner';
      banner.innerHTML = `
        <div class="promo-banner-inner">
          <span>First order? Use code <strong>WELCOME10</strong> for 10% off</span>
          <a href="shop.html" class="btn btn-primary btn-sm">Shop Now</a>
          <button class="promo-banner-close" aria-label="Dismiss">&times;</button>
        </div>`;
      document.body.appendChild(banner);
      requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('visible')));
      banner.querySelector('.promo-banner-close').addEventListener('click', () => {
        banner.classList.remove('visible');
        sessionStorage.setItem('dd_promo_dismissed', '1');
        setTimeout(() => banner.remove(), 400);
      });
    }
    scrollBus.register(onScroll);
  }

  // ─── Reading Progress Bar (Journal) ───
  function initReadingProgress() {
    const article = $('article, .article-content, .journal-article');
    if (!article) return;
    const bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.innerHTML = '<div class="reading-progress-fill"></div>';
    document.body.prepend(bar);
    const fill = bar.querySelector('.reading-progress-fill');
    scrollBus.register((scrollY, docH, winH) => {
      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + scrollY;
      const articleHeight = article.offsetHeight;
      const scrolled = scrollY - articleTop + winH * 0.3;
      fill.style.width = (Math.max(0, Math.min(1, scrolled / articleHeight)) * 100) + '%';
    });
  }

  // ─── Animated Empty States ───
  function initEmptyStates() {
    const searchSuggestions = $('#searchSuggestions');
    if (searchSuggestions) {
      const input = $('#searchInput');
      if (input) {
        const origHandler = input.oninput;
        input.addEventListener('input', () => {
          setTimeout(() => {
            const noResults = searchSuggestions.querySelector('.search-no-results');
            if (noResults) {
              noResults.innerHTML = `
                <div class="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" opacity="0.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></svg>
                  <p>No products match "<strong>${input.value}</strong>"</p>
                  <small>Try a different search term</small>
                </div>`;
            }
          }, 10);
        });
      }
    }
  }

  // ─── Undo Toast ───
  function showUndoToast(title, message, onUndo) {
    const existing = $('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-with-undo';
    toast.innerHTML = `<div class="toast-content"><strong>${title}</strong><span>${message}</span></div><button class="toast-undo-btn">Undo</button>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    let undone = false;
    toast.querySelector('.toast-undo-btn').addEventListener('click', () => {
      undone = true;
      if (onUndo) onUndo();
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => {
      if (!undone) { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }
    }, 5000);
  }

  // ─── Keyboard Shortcuts Overlay ───
  function initKeyboardShortcuts() {
    let overlayEl = null;
    const shortcuts = [
      { key: '/', desc: 'Open search' },
      { key: 'T', desc: 'Toggle dark mode' },
      { key: 'Esc', desc: 'Close overlays' },
      { key: '?', desc: 'Show this help' },
      { key: 'Home', desc: 'Scroll to top' },
      { key: String.fromCharCode(8592) + ' ' + String.fromCharCode(8594), desc: 'Navigate carousels' },
    ];
    function show() {
      if (overlayEl) return;
      overlayEl = document.createElement('div');
      overlayEl.className = 'kb-shortcuts-overlay';
      overlayEl.innerHTML = `
        <div class="kb-shortcuts-modal">
          <div class="kb-shortcuts-header">
            <h3>Keyboard Shortcuts</h3>
            <button class="kb-shortcuts-close" aria-label="Close">&times;</button>
          </div>
          <div class="kb-shortcuts-list">
            ${shortcuts.map(s => `<div class="kb-shortcut-row"><kbd>${s.key}</kbd><span>${s.desc}</span></div>`).join('')}
          </div>
        </div>`;
      document.body.appendChild(overlayEl);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => overlayEl.classList.add('visible')));
      overlayEl.querySelector('.kb-shortcuts-close').addEventListener('click', hide);
      overlayEl.addEventListener('click', e => { if (e.target === overlayEl) hide(); });
    }
    function hide() {
      if (!overlayEl) return;
      overlayEl.classList.remove('visible');
      document.body.style.overflow = '';
      setTimeout(() => { if (overlayEl) { overlayEl.remove(); overlayEl = null; } }, 400);
    }
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        if (overlayEl) hide(); else show();
      }
      if (e.key === '/' && !e.shiftKey) {
        e.preventDefault();
        const toggle = $('#searchToggle');
        if (toggle) toggle.click();
      }
      if (e.key === 't' || e.key === 'T') {
        if (!e.ctrlKey && !e.metaKey) {
          const toggle = $('#themeToggle');
          if (toggle) toggle.click();
        }
      }
      if (e.key === 'Home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ─── Service Worker ───
  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  // ─── Load Product Data ───
  async function loadProductData() {
    try {
      const res = await fetch('js/products.json');
      const data = await res.json();
      products = data.products;
      productDescriptions = data.descriptions;
      favoriteProducts = products.filter(p => p.badge === 'Best Seller' || p.rating >= 4.8).slice(0, 10);
    } catch {
      products = [];
      productDescriptions = {};
      favoriteProducts = [];
    }
    _resolveReady();
  }

  // ─── Initialize ───
  async function init() {
    initLoader();
    await loadProductData();
    initNavbar();
    initTheme();
    initSearch();

    initCarousel('featuredTrack', products, true);
    initCarousel('favoritesTrack', favoriteProducts, false);
    const relatedEl = document.getElementById('relatedTrack');
    if (relatedEl) {
      const params = new URLSearchParams(window.location.search);
      const pid = parseInt(params.get('id'), 10);
      const current = products.find(p => p.id === pid);
      const related = current
        ? products.filter(p => p.id !== current.id && p.category === current.category).concat(products.filter(p => p.category !== (current && current.category))).slice(0, 8)
        : products.slice(0, 8);
      initCarousel('relatedTrack', related, false);
    }

    initTestimonials();
    initHeroSlideshow();
    initScrollAnimations();
    initSplitText();
    initMagneticButtons();
    initScrollProgress();
    initParallax();
    initBackToTop();
    initNewsletter();
    initSmoothScroll();
    initPageTransitions();
    initDeals();
    initJournalCallouts();
    initBlurUp();
    initArticleTOC();
    initSocialShare();
    initClickTracking();
    initCursor();
    initCardTilt();
    initRipple();
    initLazyReveal();
    initSectionParallax();
    initHelpWidget();
    initQuickView();
    initSocialProof();
    initExitIntent();
    initCarouselEnhancements();
    initFloatingLabels();
    initMobileNav();
    initSmart404();
    initStickyToolbar();
    initProgressRing();
    initGalleryLightbox();
    initPromoBanner();
    initReadingProgress();
    initEmptyStates();
    initKeyboardShortcuts();
    initCookieConsent();
    initRecentlyViewed();
    initWishlist();
    registerSW();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
