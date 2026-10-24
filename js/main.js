/* ==========================================================================
   MANNAT — main storefront logic. Loaded AFTER js/cart.js on every page.
   Pages declare <body data-page="home|collections|product|cart">.
   ========================================================================== */
'use strict';

/* ==========================================================================
   ★ EDIT YOUR STORE SETTINGS HERE
   ========================================================================== */
const CONFIG = {
  WHATSAPP_NUMBER: '91XXXXXXXXXX', // ★ EDIT: your WhatsApp number, country code + number, no "+" or spaces
  BRAND: 'MANNAT',
  TAGLINE: 'Woven with grace',
  FREE_SHIP_THRESHOLD: 0,         // 0 = free shipping on everything (as advertised)
};

/* color name -> swatch hex (used on the collections filter) — ★ add yours */
const COLOR_HEX = {
  'Maroon': '#8F1F2D', 'Red': '#C0392B',
  'Beige': '#E9DCC8', 'Gold': '#C8A96A', 'Peach': '#F2C9A8',
  'Olive': '#6B7245', 'Sage': '#9CAF88', 'Black': '#1c1a19',
  'Grey': '#8A8A8A', 'Terracotta': '#C96F4A', 'White': '#ffffff'
};
const swatchHex = name => COLOR_HEX[name] || '#E9DCC8';

/* ---------- product data ---------- */
let PRODUCTS = [];
async function loadProducts() {
  if (PRODUCTS.length) return PRODUCTS;
  const res = await fetch('data/products.json');
  if (!res.ok) throw new Error('products.json not found');
  const data = await res.json();
  PRODUCTS = data.products || [];
  window.MANNAT_PRODUCTS = PRODUCTS; // cart.js reads this
  return PRODUCTS;
}
const byId = id => PRODUCTS.find(p => p.id === id);
const discountPct = p => Math.round((1 - p.salePrice / p.mrp) * 100);

/* ---------- shared product card ---------- */
function productCardHTML(p) {
  // Launching Soon: cards link to the product page — no cart, no wishlist yet.
  return `
  <article class="pcard" data-id="${p.id}">
    <a class="pcard-media" href="product.html?id=${p.id}" aria-label="${esc(p.name)}">
      <img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy">
    </a>
    <span class="off-badge">${discountPct(p)}% OFF</span>
    <div class="pcard-body">
      <span class="pcard-cat">${esc(p.category)}</span>
      <a href="product.html?id=${p.id}"><h3 class="pcard-name">${esc(p.name)}</h3></a>
      <div class="pcard-price">
        <span class="sale">${inr(p.salePrice)}</span>
        <span class="mrp">${inr(p.mrp)}</span>
      </div>
      <a class="pcard-add" href="product.html?id=${p.id}">View Details</a>
    </div>
  </article>`;
}
function skeletonHTML(n) {
  return Array.from({ length: n }, () => `
    <div class="skel"><div class="sk-img shimmer"></div>
      <div class="sk-line shimmer" style="width:60%"></div>
      <div class="sk-line shimmer" style="width:85%"></div>
      <div class="sk-line shimmer" style="width:40%"></div></div>`).join('');
}
/* wire up Add-to-Cart + wishlist buttons inside a container */
function bindCardButtons(scope) {
  $all('[data-add]', scope).forEach(btn => btn.addEventListener('click', () => {
    const p = byId(btn.dataset.add);
    if (!p) return;
    const size = p.sizes.includes('M') ? 'M' : p.sizes[0]; // quick-add with default size
    Cart.add(p.id, size, 1);
    toast(p.name + ' added to bag ✓');
    renderDrawer();
    openCart();
  }));
  $all('.wish-btn', scope).forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    const added = Wishlist.toggle(btn.dataset.id);
    btn.classList.toggle('active', added);
    btn.setAttribute('aria-pressed', added);
    toast(added ? 'Saved to wishlist ♡' : 'Removed from wishlist');
    updateBadges();
  }));
}

/* ==========================================================================
   HEADER: mobile drawer, search with live suggestions
   ========================================================================== */
function initHeader() {
  // mobile drawer
  const open = $('#menuOpen'), drawer = $('#navDrawer'), scrim = $('#navScrim');
  if (open && drawer) {
    const close = () => {
      drawer.classList.remove('open'); scrim.classList.remove('open');
      document.body.style.overflow = '';
    };
    open.addEventListener('click', () => {
      drawer.classList.add('open'); scrim.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    $('#navClose').addEventListener('click', close);
    scrim.addEventListener('click', close);
  }
  // search
  const sBtn = $('#searchBtn'), panel = $('#searchPanel'), input = $('#searchInput');
  if (sBtn && panel) {
    sBtn.addEventListener('click', () => {
      const hidden = panel.hidden;
      panel.hidden = !hidden;
      if (!hidden) { input.value = ''; $('#searchSuggest').innerHTML = ''; }
      else input.focus();
    });
    document.addEventListener('click', e => {
      if (!panel.hidden && !e.target.closest('.search-wrap')) panel.hidden = true;
    });
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => renderSuggestions(input.value.trim()), 160);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) {
        location.href = 'collections.html?search=' + encodeURIComponent(input.value.trim());
      }
    });
  }
}
function renderSuggestions(q) {
  const box = $('#searchSuggest');
  if (!q) { box.innerHTML = ''; return; }
  const hits = PRODUCTS.filter(p =>
    (p.name + ' ' + p.category + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(q.toLowerCase())
  ).slice(0, 6);
  box.innerHTML = hits.length ? hits.map(p => `
    <a href="product.html?id=${p.id}">
      <img src="${p.images[0]}" alt="" loading="lazy">
      <span>${esc(p.name)}<br><small style="color:var(--muted)">${esc(p.category)}</small></span>
      <span class="s-price">${inr(p.salePrice)}</span>
    </a>`).join('')
    : `<p class="search-empty">No matches for “${esc(q)}”. Try “kurta”, “saree”…</p>`;
}

/* ==========================================================================
   HERO slider
   ========================================================================== */
function initHero() {
  const track = $('#heroTrack');
  if (!track) return;
  const slides = $all('.hero-slide', track);
  const dots = $('#heroDots');
  let i = 0, timer;
  slides.forEach((_, n) => {
    const d = document.createElement('button');
    d.setAttribute('aria-label', 'Go to slide ' + (n + 1));
    d.addEventListener('click', () => { go(n); restart(); });
    dots.appendChild(d);
  });
  const dotBtns = $all('button', dots);
  function go(n) {
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${i * 100}%)`;
    dotBtns.forEach((d, k) => d.classList.toggle('active', k === i));
  }
  function restart() { clearInterval(timer); timer = setInterval(() => go(i + 1), 5000); }
  $('#heroPrev').addEventListener('click', () => { go(i - 1); restart(); });
  $('#heroNext').addEventListener('click', () => { go(i + 1); restart(); });
  // pause on touch so users can read
  track.addEventListener('pointerdown', () => clearInterval(timer), { passive: true });
  track.addEventListener('pointerup', restart, { passive: true });
  go(0); restart();
}

/* ==========================================================================
   HOME page
   ========================================================================== */
function railHTML(products) {
  return products.map(productCardHTML).join('');
}
function initHome() {
  // The First Drop: all 3 launch kurtis
  const el = document.getElementById('gridFirstDrop');
  if (el) { el.innerHTML = PRODUCTS.map(productCardHTML).join(''); }
  // premium transparent header -> solid on scroll (home only)
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

/* ==========================================================================
   COLLECTIONS page — filters + sort
   ========================================================================== */
const Shop = {
  cats: new Set(), colors: new Set(), prices: new Set(),
  sort: 'featured', search: '', tag: null, // tag: new | wedding | under999 | everyday
};
function initCollections() {
  const params = new URLSearchParams(location.search);
  if (params.get('category')) Shop.cats.add(params.get('category'));
  if (params.get('tag')) Shop.tag = params.get('tag');
  if (params.get('search')) Shop.search = params.get('search');
  if (params.get('sort')) Shop.sort = params.get('sort');
  if (params.get('wishlist') === '1') Shop._wishlist = true;

  // build filter UI from catalog
  const cats = [...new Set(PRODUCTS.map(p => p.category))];
  $('#fCats').innerHTML = cats.map(c => `
    <label class="f-check"><input type="checkbox" value="${esc(c)}" ${Shop.cats.has(c) ? 'checked' : ''}> ${esc(c)}</label>`).join('');
  const colors = [...new Set(PRODUCTS.flatMap(p => p.colors || []))];
  $('#fColors').innerHTML = colors.map(c => `
    <button class="swatch ${Shop.colors.has(c) ? 'active' : ''}" data-color="${esc(c)}"
      style="background:${swatchHex(c)}" title="${esc(c)}" aria-label="Filter by ${esc(c)}" aria-pressed="${Shop.colors.has(c)}"></button>`).join('');
  $('#sortSel').value = Shop.sort;
  if (Shop.search) $('#searchEcho').textContent = `Results for “${Shop.search}”`;

  // events
  $('#fCats').addEventListener('change', () => {
    Shop.cats = new Set($all('#fCats input:checked').map(i => i.value));
    applyShop();
  });
  $('#fColors').addEventListener('click', e => {
    const b = e.target.closest('.swatch'); if (!b) return;
    const c = b.dataset.color;
    Shop.colors.has(c) ? Shop.colors.delete(c) : Shop.colors.add(c);
    b.classList.toggle('active'); b.setAttribute('aria-pressed', Shop.colors.has(c));
    applyShop();
  });
  $all('#fPrices input').forEach(i => i.addEventListener('change', () => {
    Shop.prices = new Set($all('#fPrices input:checked').map(x => x.value));
    applyShop();
  }));
  $('#minPrice').addEventListener('change', applyShop);
  $('#maxPrice').addEventListener('change', applyShop);
  $('#sortSel').addEventListener('change', e => { Shop.sort = e.target.value; applyShop(); });
  $('#clearFilters').addEventListener('click', () => {
    Shop.cats.clear(); Shop.colors.clear(); Shop.prices.clear();
    Shop.tag = null; Shop._wishlist = false; Shop.search = '';
    $('#minPrice').value = ''; $('#maxPrice').value = '';
    history.replaceState(null, '', 'collections.html');
    initCollections(); // rebuild UI
  });
  applyShop();
}
function priceInRange(p) {
  if (!Shop.prices.size) return true;
  return [...Shop.prices].some(r => {
    if (r === 'u1000') return p.salePrice < 1000;
    if (r === '1000-1500') return p.salePrice >= 1000 && p.salePrice <= 1500;
    if (r === '1500p') return p.salePrice > 1500;
    return true;
  });
}
function applyShop() {
  const min = parseInt($('#minPrice').value, 10), max = parseInt($('#maxPrice').value, 10);
  let list = PRODUCTS.filter(p => {
    if (Shop.cats.size && !Shop.cats.has(p.category)) return false;
    if (Shop.colors.size && !(p.colors || []).some(c => Shop.colors.has(c))) return false;
    if (!priceInRange(p)) return false;
    if (!isNaN(min) && p.salePrice < min) return false;
    if (!isNaN(max) && p.salePrice > max) return false;
    if (Shop._wishlist && !Wishlist.has(p.id)) return false;
    if (Shop.tag && !(p.tags || []).includes(Shop.tag)) return false;
    if (Shop.search && !(p.name + ' ' + p.category).toLowerCase().includes(Shop.search.toLowerCase())) return false;
    return true;
  });
  if (Shop.sort === 'low') list.sort((a, b) => a.salePrice - b.salePrice);
  if (Shop.sort === 'high') list.sort((a, b) => b.salePrice - a.salePrice);
  if (Shop.sort === 'new') list.sort((a, b) =>
    (((b.tags || []).includes('new')) - ((a.tags || []).includes('new'))));
  const grid = $('#shopGrid');
  $('#resultCount').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
  grid.innerHTML = list.length ? list.map(productCardHTML).join('') :
    `<div class="empty-state"><h3>No matches found</h3><p>Try clearing a filter or two.</p></div>`;
  bindCardButtons(grid);
  // reflect tag/category in the title when launched from a tile or promo card
  const TAG_TITLES = { new: 'New Arrivals', wedding: 'Wedding Collection', under999: 'Under ₹999', everyday: 'Everyday Elegance' };
  if (Shop._wishlist) {
    $('#shopTitle').textContent = 'My Wishlist';
  } else if (Shop.tag && TAG_TITLES[Shop.tag]) {
    $('#shopTitle').textContent = TAG_TITLES[Shop.tag];
  } else if (Shop.cats.size === 1 && !Shop.search) {
    $('#shopTitle').textContent = [...Shop.cats][0];
  }
}

/* ==========================================================================
   PRODUCT page
   ========================================================================== */
function initProduct() {
  const id = new URLSearchParams(location.search).get('id');
  const p = byId(id);
  if (!p) {
    $('#pdRoot').innerHTML = `<div class="empty-state"><h3>Product not found</h3>
      <p><a href="collections.html" style="color:var(--maroon);text-decoration:underline">Back to shop</a></p></div>`;
    return;
  }
  document.title = `${p.name} — MANNAT`;

  // gallery grid (2-column tiles; badges on the first tile)
  $('#pdGallery').innerHTML = p.images.map((src, i) => `
    <div class="pd2-tile">
      <img src="${src}" alt="${esc(p.name)} view ${i + 1}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
      ${i === 0 ? '<span class="pd2-badge badge-gold">✦ Launching Soon</span><span class="pd2-badge badge-maroon">First Drop</span>' : ''}
    </div>`).join('');

  // buy box info
  $('#pdName').textContent = p.name;
  $('#pdSubtitle').textContent = p.subtitle || p.category;
  $('#pdSale').textContent = inr(p.salePrice);
  $('#pdMrp').textContent = inr(p.mrp);
  $('#pdColors').textContent = (p.colors || []).join(', ');
  $('#pdDesc').textContent = p.description;
  $('#pdSku').textContent = 'SKU: ' + p.id.toUpperCase();

  // schema.org Product markup (SEO) — PreOrder while launching soon
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.name, category: p.category, description: p.description,
    image: p.images.map(src => new URL(src, location.href).href),
    sku: p.id,
    offers: {
      '@type': 'Offer', priceCurrency: 'INR', price: p.salePrice,
      availability: 'https://schema.org/PreOrder'
    }
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);

  // sizes (pill buttons)
  const sizeRow = $('#sizeRow');
  const single = p.sizes.length === 1;
  sizeRow.innerHTML = p.sizes.map((s, i) => `
    <button class="size-btn ${single ? 'active' : ''}"
      data-size="${esc(s)}" ${single ? 'aria-pressed="true"' : ''}>${esc(s)}</button>`).join('');
  let size = single ? p.sizes[0] : null;
  $all('.size-btn', sizeRow).forEach(b => b.addEventListener('click', () => {
    $all('.size-btn', sizeRow).forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
    size = b.dataset.size;
  }));

  // Launching Soon: notify-me form instead of cart actions
  const pdForm = $('#pdNotifyForm');
  if (pdForm) pdForm.addEventListener('submit', e => {
    e.preventDefault();
    const em = $('#pdNotifyEmail').value.trim();
    const msg = $('#pdNotifyMsg');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      msg.textContent = 'Please enter a valid email address.';
      msg.style.color = '#FFD9A0'; return;
    }
    try { localStorage.setItem('mannat_notify_' + p.id, em); } catch (err) {}
    msg.textContent = 'You are on the list! We will email you on launch day. ♥';
    msg.style.color = 'var(--gold)';
    pdForm.reset();
  });

  // accordions (Fit & Sizing starts open, like the reference)
  $all('.acc-btn').forEach(b => {
    const item = b.parentElement, panel = $('.acc-panel', item);
    if (item.classList.contains('open')) panel.style.maxHeight = panel.scrollHeight + 'px';
    b.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      b.setAttribute('aria-expanded', open);
    });
  });

  // Complete the Look: the rest of the first drop
  const look = PRODUCTS.filter(x => x.id !== p.id);
  const lookBox = $('#lookGrid');
  if (lookBox) lookBox.innerHTML = look.map(productCardHTML).join('');
}

/* ==========================================================================
   CART page
   ========================================================================== */
function renderCartPage() {
  const box = $('#cartPageItems');
  if (!box) return; // not on cart page
  const lines = Cart.detailed(PRODUCTS);
  if (!lines.length) {
    box.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <h3>Your bag is empty</h3><p>Beautiful things await you.</p>
      <p style="margin-top:16px"><a class="btn" href="collections.html">Start Shopping</a></p></div>`;
    $('#cartSummary').style.display = 'none';
    return;
  }
  $('#cartSummary').style.display = '';
  box.innerHTML = lines.map(d => `
    <div class="c-item" style="background:var(--beige-light);border:1px solid var(--line);border-radius:14px;padding:12px">
      <a href="product.html?id=${d.product.id}"><img src="${d.product.images[0]}" alt="${esc(d.product.name)}" loading="lazy"></a>
      <div class="c-item-info">
        <h4>${esc(d.product.name)}</h4>
        <p class="c-meta">Size: ${esc(d.size)} · <span class="mrp" style="text-decoration:line-through">${inr(d.product.mrp)}</span></p>
        <div class="c-item-row">
          <div class="c-qty">
            <button data-act="dec" data-i="${d.index}" aria-label="Decrease quantity">−</button>
            <output>${d.qty}</output>
            <button data-act="inc" data-i="${d.index}" aria-label="Increase quantity">+</button>
          </div>
          <span class="c-item-price">${inr(d.lineTotal)}</span>
        </div>
        <button class="c-remove" data-act="rm" data-i="${d.index}">Remove</button>
      </div>
    </div>`).join('');
  const sub = Cart.subtotal(PRODUCTS);
  $('#sumSubtotal').textContent = inr(sub);
  $('#sumTotal').textContent = inr(sub);
  $all('[data-act]', box).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i, act = b.dataset.act;
    if (act === 'inc') Cart.setQty(i, Cart.items[i].qty + 1);
    if (act === 'dec') Cart.setQty(i, Cart.items[i].qty - 1);
    if (act === 'rm') Cart.remove(i);
    renderCartPage(); renderDrawer();
  }));
}
function initCartPage() {
  renderCartPage();
  const co = $('#checkoutBtn');
  if (co) co.addEventListener('click', checkoutWhatsApp);
  const cc = $('#clearBtn');
  if (cc) cc.addEventListener('click', () => { Cart.clear(); renderCartPage(); renderDrawer(); toast('Bag cleared.'); });
}

/* ==========================================================================
   misc: newsletter, reveal-on-scroll, footer year
   ========================================================================== */
function initMisc() {
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  const form = $('#nlForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const em = $('#nlEmail').value.trim();
    const msg = $('#nlMsg');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      msg.textContent = 'Please enter a valid email address.';
      msg.style.color = '#FFD9A0'; return;
    }
    // ★ front-end only: hook this up to your email tool later
    try { localStorage.setItem('mannat_newsletter', em); } catch (e) {}
    msg.textContent = 'Welcome to the MANNAT family! Check your inbox soon. ♥';
    msg.style.color = '#fff';
    form.reset();
  });
  // hero launching-soon notify form (same waitlist)
  const heroForm = $('#heroNotifyForm');
  if (heroForm) heroForm.addEventListener('submit', e => {
    e.preventDefault();
    const em = $('#heroNotifyEmail').value.trim();
    const msg = $('#heroNotifyMsg');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      msg.textContent = 'Please enter a valid email address.';
      msg.style.color = '#FFD9A0'; return;
    }
    try { localStorage.setItem('mannat_newsletter', em); } catch (err) {}
    msg.textContent = 'You are on the waitlist! We will email you on launch day. ♥';
    msg.style.color = '#fff';
    heroForm.reset();
  });
  // reveal on scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  $all('.reveal').forEach(el => io.observe(el));
}

/* ==========================================================================
   boot
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  initMisc();
  const page = document.body.dataset.page || 'home';
  try {
    // skeletons while the catalog loads
    $all('[data-skeleton]').forEach(el => { el.innerHTML = skeletonHTML(4); });
    await loadProducts();
  } catch (e) {
    $all('[data-skeleton]').forEach(el => {
      el.innerHTML = `<div class="empty-state"><h3>Couldn’t load products</h3>
        <p>Please check your connection and refresh.</p></div>`;
    });
    return;
  }
  updateBadges();
  if (page === 'home') { initHero(); initHome(); }
  if (page === 'collections') initCollections();
  if (page === 'product') initProduct();
  if (page === 'cart') initCartPage();
  // re-run reveal for dynamically added cards
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.08 });
  $all('.pcard').forEach(el => { el.classList.add('reveal'); io.observe(el); });
});
