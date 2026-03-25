/**
 * TSHIRTOUA — Cart API (cart-api.js)
 * Shopify AJAX Cart API wrapper
 * كل الـ REST API calls للـ cart
 */

const TshirtouaCartAPI = (() => {

  const ENDPOINTS = {
    cart:         '/cart.js',
    add:          '/cart/add.js',
    update:       '/cart/update.js',
    change:       '/cart/change.js',
    clear:        '/cart/clear.js',
    shippingRates: '/cart/shipping_rates.json',
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  };

  /* ── Helper fetch ── */
  async function apiFetch(url, options = {}) {
    try {
      const res = await fetch(url, { headers, ...options });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.description || err.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      TshirtouaNotify.error('خطأ', e.message || 'حدث خطأ ما، حاول مرة أخرى');
      throw e;
    }
  }

  /* ── Get cart ── */
  async function getCart() {
    return apiFetch(ENDPOINTS.cart);
  }

  /* ── Add to cart ── */
  async function addItem(variantId, qty = 1, properties = {}) {
    return apiFetch(ENDPOINTS.add, {
      method: 'POST',
      body: JSON.stringify({ id: variantId, quantity: qty, properties }),
    });
  }

  /* ── Update qty by line index (1-based) ── */
  async function updateLine(line, qty) {
    return apiFetch(ENDPOINTS.change, {
      method: 'POST',
      body: JSON.stringify({ line, quantity: qty }),
    });
  }

  /* ── Remove item ── */
  async function removeItem(line) {
    return updateLine(line, 0);
  }

  /* ── Clear cart ── */
  async function clearCart() {
    return apiFetch(ENDPOINTS.clear, { method: 'POST' });
  }

  /* ── Get item count ── */
  async function getCount() {
    const cart = await getCart();
    return cart.item_count || 0;
  }

  return { getCart, addItem, updateLine, removeItem, clearCart, getCount };
})();


/**
 * TSHIRTOUA — Customer API (customer-api.js)
 * Shopify Storefront + Account actions
 */

const TshirtouaCustomerAPI = (() => {

  /* ── Login ── */
  async function login(email, password) {
    const form = new FormData();
    form.append('customer[email]', email);
    form.append('customer[password]', password);
    form.append('form_type', 'customer_login');
    form.append('utf8', '✓');

    const res = await fetch('/account/login', {
      method: 'POST',
      body: form,
      redirect: 'follow',
      headers: { 'Accept': 'application/json' },
    });

    // Shopify redirects on success, returns 200 with errors on fail
    if (res.redirected) {
      return { success: true, url: res.url };
    }
    return { success: false, message: 'بيانات الدخول غلط' };
  }

  /* ── Register ── */
  async function register(firstName, lastName, email, password) {
    const form = new FormData();
    form.append('customer[first_name]', firstName);
    form.append('customer[last_name]',  lastName);
    form.append('customer[email]',      email);
    form.append('customer[password]',   password);
    form.append('form_type', 'create_customer');
    form.append('utf8', '✓');

    const res = await fetch('/account', {
      method: 'POST',
      body: form,
      redirect: 'follow',
      headers: { 'Accept': 'application/json' },
    });

    if (res.redirected) {
      return { success: true };
    }
    return { success: false, message: 'البريد مسجل من قبل أو البيانات غلط' };
  }

  /* ── Logout ── */
  async function logout() {
    await fetch('/account/logout', { method: 'POST' });
    window.location.href = '/';
  }

  /* ── Recover password ── */
  async function recoverPassword(email) {
    const form = new FormData();
    form.append('customer[email]', email);
    form.append('form_type', 'recover_customer_password');
    form.append('utf8', '✓');

    await fetch('/account/login', { method: 'POST', body: form });
    return { success: true };
  }

  return { login, register, logout, recoverPassword };
})();
