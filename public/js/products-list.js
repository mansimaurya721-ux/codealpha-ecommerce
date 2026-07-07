(async function () {
  const grid = document.getElementById('product-grid');
  const filtersBar = document.getElementById('filters-bar');

  const params = new URLSearchParams(window.location.search);
  const search = params.get('search') || '';
  let activeCategory = params.get('category') || '';

  function productCardHTML(p) {
    const lowStock = p.stock === 0 ? '<div class="stock-note">Out of stock</div>' : '';
    return `
      <a class="product-card" href="/product.html?id=${p.id}">
        <div class="thumb"><img src="${p.image_url}" alt="${escapeHTML(p.name)}" loading="lazy" /></div>
        <div class="body">
          <span class="category">${escapeHTML(p.category)}</span>
          <h3>${escapeHTML(p.name)}</h3>
          <div class="price">${formatPrice(p.price)}</div>
          ${lowStock}
        </div>
      </a>
    `;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function loadCategories() {
    try {
      const { categories } = await apiFetch('/products/categories');
      categories.forEach((cat) => {
        const chip = document.createElement('button');
        chip.className = 'chip' + (activeCategory === cat ? ' active' : '');
        chip.textContent = cat;
        chip.dataset.category = cat;
        chip.addEventListener('click', () => {
          activeCategory = cat;
          syncChipState();
          loadProducts();
        });
        filtersBar.appendChild(chip);
      });
      syncChipState();
    } catch (e) {
      // categories are non-critical; fail silently
    }
  }

  function syncChipState() {
    filtersBar.querySelectorAll('.chip').forEach((chip) => {
      const chipCat = chip.dataset.category || '';
      chip.classList.toggle('active', chipCat === activeCategory);
    });
  }

  async function loadProducts() {
    grid.innerHTML = '<p class="loading-text">Loading products…</p>';
    try {
      const qs = new URLSearchParams();
      if (activeCategory) qs.set('category', activeCategory);
      if (search) qs.set('search', search);
      const { products } = await apiFetch(`/products?${qs.toString()}`);

      if (products.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <h3>No products found</h3>
            <p>Try a different search term or category.</p>
          </div>`;
        return;
      }

      grid.innerHTML = products.map(productCardHTML).join('');
    } catch (e) {
      grid.innerHTML = `<p class="loading-text">Couldn't load products: ${e.message}</p>`;
    }
  }

  filtersBar.querySelector('.chip[data-category=""]')?.addEventListener('click', () => {
    activeCategory = '';
    syncChipState();
    loadProducts();
  });

  await loadCategories();
  await loadProducts();
})();
