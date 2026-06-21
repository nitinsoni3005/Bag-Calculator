/**
 * BOMReport.js — BOM Reports page
 * Lists all saved BOMs, allows drill-down, export, and print
 * Satyendra Packaging ERP — Phase 3
 */

import { boms, BOM_STATUSES } from '../data/boms.js';
import { generateSAPBOM, exportSAPBOMCSV, exportBOMExcel, generateBOMPrintHTML } from '../services/sapBomEngine.js';
import { calcBOMSummary } from '../services/bomEngine.js';
import { escapeHtml } from '../components/Table.js';
import { confirmDialog } from '../components/Modal.js';
import { showToast } from '../js/app.js';

/** State */
let _search      = '';
let _statusFilter = 'All';

const CAT_COLORS = {
  'Fabric':'#2563EB','Tape':'#7C3AED','BOPP Film':'#059669','Lamination':'#D97706',
  'Ink':'#DB2777','Thread':'#EA580C','Liner':'#0891B2','Packing Material':'#475569',
  'Adhesive':'#DC2626','Loop Material':'#0369A1','Handle Material':'#78716C',
};

export function renderBOMReport(container) {
  container.innerHTML = '';

  // ── Header ──
  const hdr = document.createElement('div');
  hdr.className = 'page-header';
  hdr.innerHTML = `
    <div>
      <h1 class="page-title">BOM Reports</h1>
      <p class="page-subtitle">View, export and print all generated Bills of Materials</p>
    </div>
    <div style="display:flex;gap:var(--space-3);">
      <button class="btn btn-secondary" id="btn-export-all-bom">📥 Export All</button>
      <button class="btn btn-primary"   id="btn-go-generate">+ Generate New BOM</button>
    </div>
  `;
  container.appendChild(hdr);

  // ── Summary Strip ──
  container.appendChild(buildReportSummary());

  // ── Toolbar ──
  const toolbar = document.createElement('div');
  toolbar.className = 'page-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-left">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input class="form-control" id="bom-rpt-search" type="text"
          placeholder="Search BOM#, SO#, product, customer..." value="${escapeHtml(_search)}" />
      </div>
      <div class="filter-chips" id="bom-rpt-chips">
        ${['All', ...BOM_STATUSES].map(s => `
          <button class="filter-chip ${_statusFilter === s ? 'active' : ''}" data-status="${s}">
            ${s}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  container.appendChild(toolbar);

  // ── BOM Report Cards ──
  const reportMain = document.createElement('div');
  reportMain.className = 'report-main';
  reportMain.id = 'bom-report-main';
  container.appendChild(reportMain);

  renderBOMCards(reportMain);

  // ── Events ──
  container.querySelector('#btn-go-generate').addEventListener('click', () => {
    window.location.hash = 'bom-generator';
  });
  container.querySelector('#btn-export-all-bom').addEventListener('click', exportAllBOMs);
  container.querySelector('#bom-rpt-search').addEventListener('input', e => {
    _search = e.target.value.trim();
    renderBOMCards(reportMain);
  });
  container.querySelector('#bom-rpt-chips').addEventListener('click', e => {
    const chip = e.target.closest('[data-status]');
    if (!chip) return;
    _statusFilter = chip.getAttribute('data-status');
    container.querySelectorAll('[data-status]').forEach(c =>
      c.classList.toggle('active', c.getAttribute('data-status') === _statusFilter)
    );
    renderBOMCards(reportMain);
  });
}

function renderBOMCards(container) {
  container.innerHTML = '';

  let data = [...boms];
  if (_statusFilter !== 'All') data = data.filter(b => b.status === _statusFilter);
  if (_search) {
    const t = _search.toLowerCase();
    data = data.filter(b =>
      b.bomNumber.toLowerCase().includes(t)    ||
      b.soNumber.toLowerCase().includes(t)     ||
      b.productName.toLowerCase().includes(t)  ||
      (b.customerName || '').toLowerCase().includes(t)
    );
  }

  if (!data.length) {
    container.innerHTML = `
      <div class="bom-table-wrapper">
        <div class="bom-empty-state">
          <div class="bom-empty-icon">📋</div>
          <div class="bom-empty-title">No BOMs Found</div>
          <div class="bom-empty-desc">
            ${_search || _statusFilter !== 'All'
              ? 'No BOMs match your filter criteria.'
              : 'No BOMs generated yet. Go to BOM Generator to create your first BOM.'}
          </div>
          <button class="btn btn-primary" onclick="window.location.hash='bom-generator'">Go to BOM Generator</button>
        </div>
      </div>
    `;
    return;
  }

  data.forEach(bom => {
    const lines   = bom.lines || [];
    const summary = calcBOMSummary(lines);
    const statusCls = `bom-status-${(bom.status || 'draft').toLowerCase()}`;

    const card = document.createElement('div');
    card.className = 'bom-report-card';
    card.setAttribute('data-bom-id', bom.id);

    // Card header
    const cardHdr = document.createElement('div');
    cardHdr.className = 'bom-report-card-header';
    cardHdr.innerHTML = `
      <div>
        <div class="bom-report-card-title">
          📋 ${escapeHtml(bom.bomNumber)} — ${escapeHtml(bom.productName)}
        </div>
        <div class="bom-report-card-sub">
          ${escapeHtml(bom.productCode)} | SO: ${escapeHtml(bom.soNumber)}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-2);">
        <span class="badge ${statusCls}">${escapeHtml(bom.status)}</span>
        <button class="btn btn-secondary btn-sm" data-bom-action="toggle" data-bom-id="${bom.id}">
          ▼ Details
        </button>
      </div>
    `;
    card.appendChild(cardHdr);

    // Meta strip
    const metaStrip = document.createElement('div');
    metaStrip.className = 'bom-report-meta-strip';
    metaStrip.innerHTML = `
      ${rptMeta('Customer',    bom.customerName?.slice(0, 30) || '—')}
      ${rptMeta('Order Qty',   `${(bom.quantity || 0).toLocaleString()} PCS`)}
      ${rptMeta('Spec Ref',    bom.specNumber || '—')}
      ${rptMeta('Generated',   bom.generatedAt || '—')}
      ${rptMeta('By',          bom.generatedBy || '—')}
      ${rptMeta('Total Net',   `${summary.totalNetKg.toFixed(2)} KG`)}
      ${rptMeta('Total Gross', `${summary.totalGrossKg.toFixed(2)} KG`)}
      ${rptMeta('Line Items',  summary.lineCount)}
    `;
    card.appendChild(metaStrip);

    // Collapsible BOM lines table (hidden by default)
    const linesSection = document.createElement('div');
    linesSection.id = `bom-lines-${bom.id}`;
    linesSection.style.display = 'none';

    if (lines.length > 0) {
      const scroll = document.createElement('div');
      scroll.style.overflowX = 'auto';
      const tbl = document.createElement('table');
      tbl.className = 'bom-report-table';
      tbl.innerHTML = `
        <thead><tr>
          <th style="padding-left:var(--space-5)">Seq</th>
          <th>SAP Code</th>
          <th>Description</th>
          <th>Category</th>
          <th>UOM</th>
          <th class="r">Cons/Bag</th>
          <th class="r">Total Net</th>
          <th class="r">Wastage%</th>
          <th class="r">Final Req</th>
        </tr></thead>
        <tbody>
          ${lines.map(line => {
            const dotColor = CAT_COLORS[line.category] || '#64748B';
            return `
              <tr>
                <td style="padding-left:var(--space-5)">
                  <span class="bom-seq" style="font-size:0.68rem;">${line.seq}</span>
                </td>
                <td><span class="sap-code-badge">${escapeHtml(line.sapCode)}</span></td>
                <td style="font-size:0.78rem;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${escapeHtml(line.description)}
                </td>
                <td>
                  <span style="display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;font-weight:600;color:${dotColor};">
                    <span style="width:6px;height:6px;border-radius:50%;background:${dotColor};"></span>
                    ${escapeHtml(line.category)}
                  </span>
                </td>
                <td><span class="badge badge-gray" style="font-size:0.68rem;">${escapeHtml(line.uom)}</span></td>
                <td class="r">${(line.consumptionPerBag || 0).toFixed(6)}</td>
                <td class="r">${(line.totalConsumption || 0).toFixed(4)}</td>
                <td class="r">${(line.wastagePercent || 0).toFixed(1)}%</td>
                <td class="r" style="font-weight:700;color:var(--color-accent);">
                  ${(line.netRequirement || 0).toFixed(4)} ${line.uom}
                </td>
              </tr>
            `;
          }).join('')}
          <tr style="background:#EFF6FF;">
            <td colspan="6" style="text-align:right;font-weight:700;padding-right:var(--space-4);font-size:0.78rem;">
              TOTAL (KG materials)
            </td>
            <td class="r" style="font-weight:700;">${summary.totalNetKg.toFixed(4)}</td>
            <td></td>
            <td class="r" style="font-weight:700;color:var(--color-accent);">${summary.totalGrossKg.toFixed(4)} KG</td>
          </tr>
        </tbody>
      `;
      scroll.appendChild(tbl);
      linesSection.appendChild(scroll);
    } else {
      linesSection.innerHTML = `<div style="padding:var(--space-4) var(--space-5);color:var(--color-text-muted);font-size:0.85rem;">No BOM lines recorded.</div>`;
    }
    card.appendChild(linesSection);

    // Card footer
    const footer = document.createElement('div');
    footer.className = 'bom-report-card-footer';
    footer.innerHTML = `
      <div class="bom-report-footer-total">
        Total Order Weight: <span style="color:var(--color-accent);">${bom.totalOrderWeightKg || summary.totalGrossKg.toFixed(2)} KG</span>
      </div>
      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-secondary btn-sm" data-bom-action="export-excel" data-bom-id="${bom.id}">📊 Excel</button>
        <button class="btn btn-secondary btn-sm" data-bom-action="export-sap"   data-bom-id="${bom.id}">⚙️ SAP CSV</button>
        <button class="btn btn-secondary btn-sm" data-bom-action="print"        data-bom-id="${bom.id}">🖨️ Print</button>
        <button class="btn btn-danger btn-sm"    data-bom-action="delete"       data-bom-id="${bom.id}">🗑️</button>
      </div>
    `;
    card.appendChild(footer);

    container.appendChild(card);

    // Toggle detail
    cardHdr.querySelector('[data-bom-action="toggle"]')?.addEventListener('click', () => {
      const isOpen = linesSection.style.display !== 'none';
      linesSection.style.display = isOpen ? 'none' : 'block';
      cardHdr.querySelector('[data-bom-action="toggle"]').textContent = isOpen ? '▼ Details' : '▲ Hide';
    });

    // Footer actions
    footer.addEventListener('click', async e => {
      const btn = e.target.closest('[data-bom-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-bom-action');
      const bId    = parseInt(btn.getAttribute('data-bom-id'), 10);
      const bomRec = boms.find(b => b.id === bId);
      if (!bomRec) return;

      if (action === 'export-excel') {
        const sapRows = generateSAPBOM(bomRec, bomRec.lines || []);
        const txt = exportBOMExcel(bomRec, bomRec.lines || [], sapRows);
        const a = Object.assign(document.createElement('a'), {
          href: URL.createObjectURL(new Blob([txt], { type: 'text/tab-separated-values' })),
          download: `BOM_${bomRec.productCode}_${bomRec.soNumber}.tsv`,
        });
        a.click();
        showToast('BOM exported as Excel file.', 'success');
      }

      if (action === 'export-sap') {
        const sapRows = generateSAPBOM(bomRec, bomRec.lines || []);
        const csv = exportSAPBOMCSV(bomRec, sapRows);
        const a = Object.assign(document.createElement('a'), {
          href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
          download: `SAP_BOM_${bomRec.productCode}.csv`,
        });
        a.click();
        showToast('SAP BOM CSV exported.', 'success');
      }

      if (action === 'print') {
        const html = generateBOMPrintHTML(bomRec, bomRec.lines || []);
        const win  = window.open('', '_blank', 'width=900,height=800');
        win.document.write(html);
        win.document.close();
      }

      if (action === 'delete') {
        const ok = await confirmDialog(`Delete BOM <strong>${bomRec.bomNumber}</strong>?`, 'Delete BOM');
        if (ok) {
          boms.splice(boms.indexOf(bomRec), 1);
          renderBOMCards(container);
          showToast(`${bomRec.bomNumber} deleted.`, 'success');
        }
      }
    });
  });
}

function buildReportSummary() {
  const strip = document.createElement('div');
  strip.className = 'so-summary-strip';
  strip.innerHTML = `
    <div class="so-summary-card">${scrd('📋', 'Total BOMs', boms.length)}</div>
    <div class="so-summary-card">${scrd('✅', 'Approved', boms.filter(b=>b.status==='Approved').length)}</div>
    <div class="so-summary-card">${scrd('📝', 'Draft', boms.filter(b=>b.status==='Draft').length)}</div>
    <div class="so-summary-card">${scrd('📦', 'Total Lines', boms.reduce((s,b)=>s+(b.lines||[]).length,0))}</div>
    <div class="so-summary-card">${scrd('🏭', 'Total Orders', [...new Set(boms.map(b=>b.soNumber))].length)}</div>
  `;
  return strip;
}

function scrd(icon, label, value) {
  return `<div style="font-size:1.2rem;">${icon}</div>
    <div class="so-summary-value">${value}</div>
    <div class="so-summary-label">${label}</div>`;
}

function rptMeta(label, value) {
  return `<div class="bom-report-meta-item">
    <div class="bom-report-meta-label">${label}</div>
    <div class="bom-report-meta-value">${escapeHtml(String(value || '—'))}</div>
  </div>`;
}

function exportAllBOMs() {
  if (!boms.length) { showToast('No BOMs to export.', 'info'); return; }
  const rows = boms.map(b => [
    b.bomNumber, b.soNumber, b.productCode, b.productName, b.customerName,
    b.quantity, b.status, b.generatedAt, b.generatedBy,
    (b.lines || []).length,
    boms.find(x => x.id === b.id)
      ? (b.lines || []).filter(l => l.uom === 'KG').reduce((s, l) => s + l.netRequirement, 0).toFixed(4)
      : 0,
  ]);
  const csv = [
    ['BOM#','SO#','Product Code','Product Name','Customer','Qty','Status','Generated','By','Lines','Total KG (Gross)'],
    ...rows,
  ].map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');

  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: 'all_boms.csv',
  });
  a.click();
  showToast('All BOMs exported.', 'success');
}
