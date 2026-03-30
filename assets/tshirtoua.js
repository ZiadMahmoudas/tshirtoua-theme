/**
 * TSHIRTOUA — Main JS
 * Cart Drawer | Toast Notifications | Product interactions
 */

/* ============================================================
   DARK MODE
   ============================================================ */
function initDarkMode() {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  const icon = document.getElementById('dark-mode-icon');
  if (!toggleBtn) return;

  // Apply saved theme on init
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (icon) { icon.className = 'fa-solid fa-sun'; }
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (icon) { icon.className = 'fa-solid fa-moon'; }
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      if (icon) icon.className = 'fa-solid fa-moon';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      if (icon) icon.className = 'fa-solid fa-sun';
    }
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

  function create(type, title, message, duration = 4000) {
    if (!container) init();

    const icons = {
      success: '<i class="fa-solid fa-circle-check" style="color:var(--success);font-size:1.1rem;"></i>',
      error:   '<i class="fa-solid fa-circle-xmark" style="color:var(--danger);font-size:1.1rem;"></i>',
      info:    '<i class="fa-solid fa-circle-info" style="color:var(--text-muted);font-size:1.1rem;"></i>',
      cart:    '<i class="fa-solid fa-bag-shopping" style="color:var(--accent);font-size:1.1rem;"></i>',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="margin-top:2px;">${icons[type] || icons.info}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <div class="toast-close" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  return {
    success: (title, msg) => create('success', title, msg),
    error:   (title, msg) => create('error',   title, msg),
    info:    (title, msg) => create('info',    title, msg),
    cart:    (title, msg) => create('cart',    title, msg),
  };
})();

/* ============================================================
   WISHLIST SYSTEM (LocalStorage)
   ============================================================ */
const TshirtouaWishlist = (() => {
  let items = [];
  try { items = JSON.parse(localStorage.getItem('tshirtoua_wishlist')) || []; } catch(e) { items = []; }

  function init() {
    updateButtons();
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.productId;
        if (productId) toggle(productId, btn);
      });
    });
  }

  function toggle(id, btn) {
    const index = items.indexOf(id);
    if (index > -1) {
      items.splice(index, 1);
      btn.classList.remove('active');
      TshirtouaNotify.info('اتشال من المفضلة', '');
    } else {
      items.push(id);
      btn.classList.add('active');
      TshirtouaNotify.success('اتضاف للمفضلة ❤️', '');
    }
    try { localStorage.setItem('tshirtoua_wishlist', JSON.stringify(items)); } catch(e) {}
  }

  function updateButtons() {
    document.querySelectorAll('.wishlist-btn[data-product-id]').forEach(btn => {
      if (items.includes(btn.dataset.productId)) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  return { init };
})();


/* ============================================================
   CART DRAWER
   ============================================================ */
const TshirtouaCart = (() => {
  let overlay, drawer, itemsEl, subtotalEl, countEl, emptyEl;

  function init() {
    overlay    = document.getElementById('cart-overlay');
    drawer     = document.getElementById('cart-drawer');
    itemsEl    = document.getElementById('cart-items');
    subtotalEl = document.getElementById('cart-subtotal');
    countEl    = document.getElementById('cart-count');
    emptyEl    = document.getElementById('cart-empty');

    if (!overlay || !drawer) return;

    overlay.addEventListener('click', close);
    document.getElementById('cart-close')?.addEventListener('click', close);

    document.querySelectorAll('[data-open-cart]').forEach(el => {
      el.addEventListener('click', open);
    });

    refreshCount();
  }

  async function open() {
    await refresh();
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay?.classList.remove('open');
    drawer?.classList.remove('open');
    document.body.style.overflow = '';
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
    return (cents / 100).toFixed(2) + ' ج.م';
  }

  function render(cart) {
    if (!itemsEl) return;
    updateCount(cart.item_count || 0);

    if (!cart.items || cart.items.length === 0) {
      itemsEl.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      subtotalEl?.closest('.cart-drawer__footer')?.classList.add('hidden');
      return;
    }

    emptyEl?.classList.add('hidden');
    const footer = subtotalEl?.closest('.cart-drawer__footer');
    if (footer) footer.classList.remove('hidden');
    if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);

    itemsEl.innerHTML = cart.items.map((item, i) => `
      <div class="cart-item" data-line="${i + 1}" data-key="${item.key}">
        <div class="cart-item__img">
          <img src="${item.image || ''}" alt="${item.product_title}" loading="lazy">
        </div>
        <div class="cart-item__info">
          <div class="cart-item__name">${item.product_title}</div>
          <div class="cart-item__variant">${item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : ''}</div>
          <div class="cart-item__footer">
            <div class="cart-item__price">${item.price === 0 ? 'مجاني' : formatMoney(item.price)}</div>
            <div class="cart-item__qty-controls" style="display:flex;align-items:center;gap:6px;">
              <button onclick="TshirtouaCart.changeLine(${i+1}, ${item.quantity - 1})" class="btn btn-ghost btn-sm btn-icon" style="padding:4px;width:28px;height:28px;font-size:1rem;" aria-label="Decrease">−</button>
              <span style="font-size:.85rem;font-weight:700;min-width:18px;text-align:center;">${item.quantity}</span>
              <button onclick="TshirtouaCart.changeLine(${i+1}, ${item.quantity + 1})" class="btn btn-ghost btn-sm btn-icon" style="padding:4px;width:28px;height:28px;font-size:1rem;" aria-label="Increase">+</button>
            </div>
          </div>
          <div class="cart-item__remove" onclick="TshirtouaCart.removeLine(${i+1})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            إزالة
          </div>
        </div>
      </div>
    `).join('');
  }

  async function addToCart(variantId, qty = 1, productTitle = '') {
    try {
      const btn = document.querySelector(`[data-add-to-cart][data-variant-id="${variantId}"]`);
      if (btn) btn.classList.add('btn-loading');

      await TshirtouaCartAPI.addItem(variantId, qty);
      await refresh();
      TshirtouaNotify.cart('أضفنا للعربة! 🛒', productTitle || 'المنتج اتضاف بنجاح');
      open();
    } catch(e) {
      TshirtouaNotify.error('مش قادر يضيف', 'فيه مشكلة، حاول تاني');
    } finally {
      const btn = document.querySelector(`[data-add-to-cart][data-variant-id="${variantId}"]`);
      if (btn) btn.classList.remove('btn-loading');
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
    } catch(e) {}
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
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  if (toggle && mobileNav) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileNav.style.display === 'block';
      mobileNav.style.display = isOpen ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !toggle.contains(e.target)) {
        mobileNav.style.display = 'none';
      }
    });
  }
}


/* ============================================================
   PRODUCT PAGE — gallery, size, add to cart
   ============================================================ */
function initProductPage() {
  // Gallery thumbs
  document.querySelectorAll('.product-gallery__thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src;
      const main = document.getElementById('product-main-img');
      if (main && src) main.src = src;
      document.querySelectorAll('.product-gallery__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Size selection
  document.querySelectorAll('.size-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (opt.classList.contains('unavailable')) return;
      document.querySelectorAll('.size-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const variantId = opt.dataset.variantId;
      if (variantId) {
        const addBtn = document.getElementById('add-to-cart-btn');
        if (addBtn) addBtn.dataset.variantId = variantId;
      }
    });
  });

  // Color selection
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });

  // Qty buttons
  const qtyInput = document.getElementById('product-qty');
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.min(99, parseInt(qtyInput.value || 1) + 1);
  });
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.max(1, parseInt(qtyInput.value || 1) - 1);
  });

  // Add to cart
  const addBtn = document.getElementById('add-to-cart-btn');
  addBtn?.addEventListener('click', async () => {
    const variantId = addBtn.dataset.variantId;
    const qty = parseInt(document.getElementById('product-qty')?.value || 1);
    const title = document.querySelector('.product-title')?.textContent || '';

    if (!variantId) {
      TshirtouaNotify.error('اختار مقاس', 'لازم تختار المقاس الأول');
      return;
    }
    await TshirtouaCart.addToCart(variantId, qty, title);
  });

  // Wishlist btn on product page
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    if (!btn.dataset.productId) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.classList.toggle('active');
        const added = btn.classList.contains('active');
        TshirtouaNotify[added ? 'success' : 'info'](
          added ? 'اتضاف للمفضلة ❤️' : 'اتشال من المفضلة', ''
        );
      });
    }
  });
}


/* ============================================================
   COLLECTION FILTERS
   ============================================================ */
function initCollectionFilters() {
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const filterValue = this.getAttribute('data-filter');
      document.querySelectorAll('.product-card').forEach(product => {
        if (filterValue === 'all') {
          product.style.display = '';
        } else {
          const category = product.getAttribute('data-category');
          product.style.display = (category === filterValue) ? '' : 'none';
        }
      });
    });
  });

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });
}


/* ============================================================
   AUTH FORMS
   ============================================================ */
function initAuthForms() {
  // Password toggle
  document.querySelectorAll('.input-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.previousElementSibling || toggle.parentElement.querySelector('input');
      if (!input) return;
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      toggle.innerHTML = isPass
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/></svg>`;
    });
  });

  // Login form
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('[type=submit]');
    const email    = loginForm.querySelector('[name=email]').value;
    const password = loginForm.querySelector('[name=password]').value;
    if (!email || !password) {
      TshirtouaNotify.error('بيانات ناقصة', 'ادخل الإيميل وكلمة السر');
      return;
    }
    btn.classList.add('btn-loading');
    try {
      const result = await TshirtouaCustomerAPI.login(email, password);
      if (result.success) {
        TshirtouaNotify.success('أهلاً بيك! 👋', 'دخلت بنجاح');
        setTimeout(() => window.location.href = result.url || '/account', 1000);
      } else {
        TshirtouaNotify.error('خطأ في الدخول', result.message);
      }
    } finally {
      btn.classList.remove('btn-loading');
    }
  });

  // Register form
  const regForm = document.getElementById('register-form');
  regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn      = regForm.querySelector('[type=submit]');
    const password = regForm.querySelector('[name=password]').value;
    const confirm  = regForm.querySelector('[name=password_confirm]').value;
    if (password !== confirm) {
      TshirtouaNotify.error('كلمة السر مش مطابقة', 'تأكد إن كلمتي السر متطابقتين');
      return;
    }
    if (password.length < 5) {
      TshirtouaNotify.error('كلمة السر ضعيفة', 'لازم تكون 5 حروف على الأقل');
      return;
    }
    btn.classList.add('btn-loading');
    try {
      const firstName = regForm.querySelector('[name=first_name]').value;
      const lastName  = regForm.querySelector('[name=last_name]').value;
      const email     = regForm.querySelector('[name=email]').value;
      const result = await TshirtouaCustomerAPI.register(firstName, lastName, email, password);
      if (result.success) {
        TshirtouaNotify.success('تم التسجيل! 🎉', 'اتفضل سجل دخولك دلوقتي');
        setTimeout(() => window.location.href = '/account/login', 1500);
      } else {
        TshirtouaNotify.error('مش قادر يسجل', result.message);
      }
    } finally {
      btn.classList.remove('btn-loading');
    }
  });
}


/* ============================================================
   QUICK ADD
   ============================================================ */
function initQuickAdd() {
  document.querySelectorAll('[data-quick-add]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const variantId = btn.dataset.variantId;
      const title     = btn.dataset.title || '';
      if (variantId) await TshirtouaCart.addToCart(variantId, 1, title);
    });
  });
}


/* ============================================================
   ANNOUNCEMENT BAR MARQUEE
   ============================================================ */
function initMarquee() {
  const container = document.querySelector('.announcement-bar');
  const inner = document.querySelector('.announcement-bar__inner');
  if (!container || !inner) return;
  // Clone for seamless loop
  const clone = inner.cloneNode(true);
  container.appendChild(clone);
}


/* ============================================================
   LENIS SMOOTH SCROLL
   ============================================================ */
let lenis;
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smoothWheel: true,
    lerp: 0.1,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    normalizeWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}


/* ============================================================
   SINGLE PAGE APP (SPA) navigation
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
  const isAnchorOnly   = link.href.startsWith('#');
  const isLocalization = url.pathname === '/localization'; // let forms handle it

  if (!isInternal || isModified || hasTarget || isDownload || isAnchorOnly || isLocalization) return;

  e.preventDefault();
  try {
    document.body.classList.add('is-loading');
    const res = await fetch(url.pathname + url.search, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Use #main-content as SPA content target
    const newContent  = doc.querySelector('#main-content');
    const currContent = document.querySelector('#main-content');

    if (!newContent || !currContent) {
      window.location.href = url.href;
      return;
    }

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
  } catch(err) {
    window.location.reload();
  }
});

/* Re-init scripts after SPA navigation */
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
  });

  document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', () => {
      const code    = option.dataset.code;
      const inputId = option.dataset.input;
      const formId  = option.dataset.form;

      const input = document.getElementById(inputId);
      const form  = document.getElementById(formId);

      if (input && form) {
        input.value = code;
        form.submit(); // ← Shopify بيعمل redirect تلقائي
      }
    });
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
    btn.classList.remove('open');
  });
}
function closeAllLangDropdowns() {
  document.querySelectorAll('.lang-dropdown.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.lang-btn.open').forEach(b => b.classList.remove('open'));
}
/* ============================================================
   INIT ALL on DOM Ready
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