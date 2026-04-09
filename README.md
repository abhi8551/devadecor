# Deva Decor — Premium Home Decor Store

A premium, SEO-optimized eCommerce storefront for curated home decor. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build step. Products are fulfilled through Amazon.

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Homepage | `/` | Hero slideshow, featured products, deals, testimonials, newsletter |
| Shop All | `/shop` | Full catalog with filters, sort, grid/list toggle |
| Category Pages | `/shop?cat=X` | Deep-linked category views (wall-art, lighting, furniture, vases, rugs, mirrors, textiles) |
| Product Detail | `/products?id=X` | Dynamic product page with gallery, comparison table, sticky CTA |
| Living Room | `/room-living` | "Shop the Look" — living room inspiration with tagged products |
| Bedroom | `/room-bedroom` | "Shop the Look" — bedroom inspiration with tagged products |
| Dining Room | `/room-dining` | "Shop the Look" — dining room inspiration with tagged products |
| Journal | `/journal` | Article index with 6 linked articles |
| Mindful Spaces | `/journal-post` | Article: The Art of Mindful Living Spaces |
| Bookshelf Guide | `/journal-bookshelf` | Article: 5 Ways to Style Your Bookshelf |
| Spring Trends | `/journal-spring-trends` | Article: Spring Decor Trends 2026 |
| Rug Guide | `/journal-rug-guide` | Article: Complete Guide to Choosing a Rug |
| Lighting Guide | `/journal-lighting-guide` | Article: Room-by-Room Lighting Guide |
| Small Spaces | `/journal-small-spaces` | Article: Maximizing Small Spaces |
| Contact | `/contact` | Contact form, FAQ accordion, showroom info |
| Privacy | `/privacy` | Privacy policy |
| 404 | `/404` | Custom error page |

## Features

- **36 products** across 7 categories with ratings and descriptions
- **Category landing pages** via `/shop?cat=wall-art` with dynamic titles and meta
- **"Shop the Look"** room inspiration pages with tagged product grids
- **6 journal articles** with embedded product callout cards and JSON-LD structured data
- **Product comparison tables** on every product page
- **Today's Deals** section highlighting best discounts
- **Star ratings** with half-star support
- **Sticky CTA bar** on product pages — stays visible as users scroll
- **Blur-up image placeholders** with shimmer loading animation
- **Auto-generated TOC** and reading time on journal articles
- **Social share buttons** (Pinterest, Facebook, Twitter, Copy Link) on articles and products
- **Google Analytics** integration on all 16 pages with outbound click tracking
- **GDPR cookie consent** banner with Accept/Decline, persisted to localStorage
- **Wishlist** — heart icons on product cards, backed by localStorage, synced across pages
- **Recently Viewed** — product page tracks viewed items; shows "Continue Browsing" grid
- **Newsletter & contact forms** wired to Formspree (swap `YOUR_FORM_ID` with your endpoint)
- **Dark mode** toggle with `localStorage` persistence
- **PWA** with offline-first service worker caching and local SVG icons
- **SEO** — sitemap, robots.txt, Open Graph, Twitter Cards, JSON-LD, canonical URLs, BreadcrumbList
- **Accessibility** — skip links, ARIA labels, semantic HTML, keyboard navigation
- **Performance** — lazy loading, blur-up placeholders, preconnect hints, IntersectionObserver
- **Premium animations** — scroll-reveal variants (fade, scale, blur, rotate, clip), hero Ken Burns, section parallax, button ripple, card tilt, custom cursor, magnetic buttons
- **Visual flow** — SVG wave dividers between sections, floating orbs, accent lines

## File Structure

```
devadecorwebsite/
├── index.html              # Homepage (/)
├── shop/index.html         # Shop + category pages (/shop)
├── products/index.html     # Product detail (/products?id=X)
├── room-living/index.html  # Living room inspiration (/room-living)
├── room-bedroom/index.html # Bedroom inspiration (/room-bedroom)
├── room-dining/index.html  # Dining room inspiration (/room-dining)
├── journal/index.html      # Journal index (/journal)
├── journal-post/index.html # Article: Mindful Living Spaces
├── journal-bookshelf/index.html    # Article: Bookshelf Styling
├── journal-spring-trends/index.html # Article: Spring Trends
├── journal-rug-guide/index.html    # Article: Rug Guide
├── journal-lighting-guide/index.html # Article: Lighting Guide
├── journal-small-spaces/index.html # Article: Small Spaces
├── contact/index.html      # Contact + FAQ (/contact)
├── privacy/index.html      # Privacy policy (/privacy)
├── 404/index.html          # Error page (/404)
├── css/
│   └── styles.css          # All styles (design system + components)
├── js/
│   └── app.js              # All JavaScript (products, UI, init)
├── img/
│   ├── icon-192.svg        # PWA icon (192×192)
│   ├── icon-512.svg        # PWA icon (512×512)
│   └── apple-touch-icon.svg # Apple Touch Icon
├── tools/
│   ├── refresh-prices.js   # Price update script (Amazon PA-API)
│   ├── package.json        # Tools dependencies
│   └── .env.example        # API credentials template
├── sw.js                   # Service worker
├── manifest.json           # PWA manifest
├── sitemap.xml             # SEO sitemap
├── robots.txt              # Crawler directives
└── README.md
```

## Setup

1. **Replace Formspree IDs** — Search for `YOUR_FORM_ID` in `js/app.js` and `contact/index.html`. Replace with your Formspree form endpoint (create one free at [formspree.io](https://formspree.io)).
2. **Replace GA Measurement ID** — Search for `G-XXXXXXXXXX` across all HTML files. Replace with your GA4 Measurement ID from [analytics.google.com](https://analytics.google.com).
3. **Serve the site** — Any static file server works:
   ```bash
   python3 -m http.server 8080
   # or
   npx serve .
   ```

## Adding Products

Products live in the `products` array in `js/app.js`. Each product needs:

```javascript
{
  id: 37,
  name: 'Product Name',
  category: 'Vases',           // Must match a filter checkbox value
  price: 59,
  comparePrice: 80,            // null if no sale
  image: 'https://images.unsplash.com/photo-XXX?w=600&h=800&fit=crop',
  badge: 'New',                // 'New', 'Sale', 'Best Seller', or null
  asin: 'B0XXXXXXXXX',        // Amazon ASIN
  amazonUrl: 'https://www.amazon.com/dp/B0XXXXXXXXX',
  link: 'products?id=37',
  rating: 4.7                  // 1.0–5.0
}
```

Also add a description to the `productDescriptions` object in the same file.

## Price Updates

```bash
cd tools
cp .env.example .env        # Fill in your Amazon PA-API credentials
npm install
npm run refresh-prices       # Updates prices + PRICES_UPDATED in app.js
```

## Tech Stack

- HTML5 semantic markup
- CSS3 custom properties + media queries (mobile-first)
- Vanilla JavaScript (ES6+ in IIFE)
- PWA (service worker + manifest)
- No frameworks, no build tools, no dependencies (site itself)
