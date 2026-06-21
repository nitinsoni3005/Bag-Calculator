/**
 * SAPMaterialMaster.js — SAP Material Master (MM01) page
 * Satyendra Packaging ERP — Phase 3
 */

import { sapMaterials, getNextSAPMaterialId, SAP_CATEGORIES } from '../data/sapMaterials.js';
import { escapeHtml } from '../components/Table.js';
import { openModal, closeModal, confirmDialog } from '../components/Modal.js';
import { showToast } from '../js/app.js';

let _search    = '';
let _catFilter = 'All';
let _tbodyEl   = null;

const PROC_LABELS = { E: 'In-house (E)', F: 'External (F)', X: 'Both (X)' };
const MRP_LABELS  = { PD: 'MRP (PD)', VB: 'Reorder (VB)', ND: 'No MRP (ND)' };

const CAT_CLASS = {
  'Fabric':'cat-fabric','Tape':'cat-tape','BOPP Film':'cat-bopp-film',
  'Lamination':'cat-lamination','Ink':'cat-ink','Thread':'cat-thread',
  'Liner':'cat-liner','Packing Material':'cat-packing','Adhesive':'cat-adhesive',
  'Loop Material':'cat-loop','Handle Material':'cat-handle',
  'Finished Goods':'cat-finished-goods',
};

export function renderSAPMaterialMaster(container) {
  container.innerHTML = '';

  const hdr = document.createElement('div');
  hdr.className = 'page-header';
  hdr.innerHTML = `
    <div>
      <h1 class="page-title">SAP Material Master</h1>
      <p class="page-subtitle">SAP MM01 material codes linked to internal materials</p>
    </div>
    <div style="display:flex;gap:var(--space-3);">
      <button class="btn btn-secondary" id="btn-sap-export-csv">📥 Export SAP CSV</button>
      <button class="btn btn-primary"   id="btn-add-sap">+ Add SAP Material</button>
    </div>
  `;
  container.appendChild(hdr);

  // Info banner
  const info = document.createElement('div');
  info.className = 'alert alert-success';
  info.style.marginBottom = 'var(--space-4)';
  info.innerHTML = `
    ℹ️ <strong>SAP Integration Note:</strong>
    SAP codes here are used in BOM generation for CS01 upload.
    Codes match real Satyendra Packaging SAP system codes (LMS, TAP, RGP, DCT, ELR series).
  `;
  container.appendChild(info);

  // Summary strip
  const strip = document.createElement('div');
  strip.className = 'material-summary-strip';
  strip.innerHTML = `
    <div class="material-summary-card">
      <div class="material-summary-card-label">Total SAP Codes</div>
      <div class="material-summary-card-value">${sapMaterials.length}</div>
      <div class="material-summary-card-sub">MM01 Material Records</div>
    </div>
    <div class="material-summary-card">
      <div class="material-summary-card-label">Raw Materials</div>
      <div class="material-summary-card-value">${sapMaterials.filter(m => m.category !== 'Finished Goods').length}</div>
      <div class="material-summary-card-sub">Components</div>
    </div>
    <div class="material-summary-card">
      <div class="material-summary-card-label">Finished Goods</div>
      <div class="material-summary-card-value">${sapMaterials.filter(m => m.category === 'Finished Goods').length}</div>
      <div class="material-summary-card-sub">FGS codes</div>
    </div>
    <div class="material-summary-card">
      <div class="material-summary-card-label">Plant</div>
      <div class="material-summary-card-value">SPL1</div>
      <div class="material-summary-card-sub">Navali, Anand</div>
    </div>
  `;
  container.appendChild(strip);

  // Category filter
  const chips = document.createElement('div');
  chips.className = 'cat-filter-chips';
  chips.id = 'sap-cat-chips';
  chips.innerHTML = ['All', ...SAP_CATEGORIES].map(c =>
    `<button class="filter-chip ${_catFilter === c ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  container.appendChild(chips);

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'page-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-left">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input class="form-control" id="sap-search" type="text"
          placeholder="Search SAP code, description..." value="${escapeHtml(_search)}" />
      </div>
    </div>
  `;
  container.appendChild(toolbar);

  // Table
  const wrap = document.createElement('div');
  wrap.className = 'table-wrapper';
  wrap.innerHTML = `<div class="table-header"><div>
    <span class="table-title">SAP Material Codes</span>
    <span class="table-count" id="sap-count">${sapMaterials.length}</span>
  </div></div>`;

  const scroll = document.createElement('div');
  scroll.style.overflowX = 'auto';
  const tbl = document.createElement('table');
  tbl.className = 'data-table';
  tbl.innerHTML = `
    <thead><tr>
      <th style="padding-left:var(--space-5)">SAP Code</th>
      <th>Description</th>
      <th>Category</th>
      <th>Internal Code</th>
      <th>UOM</th>
      <th>Item Cat</th>
      <th>MRP</th>
      <th>Procurement</th>
      <th style="text-align:center">Actions</th>
    </tr></thead>
    <tbody id="sap-tbody"></tbody>
  `;
  scroll.appendChild(tbl);
  wrap.appendChild(scroll);
  container.appendChild(wrap);

  _tbodyEl = tbl.querySelector('#sap-tbody');
  renderSAPRows();

  // Events
  container.querySelector('#btn-add-sap').addEventListener('click', () => openSAPModal(null));
  container.querySelector('#sap-search').addEventListener('input', e => { _search = e.target.value.trim(); renderSAPRows(); });
  container.querySelector('#btn-sap-export-csv').addEventListener('click', exportSAPMasterCSV);
  chips.addEventListener('click', e => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    _catFilter = chip.getAttribute('data-cat');
    chips.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-cat') === _catFilter));
    renderSAPRows();
  });
  _tbodyEl.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id  = parseInt(btn.getAttribute('data-id'), 10);
    const mat = sapMaterials.find(m => m.id === id);
    if (!mat) return;
    if (btn.getAttribute('data-action') === 'edit') openSAPModal(mat);
    if (btn.getAttribute('data-action') === 'delete') {
      const ok = await confirmDialog(`Delete SAP code <strong>${mat.sapCode}</strong>?`, 'Delete SAP Material');
      if (ok) {
        sapMaterials.splice(sapMaterials.indexOf(mat), 1);
        renderSAPRows();
        showToast(`${mat.sapCode} deleted.`, 'success');
      }
    }
  });
}

function renderSAPRows() {
  let data = [...sapMaterials];
  if (_catFilter !== 'All') data = data.filter(m => m.category === _catFilter);
  if (_search) {
    const t = _search.toLowerCase();
    data = data.filter(m =>
      m.sapCode.toLowerCase().includes(t) ||
      m.description.toLowerCase().includes(t) ||
      (m.internalCode || '').toLowerCase().includes(t)
    );
  }
  const cnt = document.getElementById('sap-count');
  if (cnt) cnt.textContent = data.length;
  if (!_tbodyEl) return;
  _tbodyEl.innerHTML = '';

  if (!data.length) {
    _tbodyEl.innerHTML = `<tr><td colspan="9">
      <div class="empty-state"><div class="empty-state-icon">⚙️</div>
      <div class="empty-state-title">No SAP materials found</div></div>
    </td></tr>`;
    return;
  }

  data.forEach(mat => {
    const tr = document.createElement('tr');
    const catCls = CAT_CLASS[mat.category] || 'badge-gray';
    const mrpCls = `mrp-${(mat.mrpType || 'nd').toLowerCase()}`;
    const prcCls = `proc-${(mat.procurementType || 'f').toLowerCase()}`;
    tr.innerHTML = `
      <td style="padding-left:var(--space-5)">
        <span class="sap-code-badge">${escapeHtml(mat.sapCode)}</span>
      </td>
      <td>
        <div style="font-size:0.8rem;font-weight:500;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${escapeHtml(mat.description)}
        </div>
      </td>
      <td><span class="badge ${catCls}" style="font-size:0.7rem;">${escapeHtml(mat.category)}</span></td>
      <td><code style="font-size:0.75rem;color:var(--color-accent);">${escapeHtml(mat.internalCode || '—')}</code></td>
      <td><span class="badge badge-gray">${escapeHtml(mat.uom)}</span></td>
      <td><span class="badge badge-info" style="font-size:0.7rem;">${escapeHtml(mat.itemCategory || 'L')}</span></td>
      <td><span class="badge ${mrpCls}" style="font-size:0.7rem;">${escapeHtml(mat.mrpType || '—')}</span></td>
      <td><span class="badge ${prcCls}" style="font-size:0.7rem;">${escapeHtml(PROC_LABELS[mat.procurementType] || '—')}</span></td>
      <td style="text-align:center">
        <div class="action-btns">
          <button class="btn-icon-only btn-edit"   data-action="edit"   data-id="${mat.id}" title="Edit">✏️</button>
          <button class="btn-icon-only btn-delete" data-action="delete" data-id="${mat.id}" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    _tbodyEl.appendChild(tr);
  });
}

function openSAPModal(existing) {
  const isEdit = !!existing;
  const body = `
    <form id="sap-form" novalidate>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">SAP Code <span class="required">*</span></label>
          <input class="form-control" id="sf-sapcode" type="text"
            value="${escapeHtml(existing?.sapCode || '')}" placeholder="LMS01453" required
            style="font-family:monospace;font-weight:700;" />
        </div>
        <div class="form-group">
          <label class="form-label">Internal Code</label>
          <input class="form-control" id="sf-intcode" type="text"
            value="${escapeHtml(existing?.internalCode || '')}" placeholder="FAB-001" />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Description <span class="required">*</span></label>
          <input class="form-control" id="sf-desc" type="text"
            value="${escapeHtml(existing?.description || '')}" placeholder="SAP material description" required />
        </div>
        <div class="form-group">
          <label class="form-label">Category <span class="required">*</span></label>
          <select class="form-control" id="sf-cat" required>
            <option value="">-- Select --</option>
            ${SAP_CATEGORIES.map(c => `<option value="${c}" ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">UOM</label>
          <select class="form-control" id="sf-uom">
            ${['KG','MTR','PCS','LTR','GM','SET','ROLL'].map(u => `<option value="${u}" ${(existing?.uom||'KG')===u?'selected':''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Item Category</label>
          <select class="form-control" id="sf-itemcat">
            <option value="L" ${(existing?.itemCategory||'L')==='L'?'selected':''}>L — Stock Item</option>
            <option value="R" ${existing?.itemCategory==='R'?'selected':''}>R — Variable Size</option>
            <option value="T" ${existing?.itemCategory==='T'?'selected':''}>T — Text Item</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">MRP Type</label>
          <select class="form-control" id="sf-mrp">
            ${Object.entries(MRP_LABELS).map(([k,v]) => `<option value="${k}" ${(existing?.mrpType||'PD')===k?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Procurement Type</label>
          <select class="form-control" id="sf-proc">
            ${Object.entries(PROC_LABELS).map(([k,v]) => `<option value="${k}" ${(existing?.procurementType||'F')===k?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Plant</label>
          <input class="form-control" id="sf-plant" type="text"
            value="${escapeHtml(existing?.plant || 'SPL1')}" />
        </div>
      </div>
      <div id="sap-form-err" class="alert alert-error" style="display:none;margin-top:var(--space-3);"></div>
    </form>
  `;
  openModal({
    id: 'sap-modal', title: isEdit ? 'Edit SAP Material' : 'Add SAP Material',
    size: 'lg', body,
    footer: [
      { label: 'Cancel', className: 'btn btn-secondary', action: 'cancel', onClick: () => closeModal('sap-modal') },
      { label: isEdit ? '💾 Save' : '✅ Add', className: 'btn btn-primary', action: 'submit', onClick: () => submitSAPForm(existing) },
    ],
  });
}

function submitSAPForm(existing) {
  const err = document.getElementById('sap-form-err');
  const get = id => document.getElementById(id)?.value?.trim() || '';
  const data = {
    sapCode:          get('sf-sapcode'),
    internalCode:     get('sf-intcode'),
    description:      get('sf-desc'),
    category:         get('sf-cat'),
    uom:              get('sf-uom') || 'KG',
    itemCategory:     get('sf-itemcat') || 'L',
    mrpType:          get('sf-mrp') || 'PD',
    procurementType:  get('sf-proc') || 'F',
    plant:            get('sf-plant') || 'SPL1',
    status: 'Active',
  };
  const errors = [];
  if (!data.sapCode)    errors.push('SAP Code is required.');
  if (!data.description) errors.push('Description is required.');
  if (!data.category)   errors.push('Category is required.');
  if (errors.length) { err.innerHTML = '⚠️ ' + errors.join('<br>'); err.style.display = 'flex'; return; }
  err.style.display = 'none';
  if (existing) {
    const idx = sapMaterials.findIndex(m => m.id === existing.id);
    if (idx > -1) sapMaterials[idx] = { ...sapMaterials[idx], ...data };
    showToast(`${data.sapCode} updated.`, 'success');
  } else {
    sapMaterials.push({ id: getNextSAPMaterialId(), createdAt: new Date().toISOString().split('T')[0], ...data });
    showToast(`${data.sapCode} added.`, 'success');
  }
  closeModal('sap-modal');
  renderSAPRows();
}

function exportSAPMasterCSV() {
  const rows = sapMaterials.map(m => [
    m.sapCode, m.description, m.category, m.internalCode, m.uom,
    m.itemCategory, m.mrpType, m.procurementType, m.plant,
  ]);
  const csv = [['SAP_CODE','DESCRIPTION','CATEGORY','INTERNAL_CODE','UOM','ITEM_CAT','MRP_TYPE','PROC_TYPE','PLANT'], ...rows]
    .map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: 'sap_material_master.csv',
  });
  a.click();
  showToast('SAP Material Master exported.', 'success');
}
