/**
 * TSHIRTOUA — Main JS (improved)
 * Cart Drawer | Toast | Wishlist | Product | Collection | SPA | Language
 */

/* ============================================================
   DARK MODE
   ============================================================ */
function initDarkMode() {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  const icon = document.getElementById('dark-mode-icon');
  if (!toggleBtn) return;

  function applyTheme(dark) {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (icon) icon.className = 'fa-solid fa-sun';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (icon) icon.className = 'fa-solid fa-moon';
      localStorage.setItem('theme', 'light');
    }
  }

  // Sync icon with current state on init
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';

  toggleBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
  });
}

/* ============================================================
   NOTIFICATIONS (Toast System)
   ============================================================ */
const TshirtouaNotify = (() => {
  let container;

  function init() {
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  const icons = {
    success: '<i class="fa-solid fa-circle-check" style="color:var(--success);font-size:1.1rem;flex-shrink:0;"></i>',
    error:   '<i class="fa-solid fa-circle-xmark" style="color:var(--danger);font-size:1.1rem;flex-shrink:0;"></i>',
    info:    '<i class="fa-solid fa-circle-info" style="color:var(--text-muted);font-size:1.1rem;flex-shrink:0;"></i>',
    cart:    '<i class="fa-solid fa-bag-shopping" style="color:var(--accent-dark);font-size:1.1rem;flex-shrink:0;"></i>',
  };

  function create(type, title, message, duration = 4200) {
    if (!container) init();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="margin-top:2px;">${icons[type] || icons.info}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <div class="toast-close" role="button" aria-label="إغلاق" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </div>
    `;
    container.appendChild(toast);
    // Auto-remove with same duration as progress bar
    const timer = setTimeout(() => {
      toast.style.animation = 'toastIn 0.22s reverse forwards';
      setTimeout(() => toast.remove(), 220);
    }, duration);
    toast.querySelector('.toast-close').addEventListener('click', () => clearTimeout(timer));
  }

  return {
    success: (title, msg) => create('success', title, msg),
    error:   (title, msg) => create('error',   title, msg),
    info:    (title, msg) => create('info',    title, msg),
    cart:    (title, msg) => create('cart',    title, msg),
  };
})();

/* ============================================================
   WISHLIST (LocalStorage)
   ============================================================ */
const TshirtouaWishlist = (() => {
  let items = [];

  function load() {
    try { items = JSON.parse(localStorage.getItem('tshirtoua_wishlist') || '[]'); }
    catch(e) { items = []; }
  }

  function save() {
    try { localStorage.setItem('tshirtoua_wishlist', JSON.stringify(items)); }
    catch(e) {}
  }

  function updateButtons() {
    document.querySelectorAll('.wishlist-btn[data-product-id]').forEach(btn => {
      const active = items.includes(btn.dataset.productId);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
    });
  }

  function toggle(id, btn) {
    const idx = items.indexOf(id);
    if (idx > -1) {
      items.splice(idx, 1);
      TshirtouaNotify.info('اتشال من المفضلة', '');
    } else {
      items.push(id);
      TshirtouaNotify.success('اتضاف للمفضلة ❤️', '');
    }
    save();
    updateButtons();
  }

  function init() {
    load();
    updateButtons();
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      // Clone to remove old listeners after SPA nav
      const fresh = btn.cloneNode(true);
      btn.parentNode.replaceChild(fresh, btn);
      fresh.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = fresh.dataset.productId;
        if (productId) toggle(productId, fresh);
        else {
          // Product page wishlist (no data-product-id)
          fresh.classList.toggle('active');
          const added = fresh.classList.contains('active');
          TshirtouaNotify[added ? 'success' : 'info'](added ? 'اتضاف للمفضلة ❤️' : 'اتشال من المفضلة', '');
        }
      });
    });
  }

  return { init };
})();

/* ============================================================
   CART DRAWER
   ============================================================ */
const TshirtouaCart = (() => {
  let overlay, drawer, itemsEl, subtotalEl, countEl, emptyEl, footerEl;
  let isOpen = false;

  function init() {
    overlay    = document.getElementById('cart-overlay');
    drawer     = document.getElementById('cart-drawer');
    itemsEl    = document.getElementById('cart-items');
    subtotalEl = document.getElementById('cart-subtotal');
    countEl    = document.getElementById('cart-count');
    emptyEl    = document.getElementById('cart-empty');
    footerEl   = document.getElementById('cart-footer');

    if (!drawer) return;

    overlay?.addEventListener('click', close);
    document.getElementById('cart-close')?.addEventListener('click', close);

    // Keyboard close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    document.querySelectorAll('[data-open-cart]').forEach(el => {
      el.addEventListener('click', open);
    });

    refreshCount();
  }

  async function open() {
    const loadingEl = drawer?.querySelector('.cart-loading-state');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    isOpen = true;
    // Focus trap
    setTimeout(() => document.getElementById('cart-close')?.focus(), 340);
    await refresh();
  }

  function close() {
    overlay?.classList.remove('open');
    drawer?.classList.remove('open');
    document.body.style.overflow = '';
    isOpen = false;
  }

  async function refresh() {
    try {
      const cart = await TshirtouaCartAPI.getCart();
      render(cart);
    } catch(e) { console.warn('Cart refresh failed', e); }
  }

  async function refreshCount() {
    try {
      const cart = await TshirtouaCartAPI.getCart();
      updateCount(cart.item_count || 0);
    } catch(e) {}
  }

  function updateCount(n) {
    if (!countEl) return;
    countEl.textContent = n;
    countEl.classList.toggle('visible', n > 0);
  }

  function formatMoney(cents) {
    if (cents === 0) return 'مجاني';
    return (cents / 100).toFixed(2) + ' ج.م';
  }

  function buildQtyControls(line, qty) {
    return `
      <div class="cart-item__qty-controls">
        <button class="cart-item__qty-btn" onclick="TshirtouaCart.changeLine(${line}, ${qty-1})" aria-label="تقليل">−</button>
        <span class="cart-item__qty">${qty}</span>
        <button class="cart-item__qty-btn" onclick="TshirtouaCart.changeLine(${line}, ${qty+1})" aria-label="زيادة">+</button>
      </div>
    `;
  }

  function render(cart) {
    if (!itemsEl) return;
    updateCount(cart.item_count || 0);

    if (!cart.items || cart.items.length === 0) {
      itemsEl.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      footerEl?.classList.add('hidden');
      return;
    }

    emptyEl?.classList.add('hidden');
    footerEl?.classList.remove('hidden');
    if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);

    itemsEl.innerHTML = cart.items.map((item, i) => {
      const lineIdx = i + 1;
      const imgSrc = item.image || '';
      const variantTitle = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
      return `
        <div class="cart-item" data-line="${lineIdx}">
          <div class="cart-item__img">
            ${imgSrc ? `<img src="${imgSrc}" alt="${item.product_title}" loading="lazy">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.8rem;">👕</div>'}
          </div>
          <div class="cart-item__info">
            <div class="cart-item__name" title="${item.product_title}">${item.product_title}</div>
            ${variantTitle ? `<div class="cart-item__variant">${variantTitle}</div>` : ''}
            <div class="cart-item__footer">
              <div class="cart-item__price">${formatMoney(item.line_price)}</div>
              ${buildQtyControls(lineIdx, item.quantity)}
            </div>
            <div class="cart-item__remove" role="button" onclick="TshirtouaCart.removeLine(${lineIdx})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              إزالة
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function addToCart(variantId, qty = 1, productTitle = '') {
    const btns = document.querySelectorAll(`[data-add-to-cart][data-variant-id="${variantId}"],[data-quick-add][data-variant-id="${variantId}"]`);
    btns.forEach(b => b.classList.add('btn-loading'));
    try {
      await TshirtouaCartAPI.addItem(variantId, qty);
      await refresh();
      TshirtouaNotify.cart('أضفنا للعربة! 🛒', productTitle || 'المنتج اتضاف بنجاح');
      open();
    } catch(e) {
      TshirtouaNotify.error('مش قادر يضيف', 'الكمية المطلوبة مش متاحة');
    } finally {
      btns.forEach(b => b.classList.remove('btn-loading'));
    }
  }

  async function removeLine(line) {
    try {
      await TshirtouaCartAPI.removeItem(line);
      await refresh();
      TshirtouaNotify.info('اتشال', 'المنتج اتشال من العربة');
    } catch(e) {}
  }

  async function changeLine(line, qty) {
    if (qty < 0) return;
    try {
      await TshirtouaCartAPI.updateLine(line, qty);
      await refresh();
    } catch(e) { TshirtouaNotify.error('خطأ', 'مش قادر يحدّث الكمية'); }
  }

  window.TshirtouaCart = { init, open, close, addToCart, removeLine, changeLine, refresh };
  return window.TshirtouaCart;
})();

/* ============================================================
   HEADER — scroll + mobile menu
   ============================================================ */
function initHeader() {
  const header = document.querySelector('.site-header');
  const toggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Apply immediately
  }

  if (toggle && mobileNav) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileNav.style.display === 'block';
      mobileNav.style.display = isOpen ? 'none' : 'block';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      // Toggle icon
      const icon = toggle.querySelector('i');
      if (icon) icon.className = isOpen ? 'fa-solid fa-bars' : 'fa-solid fa-xmark';
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !toggle.contains(e.target)) {
        mobileNav.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
        const icon = toggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      }
    });
  }
}

/* ============================================================
   PRODUCT PAGE — gallery, variants, add to cart
   ============================================================ */
function initProductPage() {
  if (!document.querySelector('.product-layout')) return;

  // Gallery thumbs
  document.querySelectorAll('.product-gallery__thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src;
      const main = document.getElementById('product-main-img');
      if (main && src) {
        main.style.opacity = '0.7';
        main.src = src;
        main.onload = () => { main.style.opacity = '1'; };
      }
      document.querySelectorAll('.product-gallery__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Size selection — also updates add-to-cart variant
  document.querySelectorAll('.size-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (opt.classList.contains('unavailable')) {
        TshirtouaNotify.info('المقاس غير متاح', 'اختار مقاس تاني');
        return;
      }
      document.querySelectorAll('.size-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const variantId = opt.dataset.variantId;
      if (variantId) {
        const addBtn = document.getElementById('add-to-cart-btn');
        if (addBtn) addBtn.dataset.variantId = variantId;
        // Update URL without page reload
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variantId);
        history.replaceState({}, '', url.toString());
      }
    });
  });

  // Color selection
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      // Update label
      const label = document.querySelector('.color-label-value');
      if (label) label.textContent = swatch.title;
    });
  });

  // Quantity selector
  const qtyInput = document.getElementById('product-qty');
  const plusBtn = document.getElementById('qty-plus');
  const minusBtn = document.getElementById('qty-minus');

  plusBtn?.addEventListener('click', () => {
    if (!qtyInput) return;
    const v = parseInt(qtyInput.value || 1);
    if (v < 99) { qtyInput.value = v + 1; }
  });
  minusBtn?.addEventListener('click', () => {
    if (!qtyInput) return;
    const v = parseInt(qtyInput.value || 1);
    if (v > 1) { qtyInput.value = v - 1; }
  });

  // Add to cart button
  const addBtn = document.getElementById('add-to-cart-btn');
  addBtn?.addEventListener('click', async () => {
    const variantId = addBtn.dataset.variantId;
    const qty = parseInt(document.getElementById('product-qty')?.value || 1);
    const title = document.querySelector('.product-title')?.textContent?.trim() || '';

    if (!variantId) {
      TshirtouaNotify.error('اختار المقاس', 'لازم تختار المقاس الأول');
      document.querySelector('.size-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    await TshirtouaCart.addToCart(parseInt(variantId), qty, title);
  });

  // Image gallery main transition
  const mainImg = document.getElementById('product-main-img');
  if (mainImg) { mainImg.style.transition = 'opacity 0.2s ease'; }
}

/* ============================================================
   COLLECTION FILTERS (client-side tag filter)
   ============================================================ */
function initCollectionFilters() {
  // Category tabs (used on homepage / custom sections)
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const filterValue = this.dataset.filter;
      document.querySelectorAll('.product-card').forEach(card => {
        if (filterValue === 'all') {
          card.style.display = '';
        } else {
          const season = card.dataset.season || card.dataset.category || '';
          card.style.display = (season === filterValue) ? '' : 'none';
        }
      });
    });
  });

  // Collection page filter chips (multi-select allowed)
  const chips = document.querySelectorAll('.filter-chip');
  const grid = document.getElementById('collection-grid');

  if (!grid || !chips.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filterVal = chip.dataset.filter;
      if (filterVal === 'all') {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        grid.querySelectorAll('.product-card').forEach(c => c.style.display = '');
        return;
      }
      // Toggle this chip
      chip.classList.toggle('active');
      // Remove 'all' chip active state
      chips.forEach(c => { if (c.dataset.filter === 'all') c.classList.remove('active'); });

      const active = [...chips].filter(c => c.classList.contains('active')).map(c => c.dataset.filter);
      if (!active.length) {
        chips.forEach(c => { if (c.dataset.filter === 'all') c.classList.add('active'); });
        grid.querySelectorAll('.product-card').forEach(c => c.style.display = '');
        return;
      }
      grid.querySelectorAll('.product-card').forEach(card => {
        const season = card.dataset.season || '';
        card.style.display = active.includes(season) ? '' : 'none';
      });
    });
  });
}

/* ============================================================
   AUTH FORMS
   ============================================================ */
function initAuthForms() {
  // Password toggle
  document.querySelectorAll('.input-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.closest('.input-group')?.querySelector('input');
      if (!input) return;
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      toggle.innerHTML = isPass
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  });

  // Login form
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('[type=submit]');
    const email = loginForm.querySelector('[name=email]')?.value?.trim();
    const password = loginForm.querySelector('[name=password]')?.value;
    if (!email || !password) { TshirtouaNotify.error('بيانات ناقصة', 'ادخل الإيميل وكلمة السر'); return; }
    btn.classList.add('btn-loading');
    try {
      const result = await TshirtouaCustomerAPI.login(email, password);
      if (result.success) {
        TshirtouaNotify.success('أهلاً بيك! 👋', 'دخلت بنجاح');
        setTimeout(() => window.location.href = result.url || '/account', 1000);
      } else {
        TshirtouaNotify.error('خطأ في الدخول', result.message);
      }
    } finally { btn.classList.remove('btn-loading'); }
  });

  // Register form
  const regForm = document.getElementById('register-form');
  regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = regForm.querySelector('[type=submit]');
    const password = regForm.querySelector('[name=password]')?.value;
    const confirm  = regForm.querySelector('[name=password_confirm]')?.value;
    if (password !== confirm) { TshirtouaNotify.error('كلمة السر مش مطابقة', 'تأكد إن كلمتي السر متطابقتين'); return; }
    if (password.length < 5) { TshirtouaNotify.error('كلمة السر ضعيفة', 'لازم تكون 5 حروف على الأقل'); return; }
    btn.classList.add('btn-loading');
    try {
      const firstName = regForm.querySelector('[name=first_name]')?.value;
      const lastName  = regForm.querySelector('[name=last_name]')?.value;
      const email     = regForm.querySelector('[name=email]')?.value;
      const result = await TshirtouaCustomerAPI.register(firstName, lastName, email, password);
      if (result.success) {
        TshirtouaNotify.success('تم التسجيل! 🎉', 'اتفضل سجل دخولك دلوقتي');
        setTimeout(() => window.location.href = '/account/login', 1500);
      } else {
        TshirtouaNotify.error('مش قادر يسجل', result.message);
      }
    } finally { btn.classList.remove('btn-loading'); }
  });
}

/* ============================================================
   QUICK ADD (on product cards)
   ============================================================ */
function initQuickAdd() {
  document.querySelectorAll('[data-quick-add]').forEach(btn => {
    // Remove old event listeners by cloning
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const variantId = fresh.dataset.variantId;
      const title     = fresh.dataset.title || '';
      if (variantId) await TshirtouaCart.addToCart(parseInt(variantId), 1, title);
    });
  });
}

/* ============================================================
   ANNOUNCEMENT BAR MARQUEE — seamless clone
   ============================================================ */
function initMarquee() {
  const container = document.querySelector('.announcement-bar');
  const inner = document.querySelector('.announcement-bar__inner');
  if (!container || !inner) return;
  // Only clone once
  if (!container.querySelector('.announcement-bar__inner:nth-child(2)')) {
    const clone = inner.cloneNode(true);
    container.appendChild(clone);
  }
}

/* ============================================================
   LENIS SMOOTH SCROLL
   ============================================================ */
let lenis;
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  if (lenis) { lenis.destroy(); }
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    lerp: 0.1,
    touchMultiplier: 2,
    normalizeWheel: true,
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

/* ============================================================
   LANGUAGE SWITCHER
   ============================================================ */
function initLangSwitcher() {
  const btn      = document.getElementById('lang-btn');
  const dropdown = document.getElementById('lang-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');
    dropdown.classList.toggle('open', !isOpen);
    btn.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
  });

  document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', () => {
      const code    = option.dataset.code;
      const inputId = option.dataset.input;
      const formId  = option.dataset.form;
      const input = document.getElementById(inputId);
      const form  = document.getElementById(formId);
      if (input && form) { input.value = code; form.submit(); }
    });
  });

  document.querySelectorAll('.mobile-lang-btn').forEach(mBtn => {
    mBtn.addEventListener('click', () => {
      const code    = mBtn.dataset.code;
      const inputId = mBtn.dataset.input;
      const formId  = mBtn.dataset.form;
      const input = document.getElementById(inputId);
      const form  = document.getElementById(formId);
      if (input && form) { input.value = code; form.submit(); }
    });
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
}

/* ============================================================
   SPA NAVIGATION
   ============================================================ */
document.addEventListener('click', async function(e) {
  const link = e.target.closest('a');
  if (!link) return;

  let url;
  try { url = new URL(link.href, window.location.origin); }
  catch(err) { return; }

  const isInternal     = url.origin === window.location.origin;
  const isModified     = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  const hasTarget      = link.target && link.target !== '_self';
  const isDownload     = link.hasAttribute('download');
  const isAnchorOnly   = link.href.includes('#') && url.pathname === window.location.pathname;
  const isCheckout     = url.pathname.startsWith('/checkout');
  const isLocalization = url.pathname === '/localization';
  const isAccount      = url.pathname.startsWith('/account'); // let Shopify handle auth

  if (!isInternal || isModified || hasTarget || isDownload || isAnchorOnly || isCheckout || isLocalization || isAccount) return;

  e.preventDefault();
  try {
    document.body.classList.add('is-loading');
    const res = await fetch(url.pathname + url.search, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    if (!res.ok) { window.location.href = url.href; return; }
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent  = doc.querySelector('#main-content');
    const currContent = document.querySelector('#main-content');
    if (!newContent || !currContent) { window.location.href = url.href; return; }
    currContent.innerHTML = newContent.innerHTML;
    document.title = doc.title;
    history.pushState({}, '', url.href);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    reInitThemeScripts();
  } catch(err) {
    window.location.href = url.href;
  } finally {
    document.body.classList.remove('is-loading');
  }
});

window.addEventListener('popstate', async function() {
  try {
    const res = await fetch(window.location.pathname + window.location.search);
    if (!res.ok) { window.location.reload(); return; }
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent  = doc.querySelector('#main-content');
    const currContent = document.querySelector('#main-content');
    if (newContent && currContent) {
      currContent.innerHTML = newContent.innerHTML;
      document.title = doc.title;
      reInitThemeScripts();
    }
  } catch(err) { window.location.reload(); }
});

function reInitThemeScripts() {
  TshirtouaCart.init();
  TshirtouaWishlist.init();
  initHeader();
  initProductPage();
  initCollectionFilters();
  initAuthForms();
  initQuickAdd();
  initMarquee();
  initDarkMode();
  initLangSwitcher();
}

/* ============================================================
   INIT on DOM Ready
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  TshirtouaCart.init();
  TshirtouaWishlist.init();
  initHeader();
  initProductPage();
  initCollectionFilters();
  initAuthForms();
  initQuickAdd();
  initMarquee();
  initLenis();
  initLangSwitcher();
});
