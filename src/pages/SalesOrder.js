/**
 * SalesOrder.js — Sales Order CRUD page
 * Satyendra Packaging ERP — Phase 2
 */

import { salesOrders, getNextSOId, getNextSONumber, SO_STATUSES, UOM_OPTIONS } from '../data/salesOrders.js';
import { customers } from '../data/customers.js';
import { products, PRODUCT_TYPES } from '../data/products.js';
import { openModal, closeModal, confirmDialog } from '../components/Modal.js';
import { escapeHtml } from '../components/Table.js';
import { showToast } from '../js/app.js';

/** Cached table body element */
let _tbodyEl = null;
let _searchTerm = '';
let _statusFilter = 'All';

/**
 * Renders the Sales Order page.
 * @param {HTMLElement} container
 */
export function renderSalesOrder(container) {
  container.innerHTML = '';

  // ── Page Header ──
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div>
      <h1 class="page-title">Sales Orders</h1>
      <p class="page-subtitle">Manage customer purchase orders and production planning</p>
    </div>
    <button class="btn btn-primary" id="btn-add-so">
      <span>+</span> New Sales Order
    </button>
  `;
  container.appendChild(header);

  // ── Summary Strip ──
  container.appendChild(buildSummaryStrip());

  // ── Toolbar ──
  const toolbar = document.createElement('div');
  toolbar.className = 'page-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-left">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" class="form-control" id="so-search"
          placeholder="Search by SO#, customer, product..." value="${escapeHtml(_searchTerm)}" />
      </div>
      <div class="filter-chips" id="so-status-filters">
        ${['All', ...SO_STATUSES].map(s => `
          <button class="filter-chip ${_statusFilter === s ? 'active' : ''}" data-status="${s}">
            ${statusIcon(s)} ${s}
          </button>
        `).join('')}
      </div>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-secondary btn-sm" id="btn-export-so">📥 Export</button>
    </div>
  `;
  container.appendChild(toolbar);

  // ── Table Wrapper ──
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';
  wrapper.innerHTML = `
    <div class="table-header">
      <div>
        <span class="table-title">All Sales Orders</span>
        <span class="table-count" id="so-count">${salesOrders.length}</span>
      </div>
    </div>
  `;

  const scroll = document.createElement('div');
  scroll.style.overflowX = 'auto';

  const table = document.createElement('table');
  table.className = 'data-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="padding-left:var(--space-5)">SO Number</th>
        <th>Customer</th>
        <th>Product</th>
        <th>Product Type</th>
        <th>Quantity</th>
        <th>Delivery Date</th>
        <th>Sales Person</th>
        <th>Status</th>
        <th style="text-align:center">Actions</th>
      </tr>
    </thead>
    <tbody id="so-tbody"></tbody>
  `;

  scroll.appendChild(table);
  wrapper.appendChild(scroll);

  const footer = document.createElement('div');
  footer.className = 'table-footer';
  footer.id = 'so-footer';
  wrapper.appendChild(footer);

  container.appendChild(wrapper);
  _tbodyEl = table.querySelector('#so-tbody');

  // Initial render
  renderRows();

  // ── Events ──
  container.querySelector('#btn-add-so').addEventListener('click', () => openSOModal(null));
  container.querySelector('#so-search').addEventListener('input', e => {
    _searchTerm = e.target.value.trim();
    renderRows();
  });
  container.querySelector('#so-status-filters').addEventListener('click', e => {
    const chip = e.target.closest('[data-status]');
    if (!chip) return;
    _statusFilter = chip.getAttribute('data-status');
    container.querySelectorAll('[data-status]').forEach(c =>
      c.classList.toggle('active', c.getAttribute('data-status') === _statusFilter)
    );
    renderRows();
  });
  container.querySelector('#btn-export-so').addEventListener('click', exportSOCSV);

  // Table row actions — delegation
  _tbodyEl.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = parseInt(btn.getAttribute('data-id'), 10);
    const so = salesOrders.find(s => s.id === id);
    if (!so) return;

    if (action === 'edit')   openSOModal(so);
    if (action === 'view')   openSODetailModal(so);
    if (action === 'delete') {
      const ok = await confirmDialog(`Delete Sales Order <strong>${escapeHtml(so.soNumber)}</strong>?`, 'Delete SO');
      if (ok) {
        salesOrders.splice(salesOrders.indexOf(so), 1);
        renderRows();
        showToast(`SO ${so.soNumber} deleted.`, 'success');
      }
    }
  });
}

/** Filter + render tbody rows */
function renderRows() {
  let data = [...salesOrders];
  if (_statusFilter !== 'All') data = data.filter(s => s.status === _statusFilter);
  if (_searchTerm) {
    const t = _searchTerm.toLowerCase();
    data = data.filter(s =>
      s.soNumber.toLowerCase().includes(t) ||
      s.customerName.toLowerCase().includes(t) ||
      s.productName.toLowerCase().includes(t) ||
      s.poNumber.toLowerCase().includes(t)
    );
  }

  document.getElementById('so-count').textContent = data.length;
  if (!_tbodyEl) return;
  _tbodyEl.innerHTML = '';

  if (data.length === 0) {
    _tbodyEl.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">No sales orders found</div>
      </div>
    </td></tr>`;
    document.getElementById('so-footer').textContent = '';
    return;
  }

  data.forEach(so => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', so.id);

    const today = new Date();
    const delivery = new Date(so.deliveryDate);
    const diffDays = Math.ceil((delivery - today) / (1000 * 60 * 60 * 24));
    let daysClass = 'days-ok';
    let daysText  = `${diffDays}d left`;
    if (so.status === 'Completed' || so.status === 'Cancelled') {
      daysClass = 'badge-gray'; daysText = so.status;
    } else if (diffDays < 0) {
      daysClass = 'days-overdue'; daysText = `${Math.abs(diffDays)}d overdue`;
    } else if (diffDays <= 7) {
      daysClass = 'days-warning';
    }

    tr.innerHTML = `
      <td style="padding-left:var(--space-5)">
        <div class="so-number-cell">
          <span class="so-number-text">${escapeHtml(so.soNumber)}</span>
          <span class="so-date-text">${formatDate(so.soDate)}</span>
        </div>
      </td>
      <td>
        <div class="so-customer-cell">
          <span class="so-customer-name">${escapeHtml(truncate(so.customerName, 32))}</span>
          <span class="so-po-ref">PO: ${escapeHtml(so.poNumber)}</span>
        </div>
      </td>
      <td>
        <div class="so-product-cell">
          <span class="so-product-name">${escapeHtml(so.productName)}</span>
          <span class="so-product-code">${escapeHtml(so.productCode || '')}</span>
        </div>
      </td>
      <td><span class="badge badge-info" style="font-size:0.7rem;">${escapeHtml(so.productType)}</span></td>
      <td>
        <div class="so-qty-cell">
          ${so.quantity.toLocaleString()}
          <span class="so-qty-uom">${escapeHtml(so.uom)}</span>
        </div>
      </td>
      <td>
        <div class="delivery-date-cell">
          <span class="delivery-date-text">${formatDate(so.deliveryDate)}</span>
          <span class="delivery-days-remaining ${daysClass}">${daysText}</span>
        </div>
      </td>
      <td style="font-size:0.8rem;">${escapeHtml(so.salesPerson || '—')}</td>
      <td><span class="badge so-status-${so.status.toLowerCase()}">${escapeHtml(so.status)}</span></td>
      <td style="text-align:center">
        <div class="action-btns">
          <button class="btn-icon-only" style="border-color:#BBF7D0;color:#059669;" data-action="view" data-id="${so.id}" title="View">👁️</button>
          <button class="btn-icon-only btn-edit"   data-action="edit"   data-id="${so.id}" title="Edit">✏️</button>
          <button class="btn-icon-only btn-delete" data-action="delete" data-id="${so.id}" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    _tbodyEl.appendChild(tr);
  });

  document.getElementById('so-footer').innerHTML =
    `<span>Showing ${data.length} of ${salesOrders.length} orders</span>`;
}

/** Summary strip at top */
function buildSummaryStrip() {
  const counts = {
    total:      salesOrders.length,
    pending:    salesOrders.filter(s => s.status === 'Pending').length,
    approved:   salesOrders.filter(s => s.status === 'Approved').length,
    production: salesOrders.filter(s => s.status === 'Production').length,
    completed:  salesOrders.filter(s => s.status === 'Completed').length,
  };
  const totalQty = salesOrders.reduce((a, s) => a + (s.quantity || 0), 0);

  const strip = document.createElement('div');
  strip.className = 'so-summary-strip';
  strip.innerHTML = `
    ${summaryCard('📋', 'Total Orders',   counts.total,      '')}
    ${summaryCard('⏳', 'Pending',        counts.pending,    'Awaiting approval')}
    ${summaryCard('✅', 'Approved',       counts.approved,   'Ready for production')}
    ${summaryCard('🏭', 'In Production',  counts.production, 'Currently running')}
    ${summaryCard('📦', 'Total Quantity', totalQty.toLocaleString(), 'Pieces across all SOs')}
  `;
  return strip;
}

function summaryCard(icon, label, value, sub) {
  return `
    <div class="so-summary-card">
      <div style="font-size:1.4rem;">${icon}</div>
      <div class="so-summary-value">${value}</div>
      <div class="so-summary-label">${label}</div>
      ${sub ? `<div class="so-summary-sub">${sub}</div>` : ''}
    </div>
  `;
}

/** Add / Edit SO Modal */
function openSOModal(existing) {
  const isEdit = !!existing;
  const defaultSO = isEdit ? existing.soNumber : getNextSONumber();
  const today = new Date().toISOString().split('T')[0];

  const customerOptions = customers
    .filter(c => c.status === 'Active')
    .map(c => `<option value="${c.id}" data-name="${escapeHtml(c.name)}"
      ${existing?.customerId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');

  const productOptions = products
    .filter(p => p.status === 'Active')
    .map(p => `<option value="${p.id}" data-name="${escapeHtml(p.name)}" data-code="${escapeHtml(p.code)}" data-type="${escapeHtml(p.type)}"
      ${existing?.productCode === p.code ? 'selected' : ''}>${escapeHtml(p.code)} — ${escapeHtml(p.name)}</option>`).join('');

  const body = `
    <form id="so-form" novalidate>
      <div class="so-form-grid">
        <div class="form-group">
          <label class="form-label">SO Number <span class="required">*</span></label>
          <input class="form-control" id="sf-sonum" type="text" value="${escapeHtml(defaultSO)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">SO Date <span class="required">*</span></label>
          <input class="form-control" id="sf-sodate" type="date" value="${existing?.soDate || today}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="sf-status">
            ${SO_STATUSES.map(s => `<option value="${s}" ${(existing?.status || 'Pending') === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>

        <div class="form-group span-2">
          <label class="form-label">Customer <span class="required">*</span></label>
          <select class="form-control" id="sf-customer" required>
            <option value="">-- Select Customer --</option>
            ${customerOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Sales Person</label>
          <input class="form-control" id="sf-salesperson" type="text" value="${escapeHtml(existing?.salesPerson || 'Mr. Anand')}" />
        </div>

        <div class="form-group">
          <label class="form-label">PO Number <span class="required">*</span></label>
          <input class="form-control" id="sf-ponum" type="text" value="${escapeHtml(existing?.poNumber || '')}" placeholder="Customer PO ref" required />
        </div>
        <div class="form-group">
          <label class="form-label">PO Date</label>
          <input class="form-control" id="sf-podate" type="date" value="${existing?.poDate || today}" />
        </div>
        <div class="form-group">
          <label class="form-label">Delivery Date <span class="required">*</span></label>
          <input class="form-control" id="sf-delivery" type="date" value="${existing?.deliveryDate || ''}" required />
        </div>

        <div class="form-group span-2">
          <label class="form-label">Product <span class="required">*</span></label>
          <select class="form-control" id="sf-product" required>
            <option value="">-- Select Product --</option>
            ${productOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Product Type</label>
          <input class="form-control" id="sf-prodtype" type="text" value="${escapeHtml(existing?.productType || '')}" readonly style="background:var(--color-bg);" />
        </div>

        <div class="form-group">
          <label class="form-label">Quantity <span class="required">*</span></label>
          <input class="form-control" id="sf-qty" type="number" min="1"
            value="${existing?.quantity || ''}" placeholder="No. of bags" required />
        </div>
        <div class="form-group">
          <label class="form-label">UOM</label>
          <select class="form-control" id="sf-uom">
            ${UOM_OPTIONS.map(u => `<option value="${u}" ${(existing?.uom || 'PCS') === u ? 'selected':''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Branch</label>
          <input class="form-control" id="sf-branch" type="text" value="${escapeHtml(existing?.branch || 'NAVALI')}" />
        </div>

        <div class="form-group span-3">
          <label class="form-label">Remarks / Bag Description</label>
          <textarea class="form-control" id="sf-remarks" rows="2" placeholder="Bag spec summary...">${escapeHtml(existing?.remarks || '')}</textarea>
        </div>
      </div>
      <div id="so-form-error" class="alert alert-error" style="display:none;margin-top:var(--space-3);"></div>
    </form>
  `;

  openModal({
    id: 'so-modal', title: isEdit ? 'Edit Sales Order' : 'New Sales Order',
    size: 'xl', body,
    footer: [
      { label: 'Cancel',  className: 'btn btn-secondary', action: 'cancel',  onClick: () => closeModal('so-modal') },
      { label: isEdit ? '💾 Save Changes' : '✅ Create SO', className: 'btn btn-primary', action: 'submit', onClick: () => submitSOForm(existing) },
    ],
  });

  // Auto-fill product type when product selected
  setTimeout(() => {
    document.getElementById('sf-product')?.addEventListener('change', e => {
      const opt = e.target.selectedOptions[0];
      const type = opt?.getAttribute('data-type') || '';
      document.getElementById('sf-prodtype').value = type;
    });
  }, 50);
}

function submitSOForm(existing) {
  const err = document.getElementById('so-form-error');
  const get = id => document.getElementById(id)?.value?.trim() || '';

  const customerSel = document.getElementById('sf-customer');
  const productSel  = document.getElementById('sf-product');
  const custOpt     = customerSel?.selectedOptions[0];
  const prodOpt     = productSel?.selectedOptions[0];

  const data = {
    soNumber:     get('sf-sonum'),
    soDate:       get('sf-sodate'),
    customerId:   parseInt(customerSel?.value || '0', 10),
    customerName: custOpt?.dataset.name || custOpt?.text || '',
    poNumber:     get('sf-ponum'),
    poDate:       get('sf-podate'),
    deliveryDate: get('sf-delivery'),
    productType:  get('sf-prodtype'),
    productCode:  prodOpt?.dataset.code || '',
    productName:  prodOpt?.dataset.name || prodOpt?.text?.split('—')[1]?.trim() || '',
    quantity:     parseInt(get('sf-qty'), 10) || 0,
    uom:          get('sf-uom') || 'PCS',
    remarks:      get('sf-remarks'),
    status:       get('sf-status') || 'Pending',
    salesPerson:  get('sf-salesperson'),
    branch:       get('sf-branch') || 'NAVALI',
  };

  const errors = [];
  if (!data.soNumber)            errors.push('SO Number is required.');
  if (!data.soDate)              errors.push('SO Date is required.');
  if (!data.customerId)          errors.push('Customer is required.');
  if (!data.poNumber)            errors.push('PO Number is required.');
  if (!data.deliveryDate)        errors.push('Delivery Date is required.');
  if (!productSel?.value)        errors.push('Product is required.');
  if (!data.quantity || data.quantity < 1) errors.push('Quantity must be greater than 0.');

  if (errors.length) {
    err.innerHTML = '⚠️ ' + errors.join('<br>⚠️ ');
    err.style.display = 'flex';
    return;
  }
  err.style.display = 'none';

  if (existing) {
    const idx = salesOrders.findIndex(s => s.id === existing.id);
    if (idx > -1) salesOrders[idx] = { ...salesOrders[idx], ...data };
    showToast(`SO ${data.soNumber} updated.`, 'success');
  } else {
    salesOrders.push({ id: getNextSOId(), createdAt: new Date().toISOString().split('T')[0], ...data });
    showToast(`Sales Order ${data.soNumber} created.`, 'success');
  }

  closeModal('so-modal');
  renderRows();
  // Refresh summary strip
  const strip = document.querySelector('.so-summary-strip');
  if (strip) strip.replaceWith(buildSummaryStrip());
}

/** Read-only detail view */
function openSODetailModal(so) {
  const body = `
    <div class="so-detail-section">
      <div class="so-detail-section-title">📋 Order Information</div>
      <div class="so-detail-grid">
        ${detailItem('SO Number',   so.soNumber)}
        ${detailItem('SO Date',     formatDate(so.soDate))}
        ${detailItem('PO Number',   so.poNumber)}
        ${detailItem('PO Date',     formatDate(so.poDate))}
        ${detailItem('Delivery Date', formatDate(so.deliveryDate))}
        ${detailItem('Status',      `<span class="badge so-status-${so.status.toLowerCase()}">${so.status}</span>`)}
        ${detailItem('Sales Person', so.salesPerson || '—')}
        ${detailItem('Branch',      so.branch || '—')}
      </div>
    </div>
    <div class="so-detail-section">
      <div class="so-detail-section-title">👥 Customer Details</div>
      <div class="so-detail-grid">
        ${detailItem('Customer Name', so.customerName)}
      </div>
    </div>
    <div class="so-detail-section">
      <div class="so-detail-section-title">📦 Product Details</div>
      <div class="so-detail-grid">
        ${detailItem('Product Code', `<code>${so.productCode || '—'}</code>`)}
        ${detailItem('Product Name', so.productName)}
        ${detailItem('Product Type', so.productType)}
        ${detailItem('Quantity', `<strong>${so.quantity?.toLocaleString()} ${so.uom}</strong>`)}
      </div>
    </div>
    ${so.remarks ? `
    <div class="so-detail-section">
      <div class="so-detail-section-title">📝 Remarks / Specifications</div>
      <p style="font-size:0.85rem;color:var(--color-text-secondary);line-height:1.6;">${escapeHtml(so.remarks)}</p>
    </div>` : ''}
  `;

  openModal({
    id: 'so-detail-modal',
    title: `Sales Order — ${so.soNumber}`,
    size: 'lg', body,
    footer: [
      { label: '✕ Close', className: 'btn btn-secondary', action: 'close', onClick: () => closeModal('so-detail-modal') },
      { label: '✏️ Edit',  className: 'btn btn-primary',   action: 'edit',  onClick: () => { closeModal('so-detail-modal'); openSOModal(so); } },
    ],
  });
}

function detailItem(key, val) {
  return `
    <div class="so-detail-item">
      <span class="so-detail-key">${key}</span>
      <span class="so-detail-val">${val}</span>
    </div>
  `;
}

function exportSOCSV() {
  const headers = ['SO Number','SO Date','Customer','PO Number','PO Date','Delivery Date','Product','Quantity','UOM','Status'];
  const rows = salesOrders.map(s => [
    s.soNumber, s.soDate, s.customerName, s.poNumber, s.poDate,
    s.deliveryDate, s.productName, s.quantity, s.uom, s.status,
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: 'sales_orders.csv',
  });
  a.click();
  showToast('Sales Orders exported.', 'success');
}

// ── helpers ──
function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function truncate(s, n) { return s?.length > n ? s.slice(0, n) + '…' : s; }
function statusIcon(s) {
  const m = { All:'📋', Pending:'⏳', Approved:'✅', Production:'🏭', Completed:'📦', Cancelled:'❌' };
  return m[s] || '📋';
}
