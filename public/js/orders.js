(async function () {
  const container = document.getElementById('orders-container');
  const params = new URLSearchParams(window.location.search);
  const justPlacedId = params.get('placed');

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  if (!isLoggedIn()) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Please log in to view your orders</h3>
        <p style="margin-top:20px;"><a href="/login.html?next=/orders.html" class="btn btn-primary">Log in</a></p>
      </div>`;
    return;
  }

  try {
    const { orders } = await apiFetch('/orders');

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No orders yet</h3>
          <p>Your placed orders will show up here.</p>
          <p style="margin-top:20px;"><a href="/index.html" class="btn btn-primary">Start shopping</a></p>
        </div>`;
      return;
    }

    const cards = await Promise.all(
      orders.map(async (order) => {
        const { items } = await apiFetch(`/orders/${order.id}`);
        const itemsHTML = items
          .map(
            (item) => `
            <div class="order-line">
              <span>${escapeHTML(item.product_name)} × ${item.quantity}</span>
              <span>${formatPrice(item.price * item.quantity)}</span>
            </div>`
          )
          .join('');

        const placedBanner =
          justPlacedId && Number(justPlacedId) === order.id
            ? `<div class="alert success show" style="margin-bottom:16px;">Thanks! Your order has been placed successfully.</div>`
            : '';

        const date = new Date(order.created_at + 'Z').toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        return `
          <div class="order-card">
            ${placedBanner}
            <div class="order-meta">
              <div><span class="label">Order</span><br /><span class="value">#${order.id}</span></div>
              <div><span class="label">Date</span><br /><span class="value">${date}</span></div>
              <div><span class="label">Status</span><br /><span class="status-badge">${escapeHTML(order.status)}</span></div>
              <div><span class="label">Total</span><br /><span class="value">${formatPrice(order.total)}</span></div>
            </div>
            <div><span class="label">Shipping to</span></div>
            <p style="margin: 6px 0 16px;">${escapeHTML(order.shipping_name)}, ${escapeHTML(order.shipping_address)}, ${escapeHTML(order.shipping_city)} ${escapeHTML(order.shipping_zip)}</p>
            ${itemsHTML}
          </div>
        `;
      })
    );

    container.innerHTML = cards.join('');
  } catch (e) {
    container.innerHTML = `<p class="loading-text">Couldn't load your orders: ${e.message}</p>`;
  }
})();
