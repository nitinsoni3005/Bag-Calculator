/**
 * ProductMaster.js — Product Master CRUD page
 * Satyendra Packaging ERP — Phase 1
 */

import { products, getNextProductId, getNextProductCode, PRODUCT_TYPES } from '../data/products.js';
import { escapeHtml } from '../components/Table.js';
import { openModal, closeModal, confirmDialog } from '../components/Modal.js';
import { showToast } from '../js/app.js';

/** State: search + filter */
let _searchTerm  = '';
let _filterType  = 'All';

/** Cached table reference */
let _tableEl = null;

/** Map product type → CSS class */
const TYPE_CLASS_MAP = {
  'BOPP Bag':      'type-bopp',
  'PP Woven Bag':  'type-pp',
  'Laminated Bag': 'type-laminated',
  'Shopping Bag':  'type-shopping',
  'Pouch':         'type-pouch',
  'FIBC':          'type-fibc',
  'Tarpaulin':     'type-tarpaulin',
};

/** Map product type → emoji icon */
const TYPE_ICON_MAP = {
  'BOPP Bag':      '🎨',
  'PP Woven Bag':  '🧵',
  'Laminated Bag': '✨',
  'Shopping Bag':  '🛍️',
  'Pouch':         '📫',
  'FIBC':          '🏗️',
  'Tarpaulin':     '🏕️',
};

/**
 * Renders the Product Master page into the given container.
 * @param {HTMLElement} container
 */
export function renderProductMaster(container) {
  container.innerHTML = '';

  // ── Page Header ──
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div>
      <h1 class="page-title">Product Master</h1>
      <p class="page-subtitle">Manage finished goods specifications and product catalog</p>
    </div>
    <button class="btn btn-primary" id="btn-add-product">
      <span>+</span> Add Product
    </button>
  `;
  container.appendChild(header);

  // ── Toolbar ──
  const toolbar = document.createElement('div');
  toolbar.className = 'page-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-left">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="form-control"
          id="product-search"
          placeholder="Search by name, code, type..."
          value="${escapeHtml(_searchTerm)}"
        />
      </div>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-secondary btn-sm" id="btn-export-products" title="Export CSV">
        📥 Export
      </button>
      <button class="btn btn-secondary btn-sm" id="btn-refresh-products" title="Refresh">
        🔄 Refresh
      </button>
    </div>
  `;
  container.appendChild(toolbar);

  // ── Type Filter Chips ──
  const chipWrap = document.createElement('div');
  chipWrap.className = 'filter-chips';
  chipWrap.id = 'product-filter-chips';

  const allTypes = ['All', ...PRODUCT_TYPES];
  chipWrap.innerHTML = allTypes.map(type => `
    <button
      class="filter-chip ${_filterType === type ? 'active' : ''}"
      data-type="${type}"
    >
      ${TYPE_ICON_MAP[type] || '📦'} ${type}
    </button>
  `).join('');

  container.appendChild(chipWrap);

  // ── Table Wrapper ──
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';

  const tableHeader = document.createElement('div');
  tableHeader.className = 'table-header';
  tableHeader.innerHTML = `
    <div>
      <span class="table-title">Product Catalog</span>
      <span class="table-count" id="product-count">${products.length}</span>
    </div>
  `;
  wrapper.appendChild(tableHeader);

  // ── Table ──
  const scrollDiv = document.createElement('div');
  scrollDiv.style.overflowX = 'auto';

  _tableEl = document.createElement('table');
  _tableEl.className = 'data-table';
  _tableEl.innerHTML = `
    <thead>
      <tr>
        <th style="padding-left: var(--space-5);">Product</th>
        <th>Type</th>
        <th>Size</th>
        <th>Weight</th>
        <th>Mesh</th>
        <th>Lamination</th>
        <th>Status</th>
        <th style="text-align:center;">Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  scrollDiv.appendChild(_tableEl);
  wrapper.appendChild(scrollDiv);

  // ── Table Footer ──
  const tableFooter = document.createElement('div');
  tableFooter.className = 'table-footer';
  tableFooter.id = 'product-table-footer';
  wrapper.appendChild(tableFooter);

  container.appendChild(wrapper);

  // Initial render
  renderRows();

  // ── Event Listeners ──

  // Search
  container.querySelector('#product-search').addEventListener('input', (e) => {
    _searchTerm = e.target.value.trim();
    renderRows();
  });

  // Add product button
  container.querySelector('#btn-add-product').addEventListener('click', () => {
    openProductModal(null);
  });

  // Type filter chips
  chipWrap.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    _filterType = chip.getAttribute('data-type');
    // Update chip active state
    chipWrap.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-type') === _filterType);
    });
    renderRows();
  });

  // Refresh
  container.querySelector('#btn-refresh-products').addEventListener('click', () => {
    _searchTerm = '';
    _filterType = 'All';
    container.querySelector('#product-search').value = '';
    chipWrap.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-type') === 'All');
    });
    renderRows();
    showToast('Data refreshed', 'info');
  });

  // Export
  container.querySelector('#btn-export-products').addEventListener('click', () => {
    exportProductsCSV();
  });

  // Table row actions — delegation
  _tableEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id     = parseInt(btn.getAttribute('data-id'), 10);
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (action === 'edit') {
      openProductModal(product);
    } else if (action === 'delete') {
      const confirmed = await confirmDialog(
        `Are you sure you want to delete <strong>${escapeHtml(product.name)}</strong>?`,
        'Delete Product'
      );
      if (confirmed) {
        const idx = products.findIndex(p => p.id === id);
        if (idx > -1) {
          products.splice(idx, 1);
          renderRows();
          showToast(`Product "${product.name}" deleted.`, 'success');
        }
      }
    }
  });
}

/** Filters + renders the product table rows */
function renderRows() {
  let filtered = [...products];

  // Filter by type
  if (_filterType !== 'All') {
    filtered = filtered.filter(p => p.type === _filterType);
  }

  // Filter by search
  if (_searchTerm) {
    const term = _searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.type.toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  }

  // Update count badge
  const countEl = document.getElementById('product-count');
  if (countEl) countEl.textContent = filtered.length;

  const tbody = _tableEl?.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-title">No products found</div>
            <div class="empty-state-desc">
              ${_searchTerm ? `No results for "${escapeHtml(_searchTerm)}"` : `No ${_filterType} products yet.`}
            </div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(product => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', product.id);

    const typeClass = TYPE_CLASS_MAP[product.type] || 'type-pp';
    const typeIcon  = TYPE_ICON_MAP[product.type]  || '📦';
    const statusClass = product.status === 'Active' ? 'badge-success' : 'badge-danger';
    const lamiClass   = product.lamination !== 'NO' ? 'badge-success' : 'badge-gray';

    tr.innerHTML = `
      <td style="padding-left: var(--space-5);">
        <div style="display:flex; align-items:center; gap: var(--space-3);">
          <div style="
            width:38px; height:38px; border-radius: var(--radius-md);
            background: var(--color-accent-light); display:flex;
            align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;
          ">${typeIcon}</div>
          <div>
            <div style="font-weight:500;">${escapeHtml(product.name)}</div>
            <div style="font-size:0.7rem; color: var(--color-text-muted); font-family:monospace;">${escapeHtml(product.code)}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="type-badge ${typeClass}">${escapeHtml(product.type)}</span>
      </td>
      <td style="font-family:monospace; font-size:0.8rem;">${escapeHtml(product.size || '—')}</td>
      <td>${escapeHtml(product.weight || '—')}</td>
      <td>${escapeHtml(product.mesh || '—')}</td>
      <td>
        <span class="badge ${lamiClass}">
          ${product.lamination !== 'NO' ? '✓ Yes' : '✗ No'}
        </span>
      </td>
      <td><span class="badge ${statusClass}">${escapeHtml(product.status)}</span></td>
      <td style="text-align:center;">
        <div class="action-btns">
          <button class="btn-icon-only btn-edit"   data-action="edit"   data-id="${product.id}" title="Edit">✏️</button>
          <button class="btn-icon-only btn-delete" data-action="delete" data-id="${product.id}" title="Delete">🗑️</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Update footer
  const footer = document.getElementById('product-table-footer');
  if (footer) {
    footer.innerHTML = `<span>Showing ${filtered.length} of ${products.length} products</span>`;
  }
}

/** Opens the add/edit product modal */
function openProductModal(existing) {
  const isEdit = !!existing;
  const title  = isEdit ? 'Edit Product' : 'Add New Product';
  const defaultCode = isEdit ? existing.code : getNextProductCode();

  const LAMI_OPTIONS = ['NO', 'YES - 1 SIDE', 'YES - BOTH SIDE', 'YES - MULTI LAYER', 'YES - PE COATED'];
  const FABRIC_TYPES = ['MILKY WHITE', 'NATURAL', 'BEIGE', 'BROWN', 'BLUE', 'GREEN', 'RED', 'ORANGE', 'YELLOW', 'MULTI COLOR'];

  const body = `
    <form id="product-form" novalidate>
      <div class="form-grid">

        <!-- Product Code -->
        <div class="form-group">
          <label class="form-label" for="pf-code">Product Code <span class="required">*</span></label>
          <input class="form-control" id="pf-code" name="code" type="text"
            value="${escapeHtml(defaultCode)}" placeholder="FGS05400" required />
        </div>

        <!-- Status -->
        <div class="form-group">
          <label class="form-label" for="pf-status">Status</label>
          <select class="form-control" id="pf-status" name="status">
            <option value="Active"   ${(!existing || existing.status === 'Active')   ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${(existing && existing.status === 'Inactive') ? 'selected' : ''}>Inactive</option>
          </select>
        </div>

        <!-- Product Name -->
        <div class="form-group span-2">
          <label class="form-label" for="pf-name">Product Name <span class="required">*</span></label>
          <input class="form-control" id="pf-name" name="name" type="text"
            value="${escapeHtml(existing?.name || '')}" placeholder="e.g. BLUE ROSE STEAM RICE 10 KG" required />
        </div>

        <!-- Product Type -->
        <div class="form-group">
          <label class="form-label" for="pf-type">Product Type <span class="required">*</span></label>
          <select class="form-control" id="pf-type" name="type" required>
            <option value="">-- Select Type --</option>
            ${PRODUCT_TYPES.map(t => `
              <option value="${t}" ${existing?.type === t ? 'selected' : ''}>${t}</option>
            `).join('')}
          </select>
        </div>

        <!-- Fabric / Material -->
        <div class="form-group">
          <label class="form-label" for="pf-fabric">Fabric Color</label>
          <select class="form-control" id="pf-fabric" name="fabric">
            <option value="">-- Select --</option>
            ${FABRIC_TYPES.map(f => `
              <option value="${f}" ${existing?.fabric === f ? 'selected' : ''}>${f}</option>
            `).join('')}
          </select>
        </div>

        <!-- Size -->
        <div class="form-group">
          <label class="form-label" for="pf-size">Size (W x L)</label>
          <input class="form-control" id="pf-size" name="size" type="text"
            value="${escapeHtml(existing?.size || '')}" placeholder="e.g. 15 X 22 INCH" />
        </div>

        <!-- Weight -->
        <div class="form-group">
          <label class="form-label" for="pf-weight">Bag Weight (GMS)</label>
          <input class="form-control" id="pf-weight" name="weight" type="text"
            value="${escapeHtml(existing?.weight || '')}" placeholder="e.g. 58/60 GMS" />
        </div>

        <!-- Mesh -->
        <div class="form-group">
          <label class="form-label" for="pf-mesh">Mesh (W x W)</label>
          <input class="form-control" id="pf-mesh" name="mesh" type="text"
            value="${escapeHtml(existing?.mesh || '')}" placeholder="e.g. 9.5 X 9.5" />
        </div>

        <!-- Lamination -->
        <div class="form-group">
          <label class="form-label" for="pf-lamination">Lamination</label>
          <select class="form-control" id="pf-lamination" name="lamination">
            ${LAMI_OPTIONS.map(l => `
              <option value="${l}" ${(existing?.lamination || 'NO') === l ? 'selected' : ''}>${l}</option>
            `).join('')}
          </select>
        </div>

        <!-- Printing -->
        <div class="form-group span-2">
          <label class="form-label" for="pf-printing">Printing Details</label>
          <input class="form-control" id="pf-printing" name="printing" type="text"
            value="${escapeHtml(existing?.printing || '')}" placeholder="e.g. BOPP MATT FINISH - 6 COLOR" />
        </div>

        <!-- Description -->
        <div class="form-group span-2">
          <label class="form-label" for="pf-desc">Description</label>
          <textarea class="form-control" id="pf-desc" name="description" rows="3"
            placeholder="Detailed product specification...">${escapeHtml(existing?.description || '')}</textarea>
        </div>

      </div>

      <!-- Validation error -->
      <div id="pform-error" class="alert alert-error" style="display:none; margin-top: var(--space-4);"></div>
    </form>
  `;

  openModal({
    id: 'product-modal',
    title,
    size: 'lg',
    body,
    footer: [
      {
        label: 'Cancel',
        className: 'btn btn-secondary',
        action: 'cancel',
        onClick: () => closeModal('product-modal'),
      },
      {
        label: isEdit ? '💾 Save Changes' : '✅ Add Product',
        className: 'btn btn-primary',
        action: 'submit',
        onClick: () => submitProductForm(existing),
      },
    ],
  });
}

/** Reads form, validates, saves product */
function submitProductForm(existing) {
  const form     = document.getElementById('product-form');
  const errorEl  = document.getElementById('pform-error');
  if (!form || !errorEl) return;

  const data = {
    code:        form.querySelector('#pf-code').value.trim(),
    name:        form.querySelector('#pf-name').value.trim(),
    type:        form.querySelector('#pf-type').value,
    fabric:      form.querySelector('#pf-fabric').value,
    size:        form.querySelector('#pf-size').value.trim(),
    weight:      form.querySelector('#pf-weight').value.trim(),
    mesh:        form.querySelector('#pf-mesh').value.trim(),
    lamination:  form.querySelector('#pf-lamination').value,
    printing:    form.querySelector('#pf-printing').value.trim(),
    description: form.querySelector('#pf-desc').value.trim(),
    status:      form.querySelector('#pf-status').value,
  };

  // ── Validation ──
  const errors = [];
  if (!data.code) errors.push('Product Code is required.');
  if (!data.name) errors.push('Product Name is required.');
  if (!data.type) errors.push('Product Type is required.');

  if (errors.length > 0) {
    errorEl.innerHTML = '⚠️ ' + errors.join('<br>⚠️ ');
    errorEl.style.display = 'flex';
    return;
  }

  errorEl.style.display = 'none';

  if (existing) {
    const idx = products.findIndex(p => p.id === existing.id);
    if (idx > -1) {
      products[idx] = { ...products[idx], ...data };
      showToast(`Product "${data.name}" updated successfully.`, 'success');
    }
  } else {
    const newProduct = {
      id:        getNextProductId(),
      createdAt: new Date().toISOString().split('T')[0],
      ...data,
    };
    products.push(newProduct);
    showToast(`Product "${data.name}" added successfully.`, 'success');
  }

  closeModal('product-modal');
  renderRows();
}

/** Exports products to CSV */
function exportProductsCSV() {
  const headers = ['Code', 'Name', 'Type', 'Size', 'Weight', 'Mesh', 'Lamination', 'Status'];
  const rows = products.map(p => [
    p.code, p.name, p.type, p.size, p.weight, p.mesh, p.lamination, p.status,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'products.csv';
  a.click();
  URL.revokeObjectURL(url);

  showToast('Products exported to CSV.', 'success');
}
