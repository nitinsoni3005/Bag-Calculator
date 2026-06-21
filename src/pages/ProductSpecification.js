/**
 * ProductSpecification.js — Product Specification entry + live calculation
 * Two-panel layout: Left = dynamic form, Right = live result card
 * Satyendra Packaging ERP — Phase 2
 */

import { specifications, getNextSpecId, getNextSpecNumber, SPEC_STATUSES } from '../data/specifications.js';
import { customers } from '../data/customers.js';
import { salesOrders } from '../data/salesOrders.js';
import { escapeHtml } from '../components/Table.js';
import { openModal, closeModal, confirmDialog } from '../components/Modal.js';
import { showToast } from '../js/app.js';
import {
  calcBOPPBagSpec,
  calcPPBagSpec,
  calcFIBCSpec,
  calcBagArea,
  formatGrams,
  formatKg,
  inchToCm,
} from '../services/calculations.js';

/** Active form type */
let _activeType = 'BOPP Bag';

/** Live result state */
let _lastResult = null;

/** View: 'list' | 'form' */
let _view = 'list';

/** Currently editing spec (null = new) */
let _editingSpec = null;

/** Debounce timer */
let _calcTimer = null;

/** Product types with icons */
const SPEC_TYPES = [
  { id: 'BOPP Bag',     icon: '🎨', label: 'BOPP Bag' },
  { id: 'PP Woven Bag', icon: '🧵', label: 'PP Woven' },
  { id: 'Shopping Bag', icon: '🛍️', label: 'Shopping' },
  { id: 'FIBC',         icon: '🏗️', label: 'FIBC Bag' },
];

/**
 * Entry point — renders the Product Specification page.
 * @param {HTMLElement} container
 */
export function renderProductSpecification(container) {
  container.innerHTML = '';
  _view = 'list';

  // ── Page Header ──
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div>
      <h1 class="page-title">Product Specification</h1>
      <p class="page-subtitle">Define bag specifications with live material calculation</p>
    </div>
    <button class="btn btn-primary" id="btn-new-spec">
      <span>+</span> New Specification
    </button>
  `;
  container.appendChild(header);

  // ── Spec List ──
  renderSpecList(container);

  container.querySelector('#btn-new-spec').addEventListener('click', () => {
    _editingSpec = null;
    _view = 'form';
    renderSpecForm(container);
  });
}

// ─────────────────────────────────────────────────────────────
// SPEC LIST VIEW
// ─────────────────────────────────────────────────────────────

function renderSpecList(container) {
  const listWrap = document.createElement('div');
  listWrap.id = 'spec-list-wrap';

  // Summary row
  listWrap.innerHTML = `
    <div class="so-summary-strip" style="grid-template-columns:repeat(4,1fr);margin-bottom:var(--space-5);">
      ${summaryCard('📋', 'Total Specs', specifications.length, '')}
      ${summaryCard('✅', 'Approved',    specifications.filter(s=>s.status==='Approved').length, '')}
      ${summaryCard('📝', 'Draft',       specifications.filter(s=>s.status==='Draft').length, '')}
      ${summaryCard('🔄', 'Revised',     specifications.filter(s=>s.status==='Revised').length, '')}
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';
  wrapper.innerHTML = `
    <div class="table-header">
      <div>
        <span class="table-title">All Specifications</span>
        <span class="table-count">${specifications.length}</span>
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
        <th style="padding-left:var(--space-5)">Spec #</th>
        <th>Product</th>
        <th>Type</th>
        <th>Dimensions</th>
        <th>Bag Weight</th>
        <th>Quantity</th>
        <th>SO Ref</th>
        <th>Status</th>
        <th style="text-align:center">Actions</th>
      </tr>
    </thead>
    <tbody id="spec-tbody"></tbody>
  `;

  const tbody = table.querySelector('#spec-tbody');

  if (specifications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">No specifications yet</div>
        <div class="empty-state-desc">Click "New Specification" to create your first spec.</div>
      </div>
    </td></tr>`;
  } else {
    specifications.forEach(spec => {
      const tr = document.createElement('tr');
      const statusCls = `spec-status-${spec.status?.toLowerCase() || 'draft'}`;
      tr.innerHTML = `
        <td style="padding-left:var(--space-5)">
          <span style="font-weight:600;font-family:monospace;color:var(--color-accent);">${escapeHtml(spec.specNumber)}</span><br>
          <span style="font-size:0.7rem;color:var(--color-text-muted);">${escapeHtml(spec.createdAt || '')}</span>
        </td>
        <td>
          <div style="font-weight:500;font-size:0.82rem;">${escapeHtml(truncate(spec.productName,30))}</div>
          <div style="font-family:monospace;font-size:0.7rem;color:var(--color-text-muted);">${escapeHtml(spec.productCode||'')}</div>
        </td>
        <td><span class="badge badge-info" style="font-size:0.7rem;">${escapeHtml(spec.productType)}</span></td>
        <td style="font-family:monospace;font-size:0.8rem;">${spec.widthCm || 0} × ${spec.lengthCm || 0} cm</td>
        <td style="font-weight:600;">${spec.calcResults?.totalBagWt ? spec.calcResults.totalBagWt + ' g' : '—'}</td>
        <td>${(spec.quantity || 0).toLocaleString()} PCS</td>
        <td style="font-family:monospace;font-size:0.75rem;">${escapeHtml(spec.soRef || '—')}</td>
        <td><span class="badge ${statusCls}">${escapeHtml(spec.status || 'Draft')}</span></td>
        <td style="text-align:center">
          <div class="action-btns">
            <button class="btn-icon-only btn-edit"   data-action="edit"   data-id="${spec.id}" title="Edit/View">✏️</button>
            <button class="btn-icon-only" style="border-color:#BFDBFE;color:var(--color-accent);" data-action="print" data-id="${spec.id}" title="Print">🖨️</button>
            <button class="btn-icon-only btn-delete" data-action="delete" data-id="${spec.id}" title="Delete">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  scroll.appendChild(table);
  wrapper.appendChild(scroll);
  listWrap.appendChild(wrapper);
  container.appendChild(listWrap);

  // Actions delegation
  table.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = parseInt(btn.getAttribute('data-id'), 10);
    const spec = specifications.find(s => s.id === id);
    if (!spec) return;

    if (action === 'edit') {
      _editingSpec = spec;
      _activeType  = spec.productType;
      _view = 'form';
      renderSpecForm(container);
    }
    if (action === 'print') printSpecSheet(spec);
    if (action === 'delete') {
      const ok = await confirmDialog(`Delete specification <strong>${spec.specNumber}</strong>?`, 'Delete Spec');
      if (ok) {
        specifications.splice(specifications.indexOf(spec), 1);
        container.innerHTML = '';
        renderProductSpecification(container);
        showToast(`Spec ${spec.specNumber} deleted.`, 'success');
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────
// SPEC FORM VIEW (Two-panel)
// ─────────────────────────────────────────────────────────────

function renderSpecForm(container) {
  container.innerHTML = '';
  const isEdit = !!_editingSpec;

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-3);">
      <button class="btn btn-secondary btn-sm" id="btn-back-to-list">← Back</button>
      <div>
        <h1 class="page-title">${isEdit ? 'Edit Specification' : 'New Specification'}</h1>
        <p class="page-subtitle">Live calculation updates as you type</p>
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);">
      <button class="btn btn-secondary" id="btn-reset-spec">🔄 Reset</button>
      <button class="btn btn-success"   id="btn-save-spec">💾 Save Specification</button>
    </div>
  `;
  container.appendChild(header);

  // ── Two-panel layout ──
  const layout = document.createElement('div');
  layout.className = 'spec-layout';

  // Left: form panel
  const formPanel = document.createElement('div');
  formPanel.className = 'spec-form-panel';
  formPanel.id = 'spec-form-panel';

  // Right: result panel
  const resultPanel = document.createElement('div');
  resultPanel.className = 'spec-result-panel';
  resultPanel.id = 'spec-result-panel';

  layout.appendChild(formPanel);
  layout.appendChild(resultPanel);
  container.appendChild(layout);

  // Build form panel
  renderFormPanel(formPanel, _editingSpec);

  // Build result panel (empty state first)
  renderResultPanel(resultPanel, null);

  // Back button
  container.querySelector('#btn-back-to-list').addEventListener('click', () => {
    container.innerHTML = '';
    renderProductSpecification(container);
  });

  // Reset
  container.querySelector('#btn-reset-spec').addEventListener('click', () => {
    renderFormPanel(formPanel, null);
    renderResultPanel(resultPanel, null);
    showToast('Form reset.', 'info');
  });

  // Save
  container.querySelector('#btn-save-spec').addEventListener('click', () => {
    saveSpec(container, formPanel, resultPanel);
  });

  // Run initial calculation if editing
  if (_editingSpec) {
    triggerCalc(formPanel, resultPanel);
  }
}

/** Builds the left form panel */
function renderFormPanel(panel, existing) {
  panel.innerHTML = `
    <div class="spec-form-header">
      <div>
        <div class="spec-form-header-title">Bag Specification Entry</div>
        <div class="spec-form-header-sub">Select product type → fill dimensions → results update live</div>
      </div>
      <span class="badge ${existing ? 'badge-info' : 'badge-gray'}">${existing ? existing.specNumber : 'NEW'}</span>
    </div>

    <!-- Product type tabs -->
    <div class="spec-type-tabs" id="spec-type-tabs">
      ${SPEC_TYPES.map(t => `
        <button class="spec-type-tab ${_activeType === t.id ? 'active' : ''}" data-type="${t.id}">
          <span class="spec-tab-icon">${t.icon}</span>${t.label}
        </button>
      `).join('')}
    </div>

    <!-- Dynamic form body -->
    <div class="spec-form-body" id="spec-form-body">
    </div>
  `;

  // Render dynamic fields for current type
  renderDynamicFields(panel.querySelector('#spec-form-body'), _activeType, existing);

  // Type tab switching
  panel.querySelector('#spec-type-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-type]');
    if (!tab) return;
    _activeType = tab.getAttribute('data-type');
    panel.querySelectorAll('.spec-type-tab').forEach(t =>
      t.classList.toggle('active', t.getAttribute('data-type') === _activeType)
    );
    renderDynamicFields(panel.querySelector('#spec-form-body'), _activeType, null);
    // Reset result
    renderResultPanel(document.getElementById('spec-result-panel'), null);
  });
}

/** Renders dynamic form fields based on product type */
function renderDynamicFields(body, type, existing) {
  const ex = existing || {};

  const soOptions = salesOrders.map(s =>
    `<option value="${escapeHtml(s.soNumber)}" ${ex.soRef === s.soNumber ? 'selected' : ''}>
      ${escapeHtml(s.soNumber)} — ${escapeHtml(truncate(s.customerName, 28))}
    </option>`
  ).join('');

  // Common header fields
  const commonHeader = `
    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">📄</span> General Information</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">Spec Number</label>
          <input class="form-control" id="sp-specnum" type="text"
            value="${escapeHtml(ex.specNumber || getNextSpecNumber())}" readonly style="background:var(--color-bg);" />
        </div>
        <div class="form-group">
          <label class="form-label">Product Code</label>
          <input class="form-control" id="sp-prodcode" type="text"
            value="${escapeHtml(ex.productCode || '')}" placeholder="FGS0XXXXX" />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="sp-status">
            ${SPEC_STATUSES.map(s => `<option value="${s}" ${(ex.status||'Draft')===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group span-3">
          <label class="form-label">Product Name <span class="required">*</span></label>
          <input class="form-control" id="sp-prodname" type="text"
            value="${escapeHtml(ex.productName || '')}" placeholder="e.g. BLUE ROSE STEAM RICE 10 KG" required />
        </div>
        <div class="form-group span-2">
          <label class="form-label">SO Reference</label>
          <select class="form-control" id="sp-soref">
            <option value="">-- Link to Sales Order (optional) --</option>
            ${soOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Customer</label>
          <input class="form-control" id="sp-customer" type="text"
            value="${escapeHtml(ex.customerName || '')}" placeholder="Customer name" />
        </div>
        <div class="form-group">
          <label class="form-label">Quantity <span class="required">*</span></label>
          <input class="form-control calc-trigger" id="sp-qty" type="number" min="1"
            value="${ex.quantity || ''}" placeholder="No. of bags" />
        </div>
      </div>
    </div>
  `;

  let specificFields = '';

  if (type === 'BOPP Bag') {
    specificFields = buildBOPPFields(ex);
  } else if (type === 'PP Woven Bag') {
    specificFields = buildPPFields(ex);
  } else if (type === 'Shopping Bag') {
    specificFields = buildShoppingFields(ex);
  } else if (type === 'FIBC') {
    specificFields = buildFIBCFields(ex);
  }

  body.innerHTML = commonHeader + specificFields + `
    <div id="sp-validation-error" class="alert alert-error" style="display:none;margin:0 0 var(--space-4);"></div>
  `;

  // Attach live calc triggers to all .calc-trigger inputs in this panel
  body.querySelectorAll('.calc-trigger').forEach(input => {
    input.addEventListener('input', () => debounceCalc(
      document.getElementById('spec-form-panel'),
      document.getElementById('spec-result-panel')
    ));
  });
}

function buildBOPPFields(ex) {
  return `
    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">📐</span> Bag Dimensions</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">Width (cm) <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-width" type="number" step="0.1" min="0"
              value="${ex.widthCm || ''}" placeholder="e.g. 86.2" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Length (cm) <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-length" type="number" step="0.1" min="0"
              value="${ex.lengthCm || ''}" placeholder="e.g. 56.0" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Gusset (cm)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-gusset" type="number" step="0.1" min="0"
              value="${ex.gussetCm || 0}" placeholder="0 if none" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
      </div>
    </div>

    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">🧵</span> Fabric Details</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">Fabric GSM <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-fgsm" type="number" step="0.1" min="0"
              value="${ex.fabricGsm || ''}" placeholder="e.g. 22.2" />
            <span class="input-unit-suffix">g/m²</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Mesh (Wrap)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-mesh-w" type="number" step="0.5" min="0"
              value="${ex.meshWrap || 9.5}" />
            <span class="input-unit-suffix">/cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Mesh (Weft)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-mesh-f" type="number" step="0.5" min="0"
              value="${ex.meshWeft || 9.5}" />
            <span class="input-unit-suffix">/cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Fabric Color</label>
          <select class="form-control" id="sp-fcolor">
            ${['NATURAL','MILKY WHITE','BEIGE','BROWN','BLUE','GREEN','RED','ORANGE','MULTI COLOR']
              .map(c => `<option ${(ex.fabricColor||'NATURAL')===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Handle Weight (g)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-handle" type="number" step="0.5" min="0"
              value="${ex.handle ? (ex.handleWeight || 5) : 0}" placeholder="0 = no handle" />
            <span class="input-unit-suffix">g</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Thread Weight (g)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-thread" type="number" step="0.1" min="0"
              value="${ex.threadWeight || 2}" />
            <span class="input-unit-suffix">g</span>
          </div>
        </div>
      </div>
    </div>

    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">🎨</span> BOPP Film Details</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">BOPP Micron <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-bopp-mic" type="number" step="1" min="0"
              value="${ex.boppMicron || 15}" />
            <span class="input-unit-suffix">μm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">BOPP Width (cm)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-bopp-w" type="number" step="1" min="0"
              value="${ex.boppWidth || 80}" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Print Sides</label>
          <select class="form-control calc-trigger" id="sp-bopp-sides">
            <option value="1" ${(ex.boppSides||1)===1?'selected':''}>Single Side</option>
            <option value="2" ${(ex.boppSides||1)===2?'selected':''}>Both Sides</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">No. of Colors</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-colors" type="number" step="1" min="0" max="10"
              value="${ex.noOfColors || 6}" />
            <span class="input-unit-suffix">clr</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">BOPP Type</label>
          <select class="form-control" id="sp-bopp-type">
            ${['MATT FINISH','GLOSS FINISH','METALISED'].map(t =>
              `<option ${(ex.boppType||'MATT FINISH')===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="display:flex;align-items:flex-end;">
          <label class="spec-toggle-row">
            <label class="toggle-switch">
              <input type="checkbox" id="sp-cylinder" ${ex.hasCylinder?'checked':''}>
              <span class="toggle-slider"></span>
            </label>
            Cylinder Available
          </label>
        </div>
      </div>
    </div>

    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">✨</span> Lamination & Metalize</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">Lami Micron</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-lami-mic" type="number" step="1" min="0"
              value="${ex.lamiMicron || 20}" placeholder="0 = no lami" />
            <span class="input-unit-suffix">μm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Lami Sides</label>
          <select class="form-control calc-trigger" id="sp-lami-sides">
            <option value="1" ${(ex.lamiSides||1)===1?'selected':''}>1 Side</option>
            <option value="2" ${(ex.lamiSides||1)===2?'selected':''}>Both Sides</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Metalize Micron</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-meta-mic" type="number" step="1" min="0"
              value="${ex.metalizeMicron || 15}" placeholder="0 = none" />
            <span class="input-unit-suffix">μm</span>
          </div>
        </div>
      </div>
    </div>

    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">📦</span> Liner Details</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">Liner Micron</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-liner-mic" type="number" step="1" min="0"
              value="${ex.linerMicron || 0}" placeholder="0 = no liner" />
            <span class="input-unit-suffix">μm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Liner Width (cm)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-liner-w" type="number" step="0.1" min="0"
              value="${ex.linerWidthCm || 0}" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Liner Length (cm)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-liner-l" type="number" step="0.1" min="0"
              value="${ex.linerLengthCm || 0}" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildPPFields(ex) {
  return `
    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">📐</span> Bag Dimensions</div>
      <div class="spec-grid-2">
        <div class="form-group">
          <label class="form-label">Width (cm) <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-width" type="number" step="0.1" min="0"
              value="${ex.widthCm || ''}" placeholder="e.g. 61" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Length (cm) <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-length" type="number" step="0.1" min="0"
              value="${ex.lengthCm || ''}" placeholder="e.g. 100" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
      </div>
    </div>
    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">🧵</span> Fabric Details</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">Fabric GSM <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-fgsm" type="number" step="0.1" min="0"
              value="${ex.fabricGsm || ''}" placeholder="e.g. 65" />
            <span class="input-unit-suffix">g/m²</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Mesh (Wrap)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-mesh-w" type="number" step="0.5" value="${ex.meshWrap || 9.5}" />
            <span class="input-unit-suffix">/cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Mesh (Weft)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-mesh-f" type="number" step="0.5" value="${ex.meshWeft || 9.5}" />
            <span class="input-unit-suffix">/cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Printing Colors</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-colors" type="number" step="1" min="0" max="8"
              value="${ex.noOfColors || 0}" placeholder="0 = no print" />
            <span class="input-unit-suffix">clr</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Thread Weight (g)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-thread" type="number" step="0.1" min="0" value="${ex.threadWeight || 2}" />
            <span class="input-unit-suffix">g</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildShoppingFields(ex) {
  return `
    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">📐</span> Bag Dimensions</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">Width (cm) <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-width" type="number" step="0.1" min="0" value="${ex.widthCm||''}" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Length (cm) <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-length" type="number" step="0.1" min="0" value="${ex.lengthCm||''}" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Handle Type</label>
          <select class="form-control" id="sp-handle-type">
            ${['Cross Handle','Loop Handle','D-Cut','Rope Handle','No Handle']
              .map(h=>`<option>${h}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">🧵</span> Material Details</div>
      <div class="spec-grid-2">
        <div class="form-group">
          <label class="form-label">Fabric GSM <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-fgsm" type="number" step="0.1" min="0" value="${ex.fabricGsm||''}" />
            <span class="input-unit-suffix">g/m²</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Printing Colors</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-colors" type="number" step="1" min="0" max="10" value="${ex.noOfColors||0}" />
            <span class="input-unit-suffix">clr</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildFIBCFields(ex) {
  return `
    <div class="spec-section">
      <div class="spec-section-title"><span class="spec-section-icon">📐</span> FIBC Dimensions</div>
      <div class="spec-grid">
        <div class="form-group">
          <label class="form-label">Width (cm) <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-width" type="number" step="1" min="0" value="${ex.widthCm||90}" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Height (cm) <span class="required">*</span></label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-length" type="number" step="1" min="0" value="${ex.heightCm||140}" />
            <span class="input-unit-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Fabric GSM</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-fgsm" type="number" step="1" min="0" value="${ex.fabricGsm||200}" />
            <span class="input-unit-suffix">g/m²</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Capacity (KG)</label>
          <div class="input-with-unit">
            <input class="form-control calc-trigger" id="sp-capacity" type="number" step="50" min="0" value="${ex.capacity||1000}" />
            <span class="input-unit-suffix">kg</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Safety Factor (SF)</label>
          <select class="form-control calc-trigger" id="sp-sf">
            ${[5,6,8,10].map(n=>`<option value="${n}" ${(ex.sf||5)===n?'selected':''}>${n}:1</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Loop Type</label>
          <select class="form-control" id="sp-loop">
            ${['Cross Corner','Top & Bottom','Duffle Top','Skirt Bottom'].map(l=>`<option>${l}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// LIVE CALCULATION
// ─────────────────────────────────────────────────────────────

/** Debounced calculation trigger */
function debounceCalc(formPanel, resultPanel) {
  clearTimeout(_calcTimer);
  _calcTimer = setTimeout(() => triggerCalc(formPanel, resultPanel), 250);
}

/** Read form values → run calc engine → update result panel */
function triggerCalc(formPanel, resultPanel) {
  if (!formPanel) return;
  const get     = id => parseFloat(formPanel.querySelector(`#${id}`)?.value) || 0;
  const getInt  = id => parseInt(formPanel.querySelector(`#${id}`)?.value)   || 0;
  const getStr  = id => formPanel.querySelector(`#${id}`)?.value || '';

  let result = null;

  if (_activeType === 'BOPP Bag') {
    result = calcBOPPBagSpec({
      widthCm:           get('sp-width'),
      lengthCm:          get('sp-length'),
      gussetCm:          get('sp-gusset'),
      fabricGsm:         get('sp-fgsm'),
      boppMicron:        get('sp-bopp-mic'),
      boppWidthCm:       get('sp-bopp-w'),
      boppSides:         getInt('sp-bopp-sides'),
      lamiMicron:        get('sp-lami-mic'),
      lamiSides:         getInt('sp-lami-sides'),
      metalizeMicron:    get('sp-meta-mic'),
      noOfColors:        getInt('sp-colors'),
      threadWeightGrams: get('sp-thread'),
      linerWidthCm:      get('sp-liner-w'),
      linerLengthCm:     get('sp-liner-l'),
      linerMicron:       get('sp-liner-mic'),
      handleWeightGrams: get('sp-handle'),
      quantity:          getInt('sp-qty'),
    });
  } else if (_activeType === 'PP Woven Bag') {
    result = calcPPBagSpec({
      widthCm:           get('sp-width'),
      lengthCm:          get('sp-length'),
      fabricGsm:         get('sp-fgsm'),
      noOfColors:        getInt('sp-colors'),
      threadWeightGrams: get('sp-thread'),
      quantity:          getInt('sp-qty'),
    });
  } else if (_activeType === 'Shopping Bag') {
    result = calcPPBagSpec({
      widthCm:    get('sp-width'),
      lengthCm:   get('sp-length'),
      fabricGsm:  get('sp-fgsm'),
      noOfColors: getInt('sp-colors'),
      quantity:   getInt('sp-qty'),
    });
  } else if (_activeType === 'FIBC') {
    result = calcFIBCSpec({
      widthCm:   get('sp-width'),
      heightCm:  get('sp-length'),
      fabricGsm: get('sp-fgsm'),
      capacity:  get('sp-capacity'),
      sf:        getInt('sp-sf'),
      quantity:  getInt('sp-qty'),
    });
  }

  _lastResult = result;
  renderResultPanel(resultPanel, result);
}

// ─────────────────────────────────────────────────────────────
// RESULT PANEL
// ─────────────────────────────────────────────────────────────

function renderResultPanel(panel, result) {
  if (!panel) return;
  panel.innerHTML = '';

  // ── Total weight display ──
  const totalDisplay = document.createElement('div');
  totalDisplay.className = 'result-card';
  const totalBagWt = result?.totalBagWt || 0;
  const totalOrderKg = result?.totalOrderWtKg || 0;

  totalDisplay.innerHTML = `
    <div class="result-card-header">
      <span class="result-card-title">⚡ Live Calculation Results</span>
      <div class="result-card-live-dot" title="Updates live"></div>
    </div>
    <div class="result-card-body">
      <div class="result-total-weight">
        <div class="result-total-label">Total Bag Weight</div>
        <div class="result-total-value">${totalBagWt > 0 ? totalBagWt.toFixed(2) : '—'}</div>
        <div class="result-total-unit">${totalBagWt > 0 ? 'GRAMS PER BAG' : 'Enter dimensions to calculate'}</div>
      </div>
      <div class="order-total-grid">
        ${orderTotalBox('Total Order Wt', totalOrderKg > 0 ? `${totalOrderKg.toFixed(1)} KG` : '—')}
        ${orderTotalBox('Fabric (Gross)', result?.fabricGrossKg > 0 ? `${result.fabricGrossKg} KG` : '—')}
        ${orderTotalBox('BOPP Film', result?.boppGrossKg > 0 ? `${result.boppGrossKg} KG` : '—')}
        ${orderTotalBox('BOPP Metres', result?.boppGrossMetres > 0 ? `${result.boppGrossMetres.toLocaleString()} m` : '—')}
      </div>
    </div>
  `;
  panel.appendChild(totalDisplay);

  // ── Component breakdown ──
  const breakdown = document.createElement('div');
  breakdown.className = 'result-card';

  const components = buildComponentRows(result);

  breakdown.innerHTML = `
    <div class="result-card-header" style="background: linear-gradient(135deg, #1E293B 0%, #334155 100%);">
      <span class="result-card-title">📊 Weight Breakdown</span>
    </div>
    <div class="result-card-body" style="padding:0;">
      ${components.map(c => {
        const pct = totalBagWt > 0 ? (c.value / totalBagWt) * 100 : 0;
        return `
          <div class="result-row" style="padding: var(--space-3) var(--space-5);">
            <span class="result-row-label">
              <span class="result-row-dot" style="background:${c.color};"></span>
              ${c.label}
            </span>
            <span class="result-row-value">${c.value > 0 ? c.value.toFixed(2) + ' g' : '—'}</span>
          </div>
          ${c.value > 0 ? `
            <div style="padding: 0 var(--space-5) var(--space-2);">
              <div style="height:3px;background:var(--color-border);border-radius:2px;">
                <div style="height:100%;width:${Math.min(pct, 100).toFixed(1)}%;background:${c.color};border-radius:2px;transition:width 0.4s;"></div>
              </div>
            </div>` : ''}
        `;
      }).join('')}
    </div>
  `;

  panel.appendChild(breakdown);

  // ── Fabric GPM info ──
  if (result?.fabricGpm > 0) {
    const info = document.createElement('div');
    info.className = 'result-card';
    info.innerHTML = `
      <div class="result-card-header" style="background:linear-gradient(135deg,#064E3B,#065F46);">
        <span class="result-card-title">📏 Fabric GPM Info</span>
      </div>
      <div class="result-card-body" style="padding:var(--space-4) var(--space-5);">
        <div class="order-total-grid">
          ${orderTotalBox('Fabric GPM', `${result.fabricGpm} g/m`)}
          ${orderTotalBox('Fabric Area', result.bagArea > 0 ? `${result.bagArea} m²` : '—')}
          ${result.boppGpm > 0 ? orderTotalBox('BOPP GPM', `${result.boppGpm} g/m`) : ''}
          ${result.boppArea > 0 ? orderTotalBox('BOPP Area', `${result.boppArea} m²`) : ''}
        </div>
      </div>
    `;
    panel.appendChild(info);
  }
}

function buildComponentRows(r) {
  if (!r) return [];
  const rows = [
    { label: '🧵 Fabric',     value: r.fabricWt    || 0, color: '#2563EB' },
    { label: '🎨 BOPP Film',  value: r.boppWt      || 0, color: '#7C3AED' },
    { label: '✨ Lamination', value: r.lamiWt      || 0, color: '#059669' },
    { label: '🔮 Metalize',   value: r.metalizeWt  || 0, color: '#0891B2' },
    { label: '💧 Adhesive',   value: r.adhesiveWt  || 0, color: '#6366F1' },
    { label: '🖨️ Ink',        value: r.inkWt       || 0, color: '#F59E0B' },
    { label: '🪡 Thread',     value: r.threadWt    || 0, color: '#EC4899' },
    { label: '📦 Liner',      value: r.linerWt     || 0, color: '#10B981' },
    { label: '👜 Handle',     value: r.handleWt    || 0, color: '#EF4444' },
  ];
  return rows.filter(r => r.value > 0);
}

function orderTotalBox(label, value) {
  return `
    <div class="order-total-item">
      <div class="order-total-item-label">${label}</div>
      <div class="order-total-item-value">${value}</div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// SAVE SPEC
// ─────────────────────────────────────────────────────────────

function saveSpec(container, formPanel, resultPanel) {
  const get    = id => formPanel.querySelector(`#${id}`)?.value?.trim() || '';
  const getNum = id => parseFloat(formPanel.querySelector(`#${id}`)?.value) || 0;
  const getInt = id => parseInt(formPanel.querySelector(`#${id}`)?.value)  || 0;

  const errors = [];
  if (!get('sp-prodname')) errors.push('Product Name is required.');
  if (!getNum('sp-qty') || getNum('sp-qty') < 1) errors.push('Quantity must be > 0.');

  const errEl = formPanel.querySelector('#sp-validation-error');
  if (errors.length) {
    if (errEl) { errEl.innerHTML = '⚠️ ' + errors.join('<br>⚠️ '); errEl.style.display = 'flex'; }
    return;
  }
  if (errEl) errEl.style.display = 'none';

  const spec = {
    id:          _editingSpec ? _editingSpec.id : getNextSpecId(),
    specNumber:  get('sp-specnum') || getNextSpecNumber(),
    productCode: get('sp-prodcode'),
    productName: get('sp-prodname'),
    productType: _activeType,
    soRef:       get('sp-soref'),
    customerName: get('sp-customer'),
    widthCm:     getNum('sp-width'),
    lengthCm:    getNum('sp-length'),
    gussetCm:    getNum('sp-gusset'),
    fabricGsm:   getNum('sp-fgsm'),
    meshWrap:    getNum('sp-mesh-w'),
    meshWeft:    getNum('sp-mesh-f'),
    fabricColor: get('sp-fcolor'),
    boppMicron:  getNum('sp-bopp-mic'),
    boppWidth:   getNum('sp-bopp-w'),
    boppType:    get('sp-bopp-type'),
    boppSides:   getInt('sp-bopp-sides'),
    noOfColors:  getInt('sp-colors'),
    hasCylinder: formPanel.querySelector('#sp-cylinder')?.checked || false,
    lamiMicron:  getNum('sp-lami-mic'),
    lamiSides:   getInt('sp-lami-sides'),
    metalizeMicron: getNum('sp-meta-mic'),
    linerMicron: getNum('sp-liner-mic'),
    linerWidthCm:  getNum('sp-liner-w'),
    linerLengthCm: getNum('sp-liner-l'),
    handleWeight:  getNum('sp-handle'),
    threadWeight:  getNum('sp-thread'),
    capacity:    getNum('sp-capacity'),
    sf:          getInt('sp-sf'),
    quantity:    getInt('sp-qty'),
    status:      get('sp-status') || 'Draft',
    calcResults: _lastResult || {},
    createdAt:   _editingSpec?.createdAt || new Date().toISOString().split('T')[0],
    createdBy:   'Nitin Soni',
  };

  if (_editingSpec) {
    const idx = specifications.findIndex(s => s.id === _editingSpec.id);
    if (idx > -1) specifications[idx] = spec;
    showToast(`Specification ${spec.specNumber} updated.`, 'success');
  } else {
    specifications.push(spec);
    showToast(`Specification ${spec.specNumber} saved.`, 'success');
  }

  container.innerHTML = '';
  renderProductSpecification(container);
}

// ─────────────────────────────────────────────────────────────
// PRINT SPEC SHEET
// ─────────────────────────────────────────────────────────────

function printSpecSheet(spec) {
  const cr = spec.calcResults || {};
  const win = window.open('', '_blank', 'width=800,height=900');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Spec Sheet — ${spec.specNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 20px; }
      h1 { font-size: 18px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; }
      h2 { font-size: 13px; background: #0F172A; color: white; padding: 4px 8px; margin: 12px 0 6px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
      td, th { border: 1px solid #ccc; padding: 5px 8px; font-size: 11px; }
      th { background: #F1F5F9; font-weight: 600; width: 40%; }
      .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .result-box { background: #F0FDF4; border: 2px solid #10B981; border-radius: 6px; padding: 10px; text-align: center; margin: 10px 0; }
      .result-big { font-size: 28px; font-weight: 900; color: #059669; }
    </style></head><body>
    <h1>🏭 Satyendra Packaging Limited — Product Specification Sheet</h1>
    <div class="header-grid">
      <table>
        <tr><th>Spec Number</th><td>${spec.specNumber}</td></tr>
        <tr><th>Product Code</th><td>${spec.productCode||'—'}</td></tr>
        <tr><th>Product Name</th><td><strong>${spec.productName}</strong></td></tr>
        <tr><th>Product Type</th><td>${spec.productType}</td></tr>
        <tr><th>SO Reference</th><td>${spec.soRef||'—'}</td></tr>
        <tr><th>Customer</th><td>${spec.customerName||'—'}</td></tr>
      </table>
      <table>
        <tr><th>Date</th><td>${spec.createdAt}</td></tr>
        <tr><th>Status</th><td>${spec.status}</td></tr>
        <tr><th>Quantity</th><td><strong>${(spec.quantity||0).toLocaleString()} PCS</strong></td></tr>
        <tr><th>Created By</th><td>${spec.createdBy||'—'}</td></tr>
      </table>
    </div>
    <h2>📐 Dimensions</h2>
    <table>
      <tr><th>Width</th><td>${spec.widthCm||0} cm</td><th>Length</th><td>${spec.lengthCm||0} cm</td></tr>
      <tr><th>Gusset</th><td>${spec.gussetCm||0} cm</td><th>Fabric GSM</th><td>${spec.fabricGsm||0} g/m²</td></tr>
      <tr><th>Mesh (Wrap×Weft)</th><td>${spec.meshWrap||0} × ${spec.meshWeft||0}</td><th>Fabric Color</th><td>${spec.fabricColor||'—'}</td></tr>
    </table>
    <h2>🎨 BOPP Film Details</h2>
    <table>
      <tr><th>BOPP Micron</th><td>${spec.boppMicron||0} μm</td><th>BOPP Width</th><td>${spec.boppWidth||0} cm</td></tr>
      <tr><th>Print Sides</th><td>${spec.boppSides===2?'Both Sides':'Single Side'}</td><th>No. of Colors</th><td>${spec.noOfColors||0}</td></tr>
      <tr><th>BOPP Type</th><td>${spec.boppType||'—'}</td><th>Cylinder</th><td>${spec.hasCylinder?'Yes':'No'}</td></tr>
    </table>
    <h2>✨ Lamination</h2>
    <table>
      <tr><th>Lami Micron</th><td>${spec.lamiMicron||0} μm</td><th>Lami Sides</th><td>${spec.lamiSides===2?'Both':'1 Side'}</td></tr>
      <tr><th>Metalize Micron</th><td>${spec.metalizeMicron||0} μm</td><th>Liner Micron</th><td>${spec.linerMicron||0} μm</td></tr>
    </table>
    <div class="result-box">
      <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">TOTAL BAG WEIGHT</div>
      <div class="result-big">${cr.totalBagWt||0} g</div>
      <div style="font-size:11px;color:#666;">Per Bag</div>
    </div>
    <h2>📊 Material Calculation Results</h2>
    <table>
      <tr><th>Fabric Weight/Bag</th><td>${cr.fabricWt||0} g</td><th>BOPP Weight/Bag</th><td>${cr.boppWt||0} g</td></tr>
      <tr><th>Lamination Weight/Bag</th><td>${cr.lamiWt||0} g</td><th>Metalize Weight/Bag</th><td>${cr.metalizeWt||0} g</td></tr>
      <tr><th>Ink Weight/Bag</th><td>${cr.inkWt||0} g</td><th>Thread Weight/Bag</th><td>${cr.threadWt||0} g</td></tr>
      <tr><th>Liner Weight/Bag</th><td>${cr.linerWt||0} g</td><th>Handle Weight/Bag</th><td>${cr.handleWt||0} g</td></tr>
      <tr><th><strong>Total Bag Weight</strong></th><td><strong>${cr.totalBagWt||0} g</strong></td><th>Total Order Weight</th><td><strong>${cr.totalOrderWtKg||0} KG</strong></td></tr>
      <tr><th>Fabric (Net KG)</th><td>${cr.fabricNetKg||0} KG</td><th>Fabric (Gross KG)</th><td>${cr.fabricGrossKg||0} KG</td></tr>
      <tr><th>BOPP Film (KG)</th><td>${cr.boppGrossKg||0} KG</td><th>BOPP Film (Metres)</th><td>${cr.boppGrossMetres||0} m</td></tr>
    </table>
    <p style="text-align:center;font-size:10px;color:#999;margin-top:20px;">
      Printed: ${new Date().toLocaleString('en-IN')} | Satyendra Packaging Limited, Anand, Gujarat
    </p>
    <script>window.print();<\/script>
    </body></html>
  `);
  win.document.close();
}

// helpers
function summaryCard(icon, label, value, sub) {
  return `
    <div class="so-summary-card">
      <div style="font-size:1.3rem;">${icon}</div>
      <div class="so-summary-value">${value}</div>
      <div class="so-summary-label">${label}</div>
      ${sub?`<div class="so-summary-sub">${sub}</div>`:''}
    </div>
  `;
}
function truncate(s, n) { return s?.length > n ? s.slice(0, n) + '…' : s; }
