/**
 * RawMaterialMaster.js — Raw Material Master CRUD page
 * Satyendra Packaging ERP — Phase 3
 */

import { materials, getNextMaterialId, getNextMaterialCode, RM_CATEGORIES, UOM_LIST } from '../data/materials.js';
import { escapeHtml } from '../components/Table.js';
import { openModal, closeModal, confirmDialog } from '../components/Modal.js';
import { showToast } from '../js/app.js';

/** State */
let _search      = '';
let _catFilter   = 'All';
let _tbodyEl     = null;

/** Category → CSS class map */
const CAT_CLASS = {
  'Fabric':           'cat-fabric',
  'Tape':             'cat-tape',
  'BOPP Film':        'cat-bopp-film',
  'Lamination':       'cat-lamination',
  'Ink':              'cat-ink',
  'Thread':           'cat-thread',
  'Liner':            'cat-liner',
  'Packing Material': 'cat-packing',
  'Adhesive':         'cat-adhesive',
  'Loop Material':    'cat-loop',
  'Handle Material':  'cat-handle',
  'Filler':           'cat-filler',
};

const CAT_ICON = {
  'Fabric':'🧵','Tape':'🔩','BOPP Film':'🎞️','Lamination':'✨',
  'Ink':'🖨️','Thread':'🪡','Liner':'📦','Packing Material':'📫',
  'Adhesive':'💧','Loop Material':'🔗','Handle Material':'🤝','Filler':'🪨',
};

export function renderRawMaterialMaster(container) {
  container.innerHTML = '';

  // ── Header ──
  const hdr = document.createElement('div');
  hdr.className = 'page-header';
  hdr.innerHTML = `
    <div>
      <h1 class="page-title">Raw Material Master</h1>
      <p class="page-subtitle">Manage raw materials, rates and categories</p>
    </div>
    <button class="btn btn-primary" id="btn-add-rm">+ Add Material</button>
  `;
  container.appendChild(hdr);

  // ── Summary strip ──
  container.appendChild(buildSummaryStrip());

  // ── Category filter chips ── */
  const chips = document.createElement('div');
  chips.className = 'cat-filter-chips';
  chips.id = 'rm-cat-chips';
  chips.innerHTML = ['All', ...RM_CATEGORIES].map(c => `
    <button class="filter-chip ${_catFilter === c ? 'active' : ''}" data-cat="${c}">
      ${CAT_ICON[c] || '📦'} ${c}
    </button>
  `).join('');
  container.appendChild(chips);

  // ── Toolbar ──
  const toolbar = document.createElement('div');
  toolbar.className = 'page-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-left">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input class="form-control" id="rm-search" type="text"
          placeholder="Search code, name, category..." value="${escapeHtml(_search)}" />
      </div>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-secondary btn-sm" id="btn-rm-export">📥 Export</button>
    </div>
  `;
  container.appendChild(toolbar);

  // ── Table ──
  const wrap = document.createElement('div');
  wrap.className = 'table-wrapper';
  wrap.innerHTML = `
    <div class="table-header">
      <div>
        <span class="table-title">All Raw Materials</span>
        <span class="table-count" id="rm-count">${materials.length}</span>
      </div>
    </div>
  `;

  const scroll = document.createElement('div');
  scroll.style.overflowX = 'auto';
  const tbl = document.createElement('table');
  tbl.className = 'data-table';
  tbl.innerHTML = `
    <thead><tr>
      <th style="padding-left:var(--space-5)">Material</th>
      <th>Category</th>
      <th>UOM</th>
      <th>Rate (₹/UOM)</th>
      <th>Supplier</th>
      <th>Status</th>
      <th style="text-align:center">Actions</th>
    </tr></thead>
    <tbody id="rm-tbody"></tbody>
  `;
  scroll.appendChild(tbl);
  wrap.appendChild(scroll);

  const footer = document.createElement('div');
  footer.className = 'table-footer';
  footer.id = 'rm-footer';
  wrap.appendChild(footer);
  container.appendChild(wrap);

  _tbodyEl = tbl.querySelector('#rm-tbody');
  renderRows();

  // ── Events ──
  container.querySelector('#btn-add-rm').addEventListener('click', () => openRMModal(null));
  container.querySelector('#rm-search').addEventListener('input', e => { _search = e.target.value.trim(); renderRows(); });
  container.querySelector('#btn-rm-export').addEventListener('click', exportCSV);
  chips.addEventListener('click', e => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    _catFilter = chip.getAttribute('data-cat');
    chips.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-cat') === _catFilter));
    renderRows();
  });
  _tbodyEl.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.getAttribute('data-id'), 10);
    const mat = materials.find(m => m.id === id);
    if (!mat) return;
    if (btn.getAttribute('data-action') === 'edit') openRMModal(mat);
    if (btn.getAttribute('data-action') === 'delete') {
      const ok = await confirmDialog(`Delete <strong>${escapeHtml(mat.name)}</strong>?`, 'Delete Material');
      if (ok) {
        materials.splice(materials.indexOf(mat), 1);
        renderRows();
        showToast(`${mat.name} deleted.`, 'success');
      }
    }
  });
}

function renderRows() {
  let data = [...materials];
  if (_catFilter !== 'All') data = data.filter(m => m.category === _catFilter);
  if (_search) {
    const t = _search.toLowerCase();
    data = data.filter(m =>
      m.code.toLowerCase().includes(t) ||
      m.name.toLowerCase().includes(t) ||
      m.category.toLowerCase().includes(t) ||
      (m.supplier || '').toLowerCase().includes(t)
    );
  }
  const countEl = document.getElementById('rm-count');
  if (countEl) countEl.textContent = data.length;
  if (!_tbodyEl) return;
  _tbodyEl.innerHTML = '';

  if (!data.length) {
    _tbodyEl.innerHTML = `<tr><td colspan="7">
      <div class="empty-state"><div class="empty-state-icon">📦</div>
      <div class="empty-state-title">No materials found</div></div>
    </td></tr>`;
    return;
  }

  data.forEach(mat => {
    const tr = document.createElement('tr');
    const catClass  = CAT_CLASS[mat.category] || 'badge-gray';
    const catIcon   = CAT_ICON[mat.category]  || '📦';
    const statusCls = mat.status === 'Active' ? 'badge-success' : 'badge-danger';
    tr.innerHTML = `
      <td style="padding-left:var(--space-5)">
        <div class="material-code-cell">
          <span class="material-code-text">${escapeHtml(mat.code)}</span>
          <span class="material-name-text">${escapeHtml(mat.name)}</span>
          ${mat.description ? `<span class="material-desc-text">${escapeHtml(mat.description.slice(0, 50))}…</span>` : ''}
        </div>
      </td>
      <td><span class="badge ${catClass}">${catIcon} ${escapeHtml(mat.category)}</span></td>
      <td><span class="badge badge-gray">${escapeHtml(mat.uom)}</span></td>
      <td><div class="rate-cell">₹ ${mat.currentRate?.toLocaleString() || '0'}<span class="rate-currency"> / ${escapeHtml(mat.uom)}</span></div></td>
      <td style="font-size:0.8rem;">${escapeHtml(mat.supplier || '—')}</td>
      <td><span class="badge ${statusCls}">${escapeHtml(mat.status)}</span></td>
      <td style="text-align:center">
        <div class="action-btns">
          <button class="btn-icon-only btn-edit"   data-action="edit"   data-id="${mat.id}" title="Edit">✏️</button>
          <button class="btn-icon-only btn-delete" data-action="delete" data-id="${mat.id}" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    _tbodyEl.appendChild(tr);
  });

  const footer = document.getElementById('rm-footer');
  if (footer) footer.innerHTML = `<span>Showing ${data.length} of ${materials.length} materials</span>`;
}

function buildSummaryStrip() {
  const catCounts = RM_CATEGORIES.reduce((acc, c) => {
    acc[c] = materials.filter(m => m.category === c).length;
    return acc;
  }, {});
  const strip = document.createElement('div');
  strip.className = 'material-summary-strip';
  strip.innerHTML = `
    <div class="material-summary-card">
      <div class="material-summary-card-label">Total Materials</div>
      <div class="material-summary-card-value">${materials.length}</div>
      <div class="material-summary-card-sub">Across ${RM_CATEGORIES.length} categories</div>
    </div>
    <div class="material-summary-card">
      <div class="material-summary-card-label">Fabric & Tape</div>
      <div class="material-summary-card-value">${(catCounts['Fabric'] || 0) + (catCounts['Tape'] || 0)}</div>
      <div class="material-summary-card-sub">Primary materials</div>
    </div>
    <div class="material-summary-card">
      <div class="material-summary-card-label">Films & Lami</div>
      <div class="material-summary-card-value">${(catCounts['BOPP Film'] || 0) + (catCounts['Lamination'] || 0)}</div>
      <div class="material-summary-card-sub">BOPP + Lamination</div>
    </div>
    <div class="material-summary-card">
      <div class="material-summary-card-label">Consumables</div>
      <div class="material-summary-card-value">${(catCounts['Ink'] || 0) + (catCounts['Thread'] || 0) + (catCounts['Adhesive'] || 0)}</div>
      <div class="material-summary-card-sub">Ink, Thread, Adhesive</div>
    </div>
  `;
  return strip;
}

function openRMModal(existing) {
  const isEdit = !!existing;
  const body = `
    <form id="rm-form" novalidate>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Material Code <span class="required">*</span></label>
          <input class="form-control" id="rm-code" type="text"
            value="${escapeHtml(existing?.code || '')}" placeholder="FAB-001" required />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="rm-status">
            <option value="Active"   ${(!existing || existing.status === 'Active')   ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${(existing && existing.status === 'Inactive') ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        <div class="form-group span-2">
          <label class="form-label">Material Name <span class="required">*</span></label>
          <input class="form-control" id="rm-name" type="text"
            value="${escapeHtml(existing?.name || '')}" placeholder="Material name" required />
        </div>
        <div class="form-group">
          <label class="form-label">Category <span class="required">*</span></label>
          <select class="form-control" id="rm-category" required>
            <option value="">-- Select --</option>
            ${RM_CATEGORIES.map(c => `<option value="${c}" ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">UOM <span class="required">*</span></label>
          <select class="form-control" id="rm-uom" required>
            ${UOM_LIST.map(u => `<option value="${u}" ${(existing?.uom || 'KG') === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Current Rate (₹)</label>
          <input class="form-control" id="rm-rate" type="number" step="0.01" min="0"
            value="${existing?.currentRate || ''}" placeholder="Rate per UOM" />
        </div>
        <div class="form-group">
          <label class="form-label">Supplier</label>
          <input class="form-control" id="rm-supplier" type="text"
            value="${escapeHtml(existing?.supplier || '')}" placeholder="Supplier name" />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Description / SAP Ref</label>
          <textarea class="form-control" id="rm-desc" rows="2"
            placeholder="SAP code, spec details...">${escapeHtml(existing?.description || '')}</textarea>
        </div>
      </div>
      <div id="rm-form-err" class="alert alert-error" style="display:none;margin-top:var(--space-3);"></div>
    </form>
  `;

  openModal({
    id: 'rm-modal',
    title: isEdit ? 'Edit Raw Material' : 'Add Raw Material',
    size: 'lg', body,
    footer: [
      { label: 'Cancel', className: 'btn btn-secondary', action: 'cancel', onClick: () => closeModal('rm-modal') },
      { label: isEdit ? '💾 Save' : '✅ Add', className: 'btn btn-primary', action: 'submit', onClick: () => submitRMForm(existing) },
    ],
  });

  // Auto-generate code when category changes (new only)
  if (!isEdit) {
    setTimeout(() => {
      document.getElementById('rm-category')?.addEventListener('change', e => {
        const code = getNextMaterialCode(e.target.value);
        document.getElementById('rm-code').value = code;
      });
    }, 50);
  }
}

function submitRMForm(existing) {
  const err = document.getElementById('rm-form-err');
  const get = id => document.getElementById(id)?.value?.trim() || '';
  const data = {
    code:        get('rm-code'),
    name:        get('rm-name'),
    category:    get('rm-category'),
    uom:         get('rm-uom') || 'KG',
    currentRate: parseFloat(get('rm-rate')) || 0,
    supplier:    get('rm-supplier'),
    description: get('rm-desc'),
    status:      get('rm-status') || 'Active',
  };
  const errors = [];
  if (!data.code)     errors.push('Code is required.');
  if (!data.name)     errors.push('Name is required.');
  if (!data.category) errors.push('Category is required.');
  if (errors.length) { err.innerHTML = '⚠️ ' + errors.join('<br>⚠️ '); err.style.display = 'flex'; return; }
  err.style.display = 'none';
  if (existing) {
    const idx = materials.findIndex(m => m.id === existing.id);
    if (idx > -1) materials[idx] = { ...materials[idx], ...data };
    showToast(`${data.name} updated.`, 'success');
  } else {
    materials.push({ id: getNextMaterialId(), createdAt: new Date().toISOString().split('T')[0], ...data });
    showToast(`${data.name} added.`, 'success');
  }
  closeModal('rm-modal');
  renderRows();
}

function exportCSV() {
  const rows = materials.map(m => [m.code, m.name, m.category, m.uom, m.currentRate, m.supplier, m.status]);
  const csv  = [['Code','Name','Category','UOM','Rate','Supplier','Status'], ...rows]
    .map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: 'raw_materials.csv',
  });
  a.click();
  showToast('Exported.', 'success');
}
