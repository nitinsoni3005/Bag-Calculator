/**
 * CustomerMaster.js — Customer Master CRUD page
 * Satyendra Packaging ERP — Phase 1
 */

import { customers, getNextCustomerId, getNextCustomerCode } from '../data/customers.js';
import { refreshTableBody, escapeHtml } from '../components/Table.js';
import { openModal, closeModal, confirmDialog } from '../components/Modal.js';
import { showToast } from '../js/app.js';

/** Table columns config */
const COLUMNS = [
  { key: 'code',    label: 'Code' },
  { key: 'name',    label: 'Customer Name',
    render: (val, row) => `
      <div class="customer-name-cell">
        <div class="customer-avatar">${getInitials(row.name)}</div>
        <div>
          <div class="customer-name-text">${escapeHtml(row.name)}</div>
          <div class="customer-code">${escapeHtml(row.code)}</div>
        </div>
      </div>
    `,
  },
  { key: 'contact', label: 'Contact Person' },
  { key: 'mobile',  label: 'Mobile' },
  { key: 'city',    label: 'City' },
  { key: 'state',   label: 'State' },
  { key: 'gst',     label: 'GST No.' },
  { key: 'status',  label: 'Status',
    render: (val) => {
      const cls = val === 'Active' ? 'badge-success' : 'badge-danger';
      return `<span class="badge ${cls}">${escapeHtml(val)}</span>`;
    },
  },
  { key: 'actions', label: 'Actions',
    render: (val, row) => `
      <div class="action-btns">
        <button class="btn-icon-only btn-edit" data-action="edit" data-id="${row.id}" title="Edit">
          ✏️
        </button>
        <button class="btn-icon-only btn-delete" data-action="delete" data-id="${row.id}" title="Delete">
          🗑️
        </button>
      </div>
    `,
  },
];

/** State: current search filter */
let _searchTerm = '';

/** Cached reference to the tbody for quick re-render */
let _tableEl = null;

/**
 * Renders the Customer Master page into the given container.
 * @param {HTMLElement} container
 */
export function renderCustomerMaster(container) {
  container.innerHTML = '';

  // ── Page Header ──
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div>
      <h1 class="page-title">Customer Master</h1>
      <p class="page-subtitle">Manage all customer accounts and contact information</p>
    </div>
    <button class="btn btn-primary" id="btn-add-customer">
      <span>+</span> Add Customer
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
          id="customer-search"
          placeholder="Search by name, code, city..."
          value="${escapeHtml(_searchTerm)}"
        />
      </div>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-secondary btn-sm" id="btn-export-customers" title="Export CSV">
        📥 Export
      </button>
      <button class="btn btn-secondary btn-sm" id="btn-refresh-customers" title="Refresh">
        🔄 Refresh
      </button>
    </div>
  `;
  container.appendChild(toolbar);

  // ── Table Wrapper ──
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';

  const tableHeader = document.createElement('div');
  tableHeader.className = 'table-header';
  tableHeader.innerHTML = `
    <div>
      <span class="table-title">All Customers</span>
      <span class="table-count" id="customer-count">${customers.length}</span>
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
        <th style="padding-left: var(--space-5);">Customer</th>
        <th>Contact Person</th>
        <th>Mobile</th>
        <th>City</th>
        <th>State</th>
        <th>GST No.</th>
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
  tableFooter.id = 'customer-table-footer';
  wrapper.appendChild(tableFooter);

  container.appendChild(wrapper);

  // Render rows
  renderRows();

  // ── Event Listeners ──

  // Search
  container.querySelector('#customer-search').addEventListener('input', (e) => {
    _searchTerm = e.target.value.trim();
    renderRows();
  });

  // Add customer button
  container.querySelector('#btn-add-customer').addEventListener('click', () => {
    openCustomerModal(null);
  });

  // Refresh
  container.querySelector('#btn-refresh-customers').addEventListener('click', () => {
    _searchTerm = '';
    container.querySelector('#customer-search').value = '';
    renderRows();
    showToast('Data refreshed', 'info');
  });

  // Export (basic CSV)
  container.querySelector('#btn-export-customers').addEventListener('click', () => {
    exportCustomersCSV();
  });

  // Table action buttons (edit/delete) — event delegation
  _tableEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = parseInt(btn.getAttribute('data-id'), 10);
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    if (action === 'edit') {
      openCustomerModal(customer);
    } else if (action === 'delete') {
      const confirmed = await confirmDialog(
        `Are you sure you want to delete <strong>${escapeHtml(customer.name)}</strong>? This action cannot be undone.`,
        'Delete Customer'
      );
      if (confirmed) {
        const idx = customers.findIndex(c => c.id === id);
        if (idx > -1) {
          customers.splice(idx, 1);
          renderRows();
          showToast(`Customer "${customer.name}" deleted.`, 'success');
        }
      }
    }
  });
}

/** Filters customers by search term and re-renders tbody */
function renderRows() {
  const filtered = _searchTerm
    ? customers.filter(c =>
        c.name.toLowerCase().includes(_searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(_searchTerm.toLowerCase()) ||
        c.city.toLowerCase().includes(_searchTerm.toLowerCase()) ||
        c.state.toLowerCase().includes(_searchTerm.toLowerCase()) ||
        c.contact.toLowerCase().includes(_searchTerm.toLowerCase())
      )
    : [...customers];

  // Update count badge
  const countEl = document.getElementById('customer-count');
  if (countEl) countEl.textContent = filtered.length;

  // Re-render tbody
  const tbody = _tableEl?.querySelector('tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-title">No customers found</div>
            <div class="empty-state-desc">
              ${_searchTerm ? `No results for "${escapeHtml(_searchTerm)}"` : 'Start by adding your first customer.'}
            </div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(customer => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', customer.id);

    // Customer name cell with avatar
    const initials = getInitials(customer.name);
    const statusClass = customer.status === 'Active' ? 'badge-success' : 'badge-danger';

    tr.innerHTML = `
      <td style="padding-left: var(--space-5);">
        <div class="customer-name-cell">
          <div class="customer-avatar">${initials}</div>
          <div>
            <div class="customer-name-text">${escapeHtml(customer.name)}</div>
            <div class="customer-code">${escapeHtml(customer.code)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(customer.contact)}</td>
      <td>${escapeHtml(customer.mobile)}</td>
      <td>${escapeHtml(customer.city)}</td>
      <td>${escapeHtml(customer.state)}</td>
      <td><span style="font-family:monospace; font-size:0.75rem;">${escapeHtml(customer.gst)}</span></td>
      <td><span class="badge ${statusClass}">${escapeHtml(customer.status)}</span></td>
      <td style="text-align:center;">
        <div class="action-btns">
          <button class="btn-icon-only btn-edit" data-action="edit" data-id="${customer.id}" title="Edit">✏️</button>
          <button class="btn-icon-only btn-delete" data-action="delete" data-id="${customer.id}" title="Delete">🗑️</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Update footer text
  const footer = document.getElementById('customer-table-footer');
  if (footer) {
    footer.innerHTML = `<span>Showing ${filtered.length} of ${customers.length} customers</span>`;
  }
}

/** Opens the add/edit customer modal */
function openCustomerModal(existing) {
  const isEdit = !!existing;
  const title = isEdit ? 'Edit Customer' : 'Add New Customer';
  const defaultCode = isEdit ? existing.code : getNextCustomerCode();

  const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal',
  ];

  const body = `
    <form id="customer-form" novalidate>
      <div class="form-grid">
        <!-- Customer Code -->
        <div class="form-group">
          <label class="form-label" for="f-code">Customer Code <span class="required">*</span></label>
          <input class="form-control" id="f-code" name="code" type="text"
            value="${escapeHtml(defaultCode)}" placeholder="CUST-001" required />
        </div>

        <!-- Status -->
        <div class="form-group">
          <label class="form-label" for="f-status">Status</label>
          <select class="form-control" id="f-status" name="status">
            <option value="Active"   ${(!existing || existing.status === 'Active')   ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${(existing && existing.status === 'Inactive') ? 'selected' : ''}>Inactive</option>
          </select>
        </div>

        <!-- Customer Name -->
        <div class="form-group span-2">
          <label class="form-label" for="f-name">Customer Name <span class="required">*</span></label>
          <input class="form-control" id="f-name" name="name" type="text"
            value="${escapeHtml(existing?.name || '')}" placeholder="Enter company / customer name" required />
        </div>

        <!-- Contact Person -->
        <div class="form-group">
          <label class="form-label" for="f-contact">Contact Person <span class="required">*</span></label>
          <input class="form-control" id="f-contact" name="contact" type="text"
            value="${escapeHtml(existing?.contact || '')}" placeholder="Mr. / Ms. Name" required />
        </div>

        <!-- Mobile -->
        <div class="form-group">
          <label class="form-label" for="f-mobile">Mobile Number <span class="required">*</span></label>
          <input class="form-control" id="f-mobile" name="mobile" type="tel"
            value="${escapeHtml(existing?.mobile || '')}" placeholder="10-digit mobile" required maxlength="10" />
        </div>

        <!-- Email -->
        <div class="form-group">
          <label class="form-label" for="f-email">Email Address</label>
          <input class="form-control" id="f-email" name="email" type="email"
            value="${escapeHtml(existing?.email || '')}" placeholder="contact@company.com" />
        </div>

        <!-- GST -->
        <div class="form-group">
          <label class="form-label" for="f-gst">GST Number</label>
          <input class="form-control" id="f-gst" name="gst" type="text"
            value="${escapeHtml(existing?.gst || '')}" placeholder="22AAAAA0000A1Z5" maxlength="15" style="text-transform:uppercase;" />
        </div>

        <!-- Address -->
        <div class="form-group span-2">
          <label class="form-label" for="f-address">Address</label>
          <textarea class="form-control" id="f-address" name="address" rows="2"
            placeholder="Street address, area...">${escapeHtml(existing?.address || '')}</textarea>
        </div>

        <!-- City -->
        <div class="form-group">
          <label class="form-label" for="f-city">City <span class="required">*</span></label>
          <input class="form-control" id="f-city" name="city" type="text"
            value="${escapeHtml(existing?.city || '')}" placeholder="City" required />
        </div>

        <!-- State -->
        <div class="form-group">
          <label class="form-label" for="f-state">State <span class="required">*</span></label>
          <select class="form-control" id="f-state" name="state" required>
            <option value="">-- Select State --</option>
            ${STATES.map(s => `
              <option value="${s}" ${existing?.state === s ? 'selected' : ''}>${s}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Validation error -->
      <div id="form-error" class="alert alert-error" style="display:none; margin-top: var(--space-4);"></div>
    </form>
  `;

  openModal({
    id: 'customer-modal',
    title,
    size: 'lg',
    body,
    footer: [
      {
        label: 'Cancel',
        className: 'btn btn-secondary',
        action: 'cancel',
        onClick: () => closeModal('customer-modal'),
      },
      {
        label: isEdit ? '💾 Save Changes' : '✅ Add Customer',
        className: 'btn btn-primary',
        action: 'submit',
        onClick: () => submitCustomerForm(existing),
      },
    ],
  });

  // Allow Enter key on form to submit
  const form = document.getElementById('customer-form');
  if (form) {
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        submitCustomerForm(existing);
      }
    });
  }
}

/** Reads form values, validates, and saves to array */
function submitCustomerForm(existing) {
  const form = document.getElementById('customer-form');
  const errorEl = document.getElementById('form-error');
  if (!form || !errorEl) return;

  // Gather values
  const data = {
    code:    form.querySelector('#f-code').value.trim(),
    name:    form.querySelector('#f-name').value.trim(),
    contact: form.querySelector('#f-contact').value.trim(),
    mobile:  form.querySelector('#f-mobile').value.trim(),
    email:   form.querySelector('#f-email').value.trim(),
    gst:     form.querySelector('#f-gst').value.trim().toUpperCase(),
    address: form.querySelector('#f-address').value.trim(),
    city:    form.querySelector('#f-city').value.trim(),
    state:   form.querySelector('#f-state').value,
    status:  form.querySelector('#f-status').value,
  };

  // ── Validation ──
  const errors = [];
  if (!data.code)    errors.push('Customer Code is required.');
  if (!data.name)    errors.push('Customer Name is required.');
  if (!data.contact) errors.push('Contact Person is required.');
  if (!data.mobile || !/^\d{10}$/.test(data.mobile)) errors.push('Valid 10-digit mobile number is required.');
  if (!data.city)    errors.push('City is required.');
  if (!data.state)   errors.push('State is required.');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Enter a valid email address.');

  if (errors.length > 0) {
    errorEl.innerHTML = '⚠️ ' + errors.join('<br>⚠️ ');
    errorEl.style.display = 'flex';
    return;
  }

  errorEl.style.display = 'none';

  if (existing) {
    // ── Edit existing ──
    const idx = customers.findIndex(c => c.id === existing.id);
    if (idx > -1) {
      customers[idx] = { ...customers[idx], ...data };
      showToast(`Customer "${data.name}" updated successfully.`, 'success');
    }
  } else {
    // ── Add new ──
    const newCustomer = {
      id:        getNextCustomerId(),
      createdAt: new Date().toISOString().split('T')[0],
      ...data,
    };
    customers.push(newCustomer);
    showToast(`Customer "${data.name}" added successfully.`, 'success');
  }

  closeModal('customer-modal');
  renderRows();
}

/** Returns 2-letter initials from a name string */
function getInitials(name) {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Exports customers list as CSV download */
function exportCustomersCSV() {
  const headers = ['Code', 'Name', 'Contact', 'Mobile', 'Email', 'GST', 'City', 'State', 'Status'];
  const rows = customers.map(c => [
    c.code, c.name, c.contact, c.mobile, c.email, c.gst, c.city, c.state, c.status,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'customers.csv';
  a.click();
  URL.revokeObjectURL(url);

  showToast('Customers exported to CSV.', 'success');
}
