(async function () {
  const container = document.getElementById('product-detail-container');
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    container.innerHTML = '<p class="loading-text">No product specified.</p>';
    return;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  try {
    const { product } = await apiFetch(`/products/${productId}`);
    renderProduct(product);
  } catch (e) {
    container.innerHTML = `<p class="loading-text">Couldn't load this product: ${e.message}</p>`;
  }

  function renderProduct(p) {
    const outOfStock = p.stock === 0;

    container.innerHTML = `
      <div class="product-detail">
        <div class="thumb"><img src="${p.image_url}" alt="${escapeHTML(p.name)}" /></div>
        <div class="info">
          <span class="category">${escapeHTML(p.category)}</span>
          <h1>${escapeHTML(p.name)}</h1>
          <div class="price">${formatPrice(p.price)}</div>
          <p class="description">${escapeHTML(p.description)}</p>

          <div id="alert-box" class="alert error"></div>

          ${outOfStock ? '<p class="stock-note" style="margin-bottom:20px;">Currently out of stock.</p>' : `
            <div class="qty-row">
              <div class="qty-control">
                <button type="button" id="qty-minus" aria-label="Decrease quantity">−</button>
                <input type="number" id="qty-input" value="1" min="1" max="${p.stock}" />
                <button type="button" id="qty-plus" aria-label="Increase quantity">+</button>
              </div>
              <span style="color:#8A8570; font-size:0.88rem;">${p.stock} in stock</span>
            </div>
          `}

          <button id="add-to-cart-btn" class="btn btn-primary btn-block" ${outOfStock ? 'disabled' : ''}>
            ${outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
          <p style="margin-top:16px;"><a href="/index.html" class="btn-text">&larr; Back to all products</a></p>
        </div>
      </div>
    `;

    if (outOfStock) return;

    const qtyInput = document.getElementById('qty-input');
    document.getElementById('qty-minus').addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value || '1', 10) - 1);
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      qtyInput.value = Math.min(p.stock, parseInt(qtyInput.value || '1', 10) + 1);
    });

    document.getElementById('add-to-cart-btn').addEventListener('click', async () => {
      const alertBox = document.getElementById('alert-box');
      alertBox.classList.remove('show');

      if (!isLoggedIn()) {
        window.location.href = `/login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      const quantity = Math.max(1, parseInt(qtyInput.value || '1', 10));
      const btn = document.getElementById('add-to-cart-btn');
      btn.disabled = true;
      btn.textContent = 'Adding…';

      try {
        await apiFetch('/cart', {
          method: 'POST',
          body: JSON.stringify({ productId: p.id, quantity })
        });
        await updateCartBadge();
        btn.textContent = 'Added ✓';
        setTimeout(() => {
          btn.textContent = 'Add to cart';
          btn.disabled = false;
        }, 1200);
      } catch (e) {
        alertBox.textContent = e.message;
        alertBox.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Add to cart';
      }
    });
  }
})();
