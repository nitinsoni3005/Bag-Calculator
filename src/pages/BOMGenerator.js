/**
 * BOMGenerator.js — BOM Generator page
 * Two-panel: Left = SO/Spec selector + wastage settings, Right = generated BOM table
 * Satyendra Packaging ERP — Phase 3
 */

import { salesOrders }    from '../data/salesOrders.js';
import { specifications } from '../data/specifications.js';
import { boms, getNextBOMId, getNextBOMNumber, BOM_STATUSES } from '../data/boms.js';
import { generateBOM, calcBOMSummary, loadWastageSettings, saveWastageSettings, DEFAULT_WASTAGE } from '../services/bomEngine.js';
import { generateSAPBOM, exportSAPBOMCSV, exportBOMExcel, generateBOMPrintHTML } from '../services/sapBomEngine.js';
import { escapeHtml } from '../components/Table.js';
import { openModal, closeModal } from '../components/Modal.js';
import { showToast } from '../js/app.js';

/** State */
let _selectedSO     = null;
let _selectedSpec   = null;
let _currentLines   = [];
let _wastageSettings = loadWastageSettings();
let _bomStatus      = 'Draft';

const CAT_COLORS = {
  'Fabric':'#2563EB','Tape':'#7C3AED','BOPP Film':'#059669','Lamination':'#D97706',
  'Ink':'#DB2777','Thread':'#EA580C','Liner':'#0891B2','Packing Material':'#475569',
  'Adhesive':'#DC2626','Loop Material':'#0369A1','Handle Material':'#78716C',
};

export function renderBOMGenerator(container) {
  container.innerHTML = '';

  // ── Header ──
  const hdr = document.createElement('div');
  hdr.className = 'page-header';
  hdr.innerHTML = `
    <div>
      <h1 class="page-title">BOM Generator</h1>
      <p class="page-subtitle">Automatically generate Bill of Materials from Sales Order + Product Specification</p>
    </div>
    <div style="display:flex;gap:var(--space-3);">
      <button class="btn btn-secondary" id="btn-bom-view-all">📋 View All BOMs</button>
      <button class="btn btn-primary"   id="btn-generate-bom" disabled>⚙️ Generate BOM</button>
    </div>
  `;
  container.appendChild(hdr);

  // ── Two-panel layout ──
  const layout = document.createElement('div');
  layout.className = 'bom-layout';

  // Left panel
  const leftPanel = buildLeftPanel();
  // Right panel
  const rightPanel = document.createElement('div');
  rightPanel.className = 'bom-output-panel';
  rightPanel.id = 'bom-output-panel';
  renderBOMPlaceholder(rightPanel);

  layout.appendChild(leftPanel);
  layout.appendChild(rightPanel);
  container.appendChild(layout);

  // ── Events ──
  container.querySelector('#btn-generate-bom').addEventListener('click', () => runBOMGeneration(rightPanel, container));
  container.querySelector('#btn-bom-view-all').addEventListener('click', () => {
    window.location.hash = 'bom-report';
  });
}

// ─────────────────────────────────────────────────
// LEFT PANEL — Input selector
// ─────────────────────────────────────────────────

function buildLeftPanel() {
  const panel = document.createElement('div');
  panel.className = 'bom-input-panel';
  panel.id = 'bom-left-panel';

  panel.innerHTML = `
    <div class="bom-input-header">
      <div class="bom-input-header-title">⚙️ BOM Configuration</div>
      <div class="bom-input-header-sub">Select SO + Specification to generate BOM</div>
    </div>
    <div class="bom-input-body">

      <!-- STEP 1: Select Sales Order -->
      <div class="form-group">
        <label class="form-label">Step 1: Sales Order <span class="required">*</span></label>
        <select class="form-control" id="bom-so-select">
          <option value="">-- Select Sales Order --</option>
          ${salesOrders.map(so => `
            <option value="${so.id}">
              ${escapeHtml(so.soNumber)} — ${escapeHtml(so.customerName.slice(0, 28))}
            </option>
          `).join('')}
        </select>
      </div>

      <!-- SO details preview -->
      <div id="bom-so-preview" style="display:none;"
        class="alert" style="background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);">
      </div>

      <!-- STEP 2: Select Specification -->
      <div class="form-group">
        <label class="form-label">Step 2: Product Specification <span class="required">*</span></label>
        <select class="form-control" id="bom-spec-select">
          <option value="">-- Select Specification --</option>
          ${specifications.map(sp => `
            <option value="${sp.id}">
              ${escapeHtml(sp.specNumber)} — ${escapeHtml((sp.productName || '').slice(0, 30))}
            </option>
          `).join('')}
        </select>
      </div>

      <!-- Spec preview -->
      <div id="bom-spec-preview" style="display:none;"
        class="alert" style="background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);">
      </div>

      <!-- STEP 3: BOM Status -->
      <div class="form-group">
        <label class="form-label">BOM Status</label>
        <select class="form-control" id="bom-status-select">
          ${BOM_STATUSES.map(s => `<option value="${s}" ${_bomStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>

      <!-- STEP 4: Wastage Settings -->
      <div class="wastage-settings-panel">
        <div class="wastage-settings-title">⚙️ Wastage Settings (%)</div>
        <div class="wastage-grid" id="wastage-grid">
          ${buildWastageInputs(_wastageSettings)}
        </div>
        <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3);">
          <button class="btn btn-secondary btn-sm" id="btn-save-wastage">💾 Save Defaults</button>
          <button class="btn btn-secondary btn-sm" id="btn-reset-wastage">🔄 Reset</button>
        </div>
      </div>

    </div>
  `;

  // Events on left panel
  setTimeout(() => {
    document.getElementById('bom-so-select')?.addEventListener('change', e => {
      _selectedSO = salesOrders.find(s => s.id === parseInt(e.target.value, 10)) || null;
      updateSOPreview();
      checkReadyState();
    });
    document.getElementById('bom-spec-select')?.addEventListener('change', e => {
      _selectedSpec = specifications.find(s => s.id === parseInt(e.target.value, 10)) || null;
      updateSpecPreview();
      checkReadyState();
    });
    document.getElementById('bom-status-select')?.addEventListener('change', e => {
      _bomStatus = e.target.value;
    });
    document.getElementById('btn-save-wastage')?.addEventListener('click', () => {
      saveWastageSettings(_wastageSettings);
      showToast('Wastage settings saved.', 'success');
    });
    document.getElementById('btn-reset-wastage')?.addEventListener('click', () => {
      _wastageSettings = { ...DEFAULT_WASTAGE };
      const grid = document.getElementById('wastage-grid');
      if (grid) grid.innerHTML = buildWastageInputs(_wastageSettings);
      attachWastageEvents();
      showToast('Wastage reset to defaults.', 'info');
    });
    attachWastageEvents();
  }, 50);

  return panel;
}

function buildWastageInputs(w) {
  const entries = [
    ['fabric',   'Fabric',    w.fabric],
    ['tape',     'Tape',      w.tape],
    ['bopp',     'BOPP Film', w.bopp],
    ['lami',     'Lamination',w.lami],
    ['metalize', 'Metalize',  w.metalize],
    ['ink',      'Ink',       w.ink],
    ['thread',   'Thread',    w.thread],
    ['liner',    'Liner',     w.liner],
    ['packing',  'Packing',   w.packing],
    ['adhesive', 'Adhesive',  w.adhesive],
  ];
  return entries.map(([key, label, val]) => `
    <div class="wastage-row">
      <span class="wastage-label">${label}</span>
      <div style="display:flex;align-items:center;gap:4px;">
        <input class="wastage-input" id="wst-${key}" type="number"
          step="0.1" min="0" max="100" value="${val}" data-key="${key}" />
        <span class="wastage-pct">%</span>
      </div>
    </div>
  `).join('');
}

function attachWastageEvents() {
  document.querySelectorAll('.wastage-input').forEach(inp => {
    inp.addEventListener('input', e => {
      const key = e.target.getAttribute('data-key');
      if (key) _wastageSettings[key] = parseFloat(e.target.value) || 0;
    });
  });
}

function updateSOPreview() {
  const el = document.getElementById('bom-so-preview');
  if (!el) return;
  if (!_selectedSO) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.cssText = 'display:block;background:var(--color-accent-light);border:1px solid #BFDBFE;border-radius:8px;padding:10px 14px;font-size:0.78rem;';
  el.innerHTML = `
    <div style="font-weight:700;color:var(--color-accent);margin-bottom:4px;">📋 ${_selectedSO.soNumber}</div>
    <div>Customer: <strong>${escapeHtml(_selectedSO.customerName.slice(0, 36))}</strong></div>
    <div>Product: ${escapeHtml(_selectedSO.productName)} | Qty: <strong>${_selectedSO.quantity?.toLocaleString()} PCS</strong></div>
    <div>Type: ${escapeHtml(_selectedSO.productType)} | Delivery: ${_selectedSO.deliveryDate}</div>
  `;
}

function updateSpecPreview() {
  const el = document.getElementById('bom-spec-preview');
  if (!el) return;
  if (!_selectedSpec) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.cssText = 'display:block;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:10px 14px;font-size:0.78rem;';
  const cr = _selectedSpec.calcResults || {};
  el.innerHTML = `
    <div style="font-weight:700;color:#059669;margin-bottom:4px;">📐 ${_selectedSpec.specNumber}</div>
    <div>Size: <strong>${_selectedSpec.widthCm || 0} × ${_selectedSpec.lengthCm || 0} cm</strong> | GSM: ${_selectedSpec.fabricGsm || 0}</div>
    <div>Bag Weight: <strong>${cr.totalBagWt || '?'} g</strong> | BOPP: ${_selectedSpec.boppMicron || 0}μm ${_selectedSpec.boppType || ''}</div>
    <div>Lami: ${_selectedSpec.lamiMicron || 0}μm | Colors: ${_selectedSpec.noOfColors || 0} | Handle: ${_selectedSpec.handleWeight || 0}g</div>
  `;
}

function checkReadyState() {
  const btn = document.getElementById('btn-generate-bom');
  if (btn) btn.disabled = !(_selectedSO && _selectedSpec);
}

// ─────────────────────────────────────────────────
// BOM GENERATION
// ─────────────────────────────────────────────────

function runBOMGeneration(rightPanel, container) {
  if (!_selectedSO || !_selectedSpec) {
    showToast('Please select both a Sales Order and Specification.', 'error');
    return;
  }

  // Build combined spec from SO + Spec data
  const specInput = {
    productType:    _selectedSpec.productType || _selectedSO.productType,
    widthCm:        _selectedSpec.widthCm     || 0,
    lengthCm:       _selectedSpec.lengthCm    || 0,
    gussetCm:       _selectedSpec.gussetCm    || 0,
    fabricGsm:      _selectedSpec.fabricGsm   || 0,
    fabricColor:    _selectedSpec.fabricColor  || 'NATURAL',
    boppMicron:     _selectedSpec.boppMicron   || 15,
    boppSides:      _selectedSpec.boppSides    || 1,
    boppWidth:      _selectedSpec.boppWidth    || 80,
    boppType:       _selectedSpec.boppType     || 'MATT FINISH',
    lamiMicron:     _selectedSpec.lamiMicron   || 0,
    lamiSides:      _selectedSpec.lamiSides    || 1,
    metalizeMicron: _selectedSpec.metalizeMicron || 0,
    noOfColors:     _selectedSpec.noOfColors   || 0,
    handleWeight:   _selectedSpec.handleWeight || 0,
    threadWeight:   _selectedSpec.threadWeight || 2,
    linerMicron:    _selectedSpec.linerMicron  || 0,
    linerWidthCm:   _selectedSpec.linerWidthCm || 0,
    linerLengthCm:  _selectedSpec.linerLengthCm|| 0,
    stitchType:     _selectedSpec.stitchType   || 'SFDS',
    tapeWidth:      '2.67',
    denier:         _selectedSpec.calcResults?.denier || '',
  };

  const qty = _selectedSO.quantity || 25000;
  _currentLines = generateBOM(specInput, qty, _wastageSettings);

  const bomHeader = {
    bomNumber:    getNextBOMNumber(),
    soNumber:     _selectedSO.soNumber,
    specNumber:   _selectedSpec.specNumber,
    productCode:  _selectedSpec.productCode  || _selectedSO.productCode,
    productName:  _selectedSpec.productName  || _selectedSO.productName,
    productType:  specInput.productType,
    customerName: _selectedSO.customerName,
    quantity:     qty,
    status:       _bomStatus,
  };

  renderBOMOutput(rightPanel, bomHeader, _currentLines);
  showToast(`BOM generated — ${_currentLines.length} line items.`, 'success');
}

// ─────────────────────────────────────────────────
// BOM OUTPUT PANEL
// ─────────────────────────────────────────────────

function renderBOMPlaceholder(panel) {
  panel.innerHTML = `
    <div class="bom-table-wrapper">
      <div class="bom-empty-state">
        <div class="bom-empty-icon">⚙️</div>
        <div class="bom-empty-title">No BOM Generated Yet</div>
        <div class="bom-empty-desc">
          Select a Sales Order and Product Specification on the left,
          then click <strong>"Generate BOM"</strong> to auto-calculate all material requirements.
        </div>
      </div>
    </div>
  `;
}

function renderBOMOutput(panel, header, lines) {
  panel.innerHTML = '';
  const summary = calcBOMSummary(lines);

  // ── BOM Header card ──
  const headerCard = document.createElement('div');
  headerCard.className = 'bom-header-card';
  headerCard.innerHTML = `
    <div class="bom-header-left">
      <h2>${escapeHtml(header.productName)}</h2>
      <div class="bom-header-meta">
        ${metaItem('BOM No.',    header.bomNumber)}
        ${metaItem('SO Ref',     header.soNumber)}
        ${metaItem('Spec Ref',   header.specNumber)}
        ${metaItem('Customer',   header.customerName?.slice(0, 28) + (header.customerName?.length > 28 ? '…' : ''))}
        ${metaItem('Product',    header.productCode)}
        ${metaItem('Type',       header.productType)}
        ${metaItem('Quantity',   `${(header.quantity || 0).toLocaleString()} PCS`)}
        ${metaItem('Status',     header.status)}
      </div>
    </div>
    <div class="bom-header-right">
      <span class="badge bom-status-${(header.status || 'draft').toLowerCase()}">${escapeHtml(header.status)}</span>
      <span style="font-size:0.7rem;color:rgba(255,255,255,0.4);">${new Date().toLocaleDateString('en-IN')}</span>
    </div>
  `;
  panel.appendChild(headerCard);

  // ── Summary boxes ──
  const summaryStrip = document.createElement('div');
  summaryStrip.className = 'bom-summary-strip';
  summaryStrip.innerHTML = `
    ${summaryBox(summary.lineCount,                 'Line Items')}
    ${summaryBox(summary.totalNetKg.toFixed(2) + ' KG',   'Total Net KG')}
    ${summaryBox(summary.totalGrossKg.toFixed(2) + ' KG', 'Total Gross KG')}
    ${summaryBox((header.quantity||0).toLocaleString(),    'Order Quantity')}
  `;
  panel.appendChild(summaryStrip);

  // ── BOM Table ──
  const tableWrap = document.createElement('div');
  tableWrap.className = 'bom-table-wrapper';

  const toolbar = document.createElement('div');
  toolbar.className = 'bom-table-toolbar';
  toolbar.innerHTML = `
    <span class="bom-table-title">📋 Material Consumption List</span>
    <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" id="btn-bom-save">💾 Save BOM</button>
      <button class="btn btn-secondary btn-sm" id="btn-bom-export-excel">📊 Excel</button>
      <button class="btn btn-secondary btn-sm" id="btn-bom-export-sap">⚙️ SAP CSV</button>
      <button class="btn btn-secondary btn-sm" id="btn-bom-print">🖨️ Print</button>
    </div>
  `;
  tableWrap.appendChild(toolbar);

  const scroll = document.createElement('div');
  scroll.style.overflowX = 'auto';
  const tbl = document.createElement('table');
  tbl.className = 'bom-data-table';
  tbl.innerHTML = `
    <thead><tr>
      <th style="padding-left:var(--space-5)">Seq</th>
      <th>SAP Code</th>
      <th>Description</th>
      <th>Category</th>
      <th>UOM</th>
      <th class="num">Cons/Bag (KG)</th>
      <th class="num">Total Net</th>
      <th class="num">Wastage %</th>
      <th class="num">Wastage Qty</th>
      <th class="num">Final Req</th>
    </tr></thead>
    <tbody id="bom-gen-tbody"></tbody>
  `;
  const tbody = tbl.querySelector('#bom-gen-tbody');

  lines.forEach(line => {
    const tr = document.createElement('tr');
    const dotColor = CAT_COLORS[line.category] || '#64748B';
    tr.innerHTML = `
      <td style="padding-left:var(--space-5)"><span class="bom-seq">${line.seq}</span></td>
      <td><span class="sap-code-badge">${escapeHtml(line.sapCode)}</span></td>
      <td style="max-width:240px;font-size:0.78rem;">${escapeHtml(line.description)}</td>
      <td>
        <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.72rem;font-weight:600;color:${dotColor};">
          <span style="width:7px;height:7px;background:${dotColor};border-radius:50%;"></span>
          ${escapeHtml(line.category)}
        </span>
      </td>
      <td><span class="badge badge-gray" style="font-size:0.68rem;">${escapeHtml(line.uom)}</span></td>
      <td class="num">${line.consumptionPerBag.toFixed(6)}</td>
      <td class="num">${line.totalConsumption.toFixed(4)}</td>
      <td class="num">${line.wastagePercent.toFixed(1)}%</td>
      <td class="num">${line.wastageQty.toFixed(4)}</td>
      <td class="num" style="font-weight:700;color:var(--color-accent);">${line.netRequirement.toFixed(4)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Total row
  const totalTr = document.createElement('tr');
  totalTr.className = 'bom-total-row';
  totalTr.innerHTML = `
    <td colspan="6" style="text-align:right;padding-right:var(--space-4);">TOTAL (KG materials only)</td>
    <td class="num">${summary.totalNetKg.toFixed(4)}</td>
    <td class="num">—</td>
    <td class="num">—</td>
    <td class="num">${summary.totalGrossKg.toFixed(4)}</td>
  `;
  tbody.appendChild(totalTr);

  scroll.appendChild(tbl);
  tableWrap.appendChild(scroll);

  // SAP Preview section
  const sapPreview = buildSAPPreview(header, lines);
  tableWrap.appendChild(sapPreview);

  panel.appendChild(tableWrap);

  // ── Button events ──
  setTimeout(() => {
    document.getElementById('btn-bom-save')?.addEventListener('click', () => {
      saveBOM(header, lines);
    });
    document.getElementById('btn-bom-export-excel')?.addEventListener('click', () => {
      const sapRows = generateSAPBOM(header, lines);
      const txt = exportBOMExcel(header, lines, sapRows);
      downloadFile(txt, `BOM_${header.productCode}_${header.soNumber}.tsv`, 'text/tab-separated-values');
      showToast('BOM exported as Excel-compatible file.', 'success');
    });
    document.getElementById('btn-bom-export-sap')?.addEventListener('click', () => {
      const sapRows = generateSAPBOM(header, lines);
      const csv = exportSAPBOMCSV(header, sapRows);
      downloadFile(csv, `SAP_BOM_${header.productCode}.csv`, 'text/csv');
      showToast('SAP BOM CSV exported.', 'success');
    });
    document.getElementById('btn-bom-print')?.addEventListener('click', () => {
      const html = generateBOMPrintHTML(header, lines);
      const win  = window.open('', '_blank', 'width=900,height=800');
      win.document.write(html);
      win.document.close();
    });
  }, 0);
}

function buildSAPPreview(header, lines) {
  const sapRows = generateSAPBOM(header, lines);
  const previewLines = [
    `* SAP BOM UPLOAD — Generated by Satyendra Packaging ERP`,
    `* Product: ${header.productCode} — ${header.productName}`,
    `* Quantity: ${header.quantity} PCS | Plant: SPL1`,
    `*`,
    `MATNR,WERKS,STLAN,POSNR,POSTP,IDNRK,MENGE,MEINS`,
    ...sapRows.slice(0, 5).map(r =>
      `${r.MATNR},${r.WERKS},${r.STLAN},${r.POSNR},${r.POSTP},${r.IDNRK},${r.MENGE},${r.MEINS}`
    ),
    sapRows.length > 5 ? `... and ${sapRows.length - 5} more rows` : '',
  ];

  const section = document.createElement('div');
  section.style.padding = 'var(--space-4) var(--space-5)';
  section.style.borderTop = '1px solid var(--color-border)';
  section.innerHTML = `
    <div style="font-size:var(--font-size-xs);font-weight:700;color:var(--color-text-secondary);
      text-transform:uppercase;letter-spacing:0.07em;margin-bottom:var(--space-3);">
      ⚙️ SAP Upload Preview (CS01 Format)
    </div>
    <div class="sap-preview-box">
      ${previewLines.filter(Boolean).map(l => {
        if (l.startsWith('*'))  return `<div class="sap-preview-comment">${escapeHtml(l)}</div>`;
        if (l.startsWith('MA')) return `<div class="sap-preview-header">${escapeHtml(l)}</div>`;
        return `<div class="sap-preview-data">${escapeHtml(l)}</div>`;
      }).join('')}
    </div>
  `;
  return section;
}

function saveBOM(header, lines) {
  const bomRecord = {
    id:           getNextBOMId(),
    bomNumber:    header.bomNumber,
    soNumber:     header.soNumber,
    specNumber:   header.specNumber,
    productCode:  header.productCode,
    productName:  header.productName,
    productType:  header.productType,
    customerName: header.customerName,
    quantity:     header.quantity,
    uom:          'PCS',
    status:       header.status || 'Draft',
    generatedBy:  'Nitin Soni',
    generatedAt:  new Date().toISOString().split('T')[0],
    lines:        lines,
    totalBagWeight:     lines.reduce((s, l) => s + (l.uom === 'KG' ? l.consumptionPerBag * 1000 : 0), 0).toFixed(2),
    totalOrderWeightKg: lines.filter(l => l.uom === 'KG').reduce((s, l) => s + l.totalConsumption, 0).toFixed(2),
  };
  boms.push(bomRecord);
  showToast(`BOM ${bomRecord.bomNumber} saved successfully!`, 'success');
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

function metaItem(label, value) {
  return `<div class="bom-meta-item">
    <span class="bom-meta-label">${label}</span>
    <span class="bom-meta-value">${escapeHtml(String(value || '—'))}</span>
  </div>`;
}

function summaryBox(value, label) {
  return `<div class="bom-summary-box">
    <div class="bom-summary-box-val">${value}</div>
    <div class="bom-summary-box-lbl">${label}</div>
  </div>`;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
