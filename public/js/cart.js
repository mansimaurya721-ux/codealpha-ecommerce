(async function () {
  const container = document.getElementById('cart-container');

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  if (!isLoggedIn()) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Please log in to view your cart</h3>
        <p>Your cart is tied to your account so it's here whenever you come back.</p>
        <p style="margin-top:20px;"><a href="/login.html?next=/cart.html" class="btn btn-primary">Log in</a></p>
      </div>`;
    return;
  }

  await loadCart();

  async function loadCart() {
    container.innerHTML = '<p class="loading-text">Loading cart…</p>';
    try {
      const cart = await apiFetch('/cart');
      renderCart(cart);
    } catch (e) {
      container.innerHTML = `<p class="loading-text">Couldn't load your cart: ${e.message}</p>`;
    }
  }

  function renderCart(cart) {
    if (cart.items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet.</p>
          <p style="margin-top:20px;"><a href="/index.html" class="btn btn-primary">Browse products</a></p>
        </div>`;
      return;
    }

    const itemsHTML = cart.items
      .map(
        (item) => `
      <div class="cart-item" data-item-id="${item.cart_item_id}">
        <img src="${item.image_url}" alt="${escapeHTML(item.name)}" />
        <div>
          <h4><a href="/product.html?id=${item.product_id}">${escapeHTML(item.name)}</a></h4>
          <div class="unit-price">${formatPrice(item.price)} each</div>
          <div class="qty-control" style="margin-top:8px; width: fit-content;">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">−</button>
            <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${item.stock}" style="width:44px;" />
            <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="remove-link" style="margin-top:8px;">Remove</button>
        </div>
        <div></div>
        <div class="line-total">${formatPrice(item.price * item.quantity)}</div>
      </div>
    `
      )
      .join('');

    container.innerHTML = `
      <div class="cart-layout">
        <div class="cart-items">${itemsHTML}</div>
        <div class="summary-box">
          <h3 style="margin-bottom:16px;">Order summary</h3>
          <div class="summary-row"><span>Subtotal</span><span>${formatPrice(cart.subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>Free</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatPrice(cart.subtotal)}</span></div>
          <a href="/checkout.html" class="btn btn-primary btn-block" style="margin-top:16px;">Proceed to checkout</a>
        </div>
      </div>
    `;

    wireItemControls();
  }

  function wireItemControls() {
    container.querySelectorAll('.cart-item').forEach((el) => {
      const itemId = el.dataset.itemId;
      const input = el.querySelector('.qty-input');

      el.querySelector('.qty-minus').addEventListener('click', () => {
        input.value = Math.max(1, parseInt(input.value || '1', 10) - 1);
        updateQuantity(itemId, input.value);
      });
      el.querySelector('.qty-plus').addEventListener('click', () => {
        input.value = Math.min(parseInt(input.max, 10), parseInt(input.value || '1', 10) + 1);
        updateQuantity(itemId, input.value);
      });
      input.addEventListener('change', () => updateQuantity(itemId, input.value));

      el.querySelector('.remove-link').addEventListener('click', () => removeItem(itemId));
    });
  }

  async function updateQuantity(itemId, quantity) {
    try {
      const cart = await apiFetch(`/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: parseInt(quantity, 10) })
      });
      renderCart(cart);
      await updateCartBadge();
    } catch (e) {
      alert(e.message);
      await loadCart();
    }
  }

  async function removeItem(itemId) {
    try {
      const cart = await apiFetch(`/cart/${itemId}`, { method: 'DELETE' });
      renderCart(cart);
      await updateCartBadge();
    } catch (e) {
      alert(e.message);
    }
  }
})();
