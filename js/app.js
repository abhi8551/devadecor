/* ============================================
   DEVA DECOR — Premium Home Decor Store
   ============================================ */

(function () {
  'use strict';

  const AFFILIATE_TAG = 'devadecor0b-21';

  let products = [];
  let favoriteProducts = [];
  let _resolveReady;
  const dataReady = new Promise(r => { _resolveReady = r; });

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

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
      setTimeout(() => loader.remove(), 400);
    }, 300);
  }

  // ─── Navbar ───
  function initNavbar() {
    const hamburger = $('#navHamburger');
    const menu = $('#navMenu');
    const navbar = $('#navbar');
    if (hamburger && menu) {
      function toggleMenu(open) {
        const isOpen = open !== undefined ? open : !hamburger.classList.contains('active');
        hamburger.classList.toggle('active', isOpen);
        menu.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      }
      hamburger.addEventListener('click', () => toggleMenu());
      $$('.nav-link', menu).forEach(link => link.addEventListener('click', () => toggleMenu(false)));
    }
    const shopDropdown = document.querySelector('.nav-item.has-dropdown');
    if (shopDropdown) {
      const trigger = shopDropdown.querySelector(':scope > .nav-link');
      const panel = shopDropdown.querySelector('.dropdown-menu');
      if (trigger && panel) {
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        function setExpanded(open) {
          trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        shopDropdown.addEventListener('mouseenter', () => setExpanded(true));
        shopDropdown.addEventListener('mouseleave', () => setExpanded(false));
        trigger.addEventListener('focus', () => setExpanded(true));
        trigger.addEventListener('blur', e => {
          if (!shopDropdown.contains(e.relatedTarget)) setExpanded(false);
        });
        trigger.addEventListener('keydown', e => {
          if (e.key === 'Escape') {
            setExpanded(false);
            trigger.blur();
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const first = panel.querySelector('a');
            if (first) first.focus();
          }
        });
      }
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
    function updateToggleState() {
      if (!toggle) return;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    updateToggleState();
    if (toggle) {
      toggle.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('devaTheme', next);
        updateToggleState();
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
    let previousFocus = null;
    function openSearch() {
      previousFocus = document.activeElement;
      overlay.removeAttribute('hidden');
      overlay.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      setTimeout(() => input?.focus(), 300);
    }
    function closeSearch() {
      overlay.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      if (input) input.value = '';
      if (suggestions) suggestions.innerHTML = '';
      setTimeout(() => {
        overlay.setAttribute('hidden', '');
        if (previousFocus) previousFocus.focus();
      }, 300);
    }
    toggle.addEventListener('click', openSearch);
    if (close) close.addEventListener('click', closeSearch);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeSearch();
    });
    if (input && suggestions) {
      const performSearch = debounce(() => {
        const q = input.value.toLowerCase().trim();
        if (q.length < 2) { suggestions.innerHTML = ''; return; }
        const matches = products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 5);
        suggestions.innerHTML = matches.length ? matches.map(p => `<a href="${p.link}" class="search-suggestion"><img src="${p.image}" alt="${p.name}" width="50" height="50"><div><strong>${p.name}</strong><span>${p.currency || '₹'}${p.price}</span></div></a>`).join('') : '<div class="search-no-results">No products found</div>';
      }, 200);
      input.addEventListener('input', performSearch);
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
        <a href="${amazonLink}" target="_blank" rel="nofollow" class="product-card-amazon-btn">Check Price on Amazon</a>
      </div>
      <div class="product-card-info">
        <div class="product-card-category">${product.category}</div>
        ${renderStars(product.rating)}
        <h3 class="product-card-name"><a href="${product.link}">${product.name}</a></h3>
        <div class="product-card-price">
          ${product.price ? `<span class="current">${product.currency || '₹'}${product.price}</span>` : `<span class="current price-check-amazon">See price on Amazon</span>`}
          ${product.comparePrice ? `<span class="compare">${product.currency || '₹'}${product.comparePrice}</span>` : ''}
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
    if (!track) return;
    if (!items.length) {
      const sec = track.closest('section');
      if (sec) sec.style.display = 'none';
      return;
    }
    track.innerHTML = items.map(p => renderProductCard(p)).join('');
    attachCardEvents(track);
    const wrapper = track.closest('.carousel-wrapper');
    if (!wrapper) return;
    const carousel = track.closest('.carousel');
    const prevBtn = wrapper.querySelector('.carousel-prev');
    const nextBtn = wrapper.querySelector('.carousel-next');
    const card = track.querySelector('.product-card');
    const scrollAmount = card ? card.offsetWidth + 24 : 300;

    function updateScrollIndicator() {
      if (!carousel) return;
      const isAtEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
      carousel.classList.toggle('at-end', isAtEnd);
    }

    track.addEventListener('scroll', updateScrollIndicator, { passive: true });
    setTimeout(updateScrollIndicator, 100);

    if (prevBtn) prevBtn.addEventListener('click', () => track.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    if (nextBtn) nextBtn.addEventListener('click', () => track.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
    if (autoScroll) {
      let interval = setInterval(() => {
        const isAtEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
        if (isAtEnd) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }, 5000);
      wrapper.addEventListener('mouseenter', () => clearInterval(interval));
      wrapper.addEventListener('mouseleave', () => { 
        interval = setInterval(() => {
          const isAtEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
          if (isAtEnd) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }, 5000); 
      });
    }
  }

  // Product page functions moved to js/product.js

  // ─── Hero Slideshow ───
  function initHeroSlideshow() {
    const slides = $$('.hero-slide');
    const dots = $$('.hero-dot');
    if (slides.length < 2) return;
    let current = 0;
    let interval;

    function goToSlide(index) {
      slides[current].classList.remove('active');
      dots[current]?.classList.remove('active');
      current = index;
      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }

    function nextSlide() {
      goToSlide((current + 1) % slides.length);
    }

    function startAutoplay() {
      interval = setInterval(nextSlide, 6000);
    }

    function stopAutoplay() {
      clearInterval(interval);
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        stopAutoplay();
        goToSlide(i);
        startAutoplay();
      });
    });

    const hero = $('#hero');
    if (hero) {
      let touchStartX = 0;
      hero.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      hero.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          stopAutoplay();
          if (diff > 0) {
            goToSlide((current + 1) % slides.length);
          } else {
            goToSlide((current - 1 + slides.length) % slides.length);
          }
          startAutoplay();
        }
      }, { passive: true });
    }

    startAutoplay();
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
                if (num.classList.contains('stat-num--static')) return;
                const hadPlus = num.textContent.includes('+');
                const target = parseInt(num.textContent, 10);
                if (Number.isNaN(target)) return;
                let count = 0;
                const step = Math.max(1, Math.ceil(target / 60));
                const timer = setInterval(() => {
                  count += step;
                  if (count >= target) { count = target; clearInterval(timer); }
                  num.textContent = count.toLocaleString() + (hadPlus ? '+' : '');
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
      const action = (form.getAttribute('action') || '').trim();
      if (!action || action === '#' || !/^https?:\/\//i.test(action) || /YOUR_.+FORM_ID/i.test(action)) {
        showToast('Newsletter', 'Add your Formspree form id in index.html (search YOUR_NEWSLETTER_FORM_ID), or email hello.devadecor@gmail.com.');
        return;
      }
      const email = form.querySelector('input[type="email"]').value;
      const btn = form.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Subscribing…';
      try {
        const res = await fetch(action, {
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
        showToast('Error', 'Could not subscribe right now. Please try again later.');
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
    $$('a[href^="/"]').forEach(link => {
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
    if (!deals.length) {
      const sec = grid.closest('.deals-section');
      if (sec) sec.style.display = 'none';
      return;
    }
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
            <span class="current">${p.currency || '₹'}${p.price}</span>
            <span class="compare">${p.currency || '₹'}${p.comparePrice}</span>
          </div>
          <a href="${getAmazonLink(p)}" target="_blank" rel="nofollow" class="btn btn-amazon">Check Price on Amazon</a>
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
    const picks = [products[0], products[Math.min(4, products.length - 1)]];
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
            <span class="current">${p.currency || '₹'}${p.price}</span>
            ${p.comparePrice ? `<span class="compare">${p.currency || '₹'}${p.comparePrice}</span>` : ''}
          </div>
          <a href="${getAmazonLink(p)}" target="_blank" rel="nofollow" class="btn btn-amazon">Check Price on Amazon</a>
        </div>`;
    });
  }

  // ─── Help Widget ───
  function initHelpWidget() {
    const widget = document.createElement('div');
    widget.className = 'help-widget';
    widget.innerHTML = `<button class="help-widget-trigger" aria-label="Need help?"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button><div class="help-widget-panel"><h4>Need Help?</h4><a href="/contact#faq" class="help-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>FAQ</a><a href="/contact" class="help-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Contact Us</a><a href="https://wa.me/919251130947?text=Hi%2C%20I%20have%20a%20question%20about%20Deva%20Decor%20products" target="_blank" rel="noopener" class="help-link help-link--whatsapp"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp</a></div>`;
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
      const link = e.target.closest('a[href*="amazon."]');
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
    let previousFocus = null;
    function getProductImages(product) {
      if (product.images && product.images.length) return product.images;
      return [product.image];
    }
    function open(product) {
      if (overlay) overlay.remove();
      previousFocus = document.activeElement;
      const desc = product.description || 'Beautifully crafted piece to elevate your living space.';
      const amazonLink = getAmazonLink(product);
      const savePct = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
      const images = getProductImages(product);
      overlay = document.createElement('div');
      overlay.className = 'quickview-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Quick view: ' + product.name);
      overlay.innerHTML = `
        <div class="quickview-modal">
          <button class="quickview-close" aria-label="Close quick view">&times;</button>
          <div class="quickview-grid">
            <div class="quickview-img-col">
              <div class="quickview-img-main">
                <img src="${images[0]}" alt="${product.name}" width="600" height="800" class="qv-main-img">
                ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
              </div>
              <div class="quickview-thumbs" role="group" aria-label="Product images">
                ${images.map((img, i) => `<button class="qv-thumb${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="View image ${i + 1} of ${images.length}"><img src="${img}" alt="" width="80" height="80"></button>`).join('')}
              </div>
            </div>
            <div class="quickview-details">
              <span class="quickview-category">${product.category}</span>
              <h2 class="quickview-title" id="qv-title">${product.name}</h2>
              ${renderStars(product.rating)}
              <div class="quickview-price">
                <span class="current">${product.currency || '₹'}${product.price}</span>
                ${product.comparePrice ? `<span class="compare">${product.currency || '₹'}${product.comparePrice}</span>` : ''}
                ${savePct ? `<span class="quickview-save">Save ${savePct}%</span>` : ''}
              </div>
              <p class="quickview-desc">${desc}</p>
              <div class="quickview-actions">
                <a href="${amazonLink}" target="_blank" rel="nofollow" class="btn btn-primary quickview-buy">Check Price on Amazon</a>
                <a href="${product.link}" class="btn btn-outline">View Details</a>
              </div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
      const closeBtn = overlay.querySelector('.quickview-close');
      setTimeout(() => closeBtn.focus(), 100);
      const mainImg = overlay.querySelector('.qv-main-img');
      overlay.querySelectorAll('.qv-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          overlay.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          mainImg.style.opacity = '0';
          setTimeout(() => { mainImg.src = images[parseInt(thumb.dataset.idx, 10)]; mainImg.style.opacity = '1'; }, 180);
        });
      });
      closeBtn.addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onEsc);
    }
    function close() {
      if (!overlay) return;
      overlay.classList.remove('visible');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
      setTimeout(() => {
        if (overlay) { overlay.remove(); overlay = null; }
        if (previousFocus) previousFocus.focus();
      }, 400);
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

  // ─── Cookie Consent ───
  function initCookieConsent() {
    if (localStorage.getItem('dd_cookie_consent')) return;
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <p>We use cookies to enhance your experience and analyze site traffic. By continuing, you agree to our <a href="/privacy">Privacy Policy</a>.</p>
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
    if (pid && window.location.pathname.includes('products')) {
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
      <a href="/" class="mobile-nav-item${window.location.pathname === '/' || window.location.pathname === '/index.html' ? ' active' : ''}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <span>Home</span>
      </a>
      <a href="/shop" class="mobile-nav-item${window.location.pathname.includes('shop') ? ' active' : ''}">
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
      window.location.href = '/shop';
    });
  }

  // ─── Smart 404 Products ───
  function initSmart404() {
    const grid = $('#smart404Grid');
    if (!grid) return;
    const popular = products.filter(p => p.rating >= 4.7 || p.badge === 'Best Seller');
    const items = popular.length ? popular.slice(0, 6) : products.slice(0, 6);
    grid.innerHTML = items.map(p => renderProductCard(p)).join('');
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

  // ─── Scroll-Triggered Promo Banner ───
  function initPromoBanner() {
    if (sessionStorage.getItem('dd_promo_dismissed')) return;
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') return;
    function onScroll(scrollY, docH, winH) {
      const h = docH - winH;
      if (h <= 0 || scrollY / h < 0.55) return;
      scrollBus.unregister(onScroll);
      const banner = document.createElement('div');
      banner.className = 'promo-banner';
      banner.innerHTML = `
        <div class="promo-banner-inner">
          <span>Curated Home Decor &mdash; Fulfilled by Amazon India</span>
          <a href="/shop" class="btn btn-primary btn-sm">Browse Collection</a>
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
  let catalogLoadFailed = false;

  async function loadProductData() {
    catalogLoadFailed = false;
    try {
      const res = await fetch('/js/products.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || !Array.isArray(data.products)) throw new Error('Invalid catalog');
      products = data.products;
      const faves = products.filter(p => p.badge === 'Best Seller' || p.rating >= 4.8);
      favoriteProducts = faves.length ? faves.slice(0, 10) : products.slice(0, 10);
    } catch {
      catalogLoadFailed = true;
      products = [];
      favoriteProducts = [];
    }
    _resolveReady();
  }

  function showCatalogErrorBanner() {
    if (!catalogLoadFailed) return;
    const bar = document.createElement('div');
    bar.className = 'catalog-load-banner';
    bar.setAttribute('role', 'alert');
    bar.innerHTML = '<p>We could not load the product catalog. Check your connection and refresh the page.</p>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function initDynamicNavCategories() {
    const col = document.getElementById('navCategoryLinks');
    if (!col || !products.length) return;
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
    cats.forEach(function (cat) {
      const a = document.createElement('a');
      a.href = '/shop?cat=' + encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'));
      a.textContent = cat;
      col.appendChild(a);
    });
  }

  // ─── Initialize ───
  async function init() {
    initLoader();

    initNavbar();
    initTheme();
    initSearch();
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
    initRipple();
    initLazyReveal();
    initSectionParallax();
    initHelpWidget();
    initCarouselEnhancements();
    initFloatingLabels();
    initMobileNav();
    initSmart404();
    initStickyToolbar();
    initProgressRing();
    initPromoBanner();
    initReadingProgress();
    initEmptyStates();
    initKeyboardShortcuts();
    initCookieConsent();
    registerSW();

    await loadProductData();
    showCatalogErrorBanner();

    const statProductCount = $('#statProductCount');
    if (statProductCount) statProductCount.textContent = String(products.length);
    initDynamicNavCategories();

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

    initCardTilt();
    initQuickView();
    initRecentlyViewed();
    initWishlist();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
