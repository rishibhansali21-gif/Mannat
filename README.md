# MANNAT — Ethnic Wear Storefront

A **launching-soon** website for the Indian ethnic wear brand
**MANNAT** — *“Woven with grace, blessed with beauty.”* (मन्नत)

> The site is currently a launch teaser: a Launching Soon landing page with a
> waitlist signup, plus a single listing — **The First Drop: 3 kurtis** — with
> product pages that collect launch-day notify-me emails. No cart, checkout or
> payments are live yet. Pure HTML5 + CSS3 + vanilla JavaScript — no frameworks, no build
step. Host it free on GitHub Pages.

## What you get

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Launching Soon hero with waitlist signup, transparent-to-solid sticky header, The First Drop (3 kurtis), brand story, waitlist newsletter, footer |
| Shop | `collections.html` | Category, price & color filters, sorting, live search results, wishlist view |
| Product | `product.html?id=...` | Image gallery, size selector, launch-day Notify Me form, accordions, related products, schema.org markup |
| Bag | `cart.html` | Quantity update, remove, subtotal, WhatsApp checkout |

Cart & wishlist persist in `localStorage`. Checkout opens WhatsApp with the
order pre-filled (no backend needed).

## File structure

```
mannat-store/
├── index.html            # home page
├── collections.html      # shop / listing page
├── product.html          # product detail page
├── cart.html             # shopping bag page
├── css/
│   └── style.css         # ★ all styles — brand colors at the top
├── js/
│   ├── cart.js           # cart + wishlist + WhatsApp checkout (load first)
│   └── main.js           # ★ CONFIG (WhatsApp number) + all page logic
├── data/
│   └── products.json     # ★ your product catalog — edit this to add products
├── assets/
│   └── images/           # 42 SVG placeholder images (tiny & crisp; swap with real photos anytime)
└── README.md
```

## (a) Upload to GitHub

**Option 1 — web UI (easiest):**
1. Create a new repository on github.com (e.g. `mannat-store`). Don't add a README.
2. Click **Add file → Upload files**, drag in *everything* from this folder
   (keep the folder structure!), commit.

**Option 2 — command line:**
```bash
cd mannat-store
git init
git add .
git commit -m "Launch MANNAT store"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mannat-store.git
git push -u origin main
```

## (b) Enable GitHub Pages (free hosting)

1. On github.com, open your repo → **Settings → Pages**.
2. Under *Build and deployment*, Source: **Deploy from a branch**.
3. Branch: **main**, folder: **/(root)** → Save.
4. Wait ~1 minute. Your store is live at:
   `https://YOUR-USERNAME.github.io/mannat-store/`

## (c) Add or edit products

Open `data/products.json`. Each product looks like this:

```json
{
  "id": "kurta-gulnaar",                 // unique, no spaces
  "name": "Gulnaar Straight Kurta Set",
  "category": "Kurtis",                 // currently only Kurtis — the launch drop
  "images": ["assets/images/prod-kurta-gulnaar-a.jpg",
             "assets/images/prod-kurta-gulnaar-b.jpg"],
  "mrp": 1999,                          // strikethrough price
  "salePrice": 899,                     // selling price (₹)
  "sizes": ["S","M","L","XL","XXL"],    // size options shown as selectable buttons
  "colors": ["Maroon","Beige"],         // shown as filter swatches
  "description": "Short product description…",
  "tags": ["bestseller","new"]          // bestseller | trending | new (drives home sections)
}
```

- **Add a product:** copy a block, change the values, add its photos to
  `assets/images/`. Any web format works (SVG, JPG, PNG) — ~800×1000px JPGs
  look best for real product shots.
- **% OFF badge** is calculated automatically from `mrp` and `salePrice`.
- The home page shows every product in `products.json` as The First Drop.
  To add a kurti, just append it to the JSON — it appears on home and in the listing.

## (d) Change WhatsApp number & brand details

1. **WhatsApp number** — open `js/main.js`, find `CONFIG` at the top:
   ```js
   WHATSAPP_NUMBER: '91XXXXXXXXXX', // ← your number: country code + number, no + or spaces
   ```
   The footer contact links (`https://wa.me/91XXXXXXXXXX`) in the four HTML
   files should be updated too — search for `91XXXXXXXXXX` and replace all.
2. **Brand colors** — open `css/style.css`, edit the `:root` variables at the
   very top: maroon `#8F1F2D`, ivory `#F3E2C5`, cream `#FFF8EF`, espresso `#2B1B14`, antique gold `#C8A96A`.
3. **Fonts** — same file: `--font-head` (Cormorant Garamond) and `--font-body` (DM Sans),
   plus the Google Fonts `<link>` in each HTML `<head>`.
4. **Announcement / hero / promo text** — edit directly in `index.html`
   (sections are marked with `★` comments).
5. **Images** — swap any file in `assets/images/` keeping the same filename,
   or update the paths in `products.json` / HTML.

## (e) Connect a custom domain (e.g. www.mannat.com)

1. Buy the domain from any registrar.
2. In the repo: **Settings → Pages → Custom domain** → enter your domain → Save.
   (This creates a `CNAME` file for you.)
3. At your registrar, add DNS records:
   - `A` records → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (for `mannat.com`)
   - `CNAME` → `YOUR-USERNAME.github.io` (for `www.mannat.com`)
4. Wait for DNS (up to 24h), then tick **Enforce HTTPS** in Pages settings.

## Local preview

```bash
cd mannat-store
python3 -m http.server 8000
# open http://localhost:8000
```
(Opening `index.html` directly via `file://` won't load `products.json` —
use the command above or any static server.)

## Notes

- All prices in ₹ INR. The `% OFF` badge, totals and WhatsApp message are
  computed automatically.
- Newsletter signup is front-end only (saved to localStorage) — connect it to
  your email tool (Mailchimp etc.) when ready; see the `★` comment in `js/main.js`.
- Product photos here are SVG placeholders — replace with real shoot images
  (JPG/PNG) before launch; just update the paths in `data/products.json`.
