/* ==========================================================================
   MANNAT — cart & wishlist (localStorage). Loaded on every page.
   Depends on: CONFIG from main.js (WHATSAPP_NUMBER). Include this file
   BEFORE main.js:  <script src="js/cart.js"></script>
                    <script src="js/main.js"></script>
   ========================================================================== */
'use strict';

/* ---------- tiny helpers ---------- */
function $(sel, scope) { return (scope || document).querySelector(sel); }
function $all(sel, scope) { return Array.from((scope || document).querySelectorAll(sel)); }

/* ==========================================================================
   ★ EDIT: WhatsApp checkout number (defined in js/main.js CONFIG).
   Change it there — everything below uses CONFIG.WHATSAPP_NUMBER.
   ========================================================================== */

/* ---------- CART ---------- */
const Cart = {
  key: 'mannat_cart_v1',
  items: [], // [{id, size, qty}]

  load() {
    try { this.items = JSON.parse(localStorage.getItem(this.key)) || []; }
    catch (e) { this.items = []; }
    // drop malformed rows
    this.items = this.items.filter(i => i && i.id && i.qty > 0);
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.items)); } catch (e) {}
    updateBadges();
  },
  add(id, size, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    const found = this.items.find(i => i.id === id && i.size === size);
    if (found) found.qty = Math.min(99, found.qty + qty);
    else this.items.push({ id, size: size || 'One Size', qty });
    this.save();
  },
  remove(index) { this.items.splice(index, 1); this.save(); },
  setQty(index, qty) {
    qty = parseInt(qty, 10) || 0;
    if (qty <= 0) this.remove(index);
    else { this.items[index].qty = Math.min(99, qty); this.save(); }
  },
  clear() { this.items = []; this.save(); },
  count() { return this.items.reduce((n, i) => n + i.qty, 0); },
  // needs the product catalog to price lines
  detailed(products) {
    return this.items.map((i, index) => {
      const p = (products || []).find(p => p.id === i.id);
      return { index, ...i, product: p, lineTotal: p ? p.salePrice * i.qty : 0 };
    }).filter(d => d.product);
  },
  subtotal(products) { return this.detailed(products).reduce((s, d) => s + d.lineTotal, 0); }
};

/* ---------- WISHLIST ---------- */
const Wishlist = {
  key: 'mannat_wish_v1',
  ids: [],
  load() {
    try { this.ids = JSON.parse(localStorage.getItem(this.key)) || []; }
    catch (e) { this.ids = []; }
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.ids)); } catch (e) {}
    updateBadges();
  },
  toggle(id) {
    const at = this.ids.indexOf(id);
    if (at > -1) this.ids.splice(at, 1); else this.ids.push(id);
    this.save();
    return at === -1;
  },
  has(id) { return this.ids.indexOf(id) > -1; },
  count() { return this.ids.length; }
};

/* ---------- header badges ---------- */
function updateBadges() {
  const c = $('#cartCount'), w = $('#wishCount');
  if (c) { c.textContent = Cart.count(); c.hidden = Cart.count() === 0; }
  if (w) { w.textContent = Wishlist.count(); w.hidden = Wishlist.count() === 0; }
  // keep every wishlist heart in sync
  $all('.wish-btn').forEach(b => b.classList.toggle('active', Wishlist.has(b.dataset.id)));
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------- cart drawer (injected once) ---------- */
function ensureCartDrawer() {
  if ($('#cartDrawer')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="drawer-scrim" id="cartScrim"></div>
    <aside class="cart-drawer" id="cartDrawer" aria-label="Shopping bag" aria-hidden="true">
      <div class="cart-head">
        <h2>Your Bag <span id="drawerCount"></span></h2>
        <button class="icon-btn" id="cartClose" aria-label="Close bag">✕</button>
      </div>
      <div class="cart-items" id="drawerItems"></div>
      <div class="cart-foot" id="drawerFoot"></div>
    </aside>`;
  document.body.appendChild(wrap);
  $('#cartClose').addEventListener('click', closeCart);
  $('#cartScrim').addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
}
function openCart() {
  ensureCartDrawer();
  renderDrawer();
  $('#cartDrawer').classList.add('open');
  $('#cartScrim').classList.add('open');
  $('#cartDrawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  const d = $('#cartDrawer');
  if (!d || !d.classList.contains('open')) return;
  d.classList.remove('open');
  $('#cartScrim').classList.remove('open');
  d.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function renderDrawer() {
  const products = window.MANNAT_PRODUCTS || [];
  const lines = Cart.detailed(products);
  const box = $('#drawerItems'), foot = $('#drawerFoot');
  $('#drawerCount').textContent = lines.length ? `(${Cart.count()})` : '';
  if (!lines.length) {
    box.innerHTML = `<div class="cart-empty">
      <p style="font-size:2.4rem;margin-bottom:10px">🛍️</p>
      <p><b>Your bag is empty.</b></p><p>Beautiful things await you.</p></div>`;
    foot.innerHTML = `<button class="btn btn-block" id="drawerShop">Start Shopping</button>`;
    $('#drawerShop').addEventListener('click', () => { closeCart(); location.href = 'collections.html'; });
    return;
  }
  box.innerHTML = lines.map(d => `
    <div class="c-item">
      <img src="${d.product.images[0]}" alt="${esc(d.product.name)}" loading="lazy">
      <div class="c-item-info">
        <h4>${esc(d.product.name)}</h4>
        <p class="c-meta">Size: ${esc(d.size)}</p>
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
  foot.innerHTML = `
    <div class="cart-total-row"><span>Subtotal</span><span>${inr(Cart.subtotal(products))}</span></div>
    <p class="cart-note">Shipping &amp; taxes calculated over WhatsApp. COD available.</p>
    <button class="btn btn-whatsapp btn-block" id="drawerCheckout">Checkout on WhatsApp</button>
    <button class="btn btn-outline btn-block" id="drawerView">View Full Bag</button>`;
  $('#drawerCheckout').addEventListener('click', checkoutWhatsApp);
  $('#drawerView').addEventListener('click', () => { closeCart(); location.href = 'cart.html'; });
  $all('[data-act]', box).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i, act = b.dataset.act;
    if (act === 'inc') Cart.setQty(i, Cart.items[i].qty + 1);
    if (act === 'dec') Cart.setQty(i, Cart.items[i].qty - 1);
    if (act === 'rm') Cart.remove(i);
    renderDrawer();
    if (typeof renderCartPage === 'function') renderCartPage(); // keep cart.html in sync
  }));
}

/* ---------- WhatsApp checkout ---------- */
function waLink(text) {
  return 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
}
function checkoutWhatsApp() {
  const products = window.MANNAT_PRODUCTS || [];
  const lines = Cart.detailed(products);
  if (!lines.length) { toast('Your bag is empty.'); return; }
  let msg = 'Hello MANNAT! I would like to place an order:\n\n';
  lines.forEach((d, n) => {
    msg += `${n + 1}. ${d.product.name} (Size: ${d.size}) x ${d.qty} — ${inr(d.lineTotal)}\n`;
  });
  msg += `\nSubtotal: ${inr(Cart.subtotal(products))}\n\nName:\nDelivery Address:\nPincode:`;
  window.open(waLink(msg), '_blank');
}
function buyNowWhatsApp(id, size, qty) {
  const p = (window.MANNAT_PRODUCTS || []).find(p => p.id === id);
  if (!p) return;
  if (!size) { toast('Please select a size first.'); return; }
  const total = p.salePrice * qty;
  const msg = `Hello MANNAT! I want to buy this now:\n\n${p.name} (Size: ${size}) x ${qty} — ${inr(total)}\n\nName:\nDelivery Address:\nPincode:`;
  window.open(waLink(msg), '_blank');
}

/* ---------- shared text helpers (used by main.js too) ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function inr(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Cart.load();
  Wishlist.load();
  ensureCartDrawer();
  updateBadges();
  const cartBtn = $('#cartBtn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);
});
