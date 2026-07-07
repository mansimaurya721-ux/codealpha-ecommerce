(async function () {
  const container = document.getElementById('checkout-container');

  if (!isLoggedIn()) {
    window.location.href = '/login.html?next=/checkout.html';
    return;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  try {
    const cart = await apiFetch('/cart');
    if (cart.items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Your cart is empty</h3>
          <p>Add something to your cart before checking out.</p>
          <p style="margin-top:20px;"><a href="/index.html" class="btn btn-primary">Browse products</a></p>
        </div>`;
      return;
    }
    renderCheckout(cart);
  } catch (e) {
    container.innerHTML = `<p class="loading-text">Couldn't load checkout: ${e.message}</p>`;
  }

  function renderCheckout(cart) {
    const user = getUser();
    const itemsHTML = cart.items
      .map(
        (item) => `
        <div class="summary-row">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <span>${formatPrice(item.price * item.quantity)}</span>
        </div>`
      )
      .join('');

    container.innerHTML = `
      <div class="cart-layout" style="align-items:start;">
        <div>
          <h1 style="margin-bottom: 24px;">Shipping details</h1>
          <div id="alert-box" class="alert error"></div>
          <form id="checkout-form">
            <div class="field">
              <label for="shippingName">Full name</label>
              <input type="text" id="shippingName" required value="${user ? escapeHTML(user.name) : ''}" />
            </div>
            <div class="field">
              <label for="shippingAddress">Street address</label>
              <input type="text" id="shippingAddress" required placeholder="123 Main St" />
            </div>
            <div class="field-row">
              <div class="field">
                <label for="shippingCity">City</label>
                <input type="text" id="shippingCity" required />
              </div>
              <div class="field">
                <label for="shippingZip">ZIP / Postal code</label>
                <input type="text" id="shippingZip" required />
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="place-order-btn">Place order</button>
          </form>
        </div>
        <div class="summary-box">
          <h3 style="margin-bottom:16px;">Order summary</h3>
          ${itemsHTML}
          <div class="summary-row total"><span>Total</span><span>${formatPrice(cart.subtotal)}</span></div>
        </div>
      </div>
    `;

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('alert-box');
      alertBox.classList.remove('show');

      const btn = document.getElementById('place-order-btn');
      btn.disabled = true;
      btn.textContent = 'Placing order…';

      try {
        const { order } = await apiFetch('/orders', {
          method: 'POST',
          body: JSON.stringify({
            shippingName: document.getElementById('shippingName').value.trim(),
            shippingAddress: document.getElementById('shippingAddress').value.trim(),
            shippingCity: document.getElementById('shippingCity').value.trim(),
            shippingZip: document.getElementById('shippingZip').value.trim()
          })
        });
        await updateCartBadge();
        window.location.href = `/orders.html?placed=${order.id}`;
      } catch (e) {
        alertBox.textContent = e.message;
        alertBox.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Place order';
      }
    });
  }
})();
