/**
 * DimensionCalculator.js — Standalone Dimension & Material Calculator
 * Quick calculation tool without saving to specifications
 * Satyendra Packaging ERP — Phase 2
 */

import {
  calcBOPPBagSpec,
  calcPPBagSpec,
  calcFIBCSpec,
  formatGrams,
  formatKg,
  inchToCm,
  cmToInch,
} from '../services/calculations.js';
import { showToast } from '../js/app.js';

/** Active bag type */
let _activeType = 'BOPP Bag';

/** Debounce timer */
let _timer = null;

/** Last calculated result */
let _result = null;

/** Bag type config */
const BAG_TYPES = [
  { id: 'BOPP Bag',     icon: '🎨', label: 'BOPP Bag' },
  { id: 'PP Woven Bag', icon: '🧵', label: 'PP Woven' },
  { id: 'Shopping Bag', icon: '🛍️', label: 'Shopping' },
  { id: 'FIBC',         icon: '🏗️', label: 'FIBC' },
];

/** Component colours for breakdown chart */
const COMPONENT_COLORS = {
  fabric:    '#2563EB',
  bopp:      '#7C3AED',
  lami:      '#059669',
  metalize:  '#0891B2',
  adhesive:  '#6366F1',
  ink:       '#F59E0B',
  thread:    '#EC4899',
  liner:     '#10B981',
  handle:    '#EF4444',
};

/**
 * Renders the Dimension Calculator page.
 * @param {HTMLElement} container
 */
export function renderDimensionCalculator(container) {
  container.innerHTML = '';

  // ── Page Header ──
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div>
      <h1 class="page-title">Dimension Calculator</h1>
      <p class="page-subtitle">Quick bag weight & material consumption calculator — updates in real-time</p>
    </div>
    <div style="display:flex;gap:var(--space-3);">
      <button class="btn btn-secondary" id="btn-copy-result" title="Copy result as text">📋 Copy Result</button>
      <button class="btn btn-secondary" id="btn-reset-calc">🔄 Reset</button>
    </div>
  `;
  container.appendChild(header);

  // ── Calculator layout ──
  const layout = document.createElement('div');
  layout.className = 'calc-layout';

  // ── Left: Input Panel ──
  const inputPanel = document.createElement('div');
  inputPanel.className = 'calc-input-panel';
  inputPanel.id = 'calc-input-panel';

  // ── Right: Result Panel ──
  const resultPanel = document.createElement('div');
  resultPanel.className = 'calc-result-panel';
  resultPanel.id = 'calc-result-panel';

  layout.appendChild(inputPanel);
  layout.appendChild(resultPanel);
  container.appendChild(layout);

  // Build panels
  buildInputPanel(inputPanel);
  buildResultPanel(resultPanel, null);

  // ── Header button events ──
  container.querySelector('#btn-reset-calc').addEventListener('click', () => {
    _result = null;
    buildInputPanel(inputPanel);
    buildResultPanel(resultPanel, null);
    showToast('Calculator reset.', 'info');
  });

  container.querySelector('#btn-copy-result').addEventListener('click', () => {
    if (!_result) { showToast('Calculate first to copy results.', 'info'); return; }
    const text = buildResultText(_result);
    navigator.clipboard.writeText(text).then(() => {
      showToast('Result copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Could not copy — please select and copy manually.', 'info');
    });
  });
}

// ─────────────────────────────────────────────────────────────
// INPUT PANEL
// ─────────────────────────────────────────────────────────────

function buildInputPanel(panel) {
  panel.innerHTML = `
    <div class="calc-panel-header">
      <div class="calc-panel-title">🔢 Input Parameters</div>
      <span class="badge badge-info" style="font-size:0.7rem;">Auto-calculates on input</span>
    </div>
    <div class="calc-panel-body">

      <!-- Type Selector -->
      <div class="calc-type-selector" id="calc-type-selector">
        ${BAG_TYPES.map(t => `
          <button class="calc-type-btn ${_activeType === t.id ? 'active' : ''}" data-type="${t.id}">
            <span class="calc-type-icon">${t.icon}</span>
            ${t.label}
          </button>
        `).join('')}
      </div>

      <!-- Dynamic fields -->
      <div id="calc-dynamic-fields">
      </div>

    </div>
  `;

  // Type selector events
  panel.querySelector('#calc-type-selector').addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    _activeType = btn.getAttribute('data-type');
    panel.querySelectorAll('.calc-type-btn').forEach(b =>
      b.classList.toggle('active', b.getAttribute('data-type') === _activeType)
    );
    renderCalcFields(panel.querySelector('#calc-dynamic-fields'), _activeType);
    _result = null;
    buildResultPanel(document.getElementById('calc-result-panel'), null);
  });

  // Render initial fields
  renderCalcFields(panel.querySelector('#calc-dynamic-fields'), _activeType);
}

/** Renders input fields based on type */
function renderCalcFields(container, type) {
  if (type === 'BOPP Bag') {
    container.innerHTML = buildBOPPCalcFields();
  } else if (type === 'PP Woven Bag') {
    container.innerHTML = buildPPCalcFields();
  } else if (type === 'Shopping Bag') {
    container.innerHTML = buildShoppingCalcFields();
  } else if (type === 'FIBC') {
    container.innerHTML = buildFIBCCalcFields();
  }

  // Unit converter row
  container.innerHTML += buildUnitConverterRow();

  // Attach input listeners
  container.querySelectorAll('.calc-input').forEach(input => {
    input.addEventListener('input', debounceCalc);
  });

  // Unit conversion buttons
  container.querySelector('#btn-inch-to-cm')?.addEventListener('click', () => {
    const w = parseFloat(container.querySelector('#calc-inch-w')?.value) || 0;
    const l = parseFloat(container.querySelector('#calc-inch-l')?.value) || 0;
    if (w > 0) container.querySelector('#calc-width').value = inchToCm(w).toFixed(2);
    if (l > 0) container.querySelector('#calc-length').value = inchToCm(l).toFixed(2);
    debounceCalc();
  });
}

function buildBOPPCalcFields() {
  return `
    <!-- Dimensions -->
    <div class="calc-section">
      <div class="calc-section-label">📐 Bag Dimensions</div>
      <div class="calc-grid-3">
        ${calcField('Width', 'calc-width', 'cm', '86.2', 0.1)}
        ${calcField('Length', 'calc-length', 'cm', '56', 0.1)}
        ${calcField('Gusset', 'calc-gusset', 'cm', '0', 0.1, false)}
      </div>
    </div>
    <!-- Fabric -->
    <div class="calc-section">
      <div class="calc-section-label">🧵 Fabric</div>
      <div class="calc-grid-3">
        ${calcField('Fabric GSM', 'calc-fgsm', 'g/m²', '22.2', 0.1)}
        ${calcField('Mesh (W)', 'calc-mesh-w', '/cm', '9.5', 0.5)}
        ${calcField('Mesh (F)', 'calc-mesh-f', '/cm', '9.5', 0.5)}
        ${calcField('Thread Wt', 'calc-thread', 'g', '2', 0.1, false)}
        ${calcField('Handle Wt', 'calc-handle', 'g', '5', 0.5, false)}
      </div>
    </div>
    <!-- BOPP Film -->
    <div class="calc-section">
      <div class="calc-section-label">🎨 BOPP Film</div>
      <div class="calc-grid-3">
        ${calcField('BOPP Micron', 'calc-bopp-mic', 'μm', '15', 1)}
        ${calcField('BOPP Width', 'calc-bopp-w', 'cm', '80', 1)}
        <div class="calc-field">
          <div class="calc-field-label">Print Sides</div>
          <div class="calc-input-wrap">
            <select class="calc-input" id="calc-bopp-sides" style="padding-right:8px;">
              <option value="1">Single</option>
              <option value="2">Both</option>
            </select>
          </div>
        </div>
        ${calcField('No. of Colors', 'calc-colors', 'clr', '6', 1, false)}
      </div>
    </div>
    <!-- Lamination -->
    <div class="calc-section">
      <div class="calc-section-label">✨ Lamination & Metalize</div>
      <div class="calc-grid-3">
        ${calcField('Lami Micron', 'calc-lami-mic', 'μm', '20', 1, false)}
        <div class="calc-field">
          <div class="calc-field-label">Lami Sides</div>
          <div class="calc-input-wrap">
            <select class="calc-input" id="calc-lami-sides" style="padding-right:8px;">
              <option value="1">1 Side</option>
              <option value="2">Both</option>
            </select>
          </div>
        </div>
        ${calcField('Metalize Mic', 'calc-meta-mic', 'μm', '15', 1, false)}
      </div>
    </div>
    <!-- Liner -->
    <div class="calc-section">
      <div class="calc-section-label">📦 Liner (optional)</div>
      <div class="calc-grid-3">
        ${calcField('Liner Micron', 'calc-liner-mic', 'μm', '0', 1, false)}
        ${calcField('Liner Width', 'calc-liner-w', 'cm', '0', 0.1, false)}
        ${calcField('Liner Length', 'calc-liner-l', 'cm', '0', 0.1, false)}
      </div>
    </div>
    <!-- Order -->
    <div class="calc-section">
      <div class="calc-section-label">🔢 Order Quantity</div>
      <div class="calc-grid-2">
        ${calcField('Quantity (PCS)', 'calc-qty', 'pcs', '25000', 100)}
        ${calcField('Wastage %', 'calc-wastage', '%', '3.5', 0.5, false)}
      </div>
    </div>
  `;
}

function buildPPCalcFields() {
  return `
    <div class="calc-section">
      <div class="calc-section-label">📐 Dimensions</div>
      <div class="calc-grid-2">
        ${calcField('Width', 'calc-width', 'cm', '61', 0.1)}
        ${calcField('Length', 'calc-length', 'cm', '100', 0.1)}
      </div>
    </div>
    <div class="calc-section">
      <div class="calc-section-label">🧵 Fabric</div>
      <div class="calc-grid-3">
        ${calcField('Fabric GSM', 'calc-fgsm', 'g/m²', '65', 0.1)}
        ${calcField('Mesh (W)', 'calc-mesh-w', '/cm', '9.5', 0.5)}
        ${calcField('Mesh (F)', 'calc-mesh-f', '/cm', '9.5', 0.5)}
        ${calcField('No. Colors', 'calc-colors', 'clr', '0', 1, false)}
        ${calcField('Thread Wt', 'calc-thread', 'g', '2', 0.1, false)}
      </div>
    </div>
    <div class="calc-section">
      <div class="calc-section-label">🔢 Quantity</div>
      <div class="calc-grid-2">
        ${calcField('Quantity (PCS)', 'calc-qty', 'pcs', '50000', 1000)}
        ${calcField('Wastage %', 'calc-wastage', '%', '3.5', 0.5, false)}
      </div>
    </div>
  `;
}

function buildShoppingCalcFields() {
  return `
    <div class="calc-section">
      <div class="calc-section-label">📐 Dimensions</div>
      <div class="calc-grid-2">
        ${calcField('Width', 'calc-width', 'cm', '30', 0.1)}
        ${calcField('Length', 'calc-length', 'cm', '40', 0.1)}
      </div>
    </div>
    <div class="calc-section">
      <div class="calc-section-label">🧵 Material</div>
      <div class="calc-grid-2">
        ${calcField('Fabric GSM', 'calc-fgsm', 'g/m²', '80', 0.1)}
        ${calcField('No. Colors', 'calc-colors', 'clr', '4', 1, false)}
      </div>
    </div>
    <div class="calc-section">
      <div class="calc-section-label">🔢 Quantity</div>
      <div class="calc-grid-2">
        ${calcField('Quantity (PCS)', 'calc-qty', 'pcs', '10000', 100)}
      </div>
    </div>
  `;
}

function buildFIBCCalcFields() {
  return `
    <div class="calc-section">
      <div class="calc-section-label">📐 FIBC Dimensions</div>
      <div class="calc-grid-3">
        ${calcField('Width', 'calc-width', 'cm', '90', 1)}
        ${calcField('Height', 'calc-length', 'cm', '140', 1)}
        ${calcField('Fabric GSM', 'calc-fgsm', 'g/m²', '200', 1)}
        ${calcField('Capacity', 'calc-capacity', 'KG', '1000', 50)}
        <div class="calc-field">
          <div class="calc-field-label">Safety Factor</div>
          <div class="calc-input-wrap">
            <select class="calc-input" id="calc-sf">
              <option value="5" selected>5:1</option>
              <option value="6">6:1</option>
              <option value="8">8:1</option>
              <option value="10">10:1</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div class="calc-section">
      <div class="calc-section-label">🔢 Quantity</div>
      <div class="calc-grid-2">
        ${calcField('Quantity (PCS)', 'calc-qty', 'pcs', '500', 10)}
      </div>
    </div>
  `;
}

function buildUnitConverterRow() {
  return `
    <div class="calc-section" style="background:var(--color-bg);border-radius:var(--radius-md);padding:var(--space-3);border:1px dashed var(--color-border);">
      <div class="calc-section-label">🔄 Inch → CM Converter</div>
      <div class="calc-grid-3">
        ${calcField('Width (inch)', 'calc-inch-w', '"', '', 0.25, false)}
        ${calcField('Length (inch)', 'calc-inch-l', '"', '', 0.25, false)}
        <div class="calc-field" style="justify-content:flex-end;padding-top:18px;">
          <button class="btn btn-secondary btn-sm" id="btn-inch-to-cm" style="width:100%;">
            ⇒ Convert to CM
          </button>
        </div>
      </div>
    </div>
  `;
}

/** Builds a single numeric input field */
function calcField(label, id, unit, placeholder = '', step = 1, required = true) {
  return `
    <div class="calc-field">
      <div class="calc-field-label">${label}${required ? ' *' : ''}</div>
      <div class="calc-input-wrap">
        <input
          class="calc-input"
          id="${id}"
          type="number"
          step="${step}"
          min="0"
          placeholder="${placeholder}"
        />
        <span class="calc-unit">${unit}</span>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// CALCULATION ENGINE CALL
// ─────────────────────────────────────────────────────────────

function debounceCalc() {
  clearTimeout(_timer);
  _timer = setTimeout(runCalc, 300);
}

function runCalc() {
  const inputPanel = document.getElementById('calc-input-panel');
  if (!inputPanel) return;

  const g  = id => parseFloat(inputPanel.querySelector(`#${id}`)?.value) || 0;
  const gi = id => parseInt(inputPanel.querySelector(`#${id}`)?.value)   || 0;

  let result = null;

  if (_activeType === 'BOPP Bag') {
    result = calcBOPPBagSpec({
      widthCm:           g('calc-width'),
      lengthCm:          g('calc-length'),
      gussetCm:          g('calc-gusset'),
      fabricGsm:         g('calc-fgsm'),
      boppMicron:        g('calc-bopp-mic'),
      boppWidthCm:       g('calc-bopp-w'),
      boppSides:         gi('calc-bopp-sides'),
      lamiMicron:        g('calc-lami-mic'),
      lamiSides:         gi('calc-lami-sides'),
      metalizeMicron:    g('calc-meta-mic'),
      noOfColors:        gi('calc-colors'),
      threadWeightGrams: g('calc-thread'),
      linerWidthCm:      g('calc-liner-w'),
      linerLengthCm:     g('calc-liner-l'),
      linerMicron:       g('calc-liner-mic'),
      handleWeightGrams: g('calc-handle'),
      quantity:          gi('calc-qty'),
      wastagePercent:    g('calc-wastage') || 3.5,
    });
  } else if (_activeType === 'PP Woven Bag') {
    result = calcPPBagSpec({
      widthCm:           g('calc-width'),
      lengthCm:          g('calc-length'),
      fabricGsm:         g('calc-fgsm'),
      noOfColors:        gi('calc-colors'),
      threadWeightGrams: g('calc-thread'),
      quantity:          gi('calc-qty'),
      wastagePercent:    g('calc-wastage') || 3.5,
    });
  } else if (_activeType === 'Shopping Bag') {
    result = calcPPBagSpec({
      widthCm:    g('calc-width'),
      lengthCm:   g('calc-length'),
      fabricGsm:  g('calc-fgsm'),
      noOfColors: gi('calc-colors'),
      quantity:   gi('calc-qty'),
    });
  } else if (_activeType === 'FIBC') {
    result = calcFIBCSpec({
      widthCm:   g('calc-width'),
      heightCm:  g('calc-length'),
      fabricGsm: g('calc-fgsm'),
      capacity:  g('calc-capacity'),
      sf:        gi('calc-sf'),
      quantity:  gi('calc-qty'),
    });
  }

  _result = result;
  buildResultPanel(document.getElementById('calc-result-panel'), result);
}

// ─────────────────────────────────────────────────────────────
// RESULT PANEL
// ─────────────────────────────────────────────────────────────

function buildResultPanel(panel, result) {
  if (!panel) return;
  panel.innerHTML = '';

  const bagWt  = result?.totalBagWt     || 0;
  const orderKg = result?.totalOrderWtKg || 0;

  // ── Big total display ──
  const totalDiv = document.createElement('div');
  totalDiv.className = 'calc-total-display';
  totalDiv.innerHTML = `
    <div class="calc-total-label">Total Bag Weight</div>
    <div class="calc-total-value">${bagWt > 0 ? bagWt.toFixed(2) : '—'}</div>
    <div class="calc-total-unit">${bagWt > 0 ? 'GRAMS / BAG' : 'Enter values to calculate'}</div>
    ${(orderKg > 0 || (result?.fabricGrossKg || 0) > 0) ? `
      <div class="calc-total-order">
        ${orderKg > 0 ? `
          <div class="calc-total-order-item">
            <div class="calc-total-order-val">${orderKg.toLocaleString()} KG</div>
            <div class="calc-total-order-lbl">Total Order Wt</div>
          </div>` : ''}
        ${(result?.fabricGrossKg || 0) > 0 ? `
          <div class="calc-total-order-item">
            <div class="calc-total-order-val">${result.fabricGrossKg} KG</div>
            <div class="calc-total-order-lbl">Fabric (Gross)</div>
          </div>` : ''}
        ${(result?.boppGrossMetres || 0) > 0 ? `
          <div class="calc-total-order-item">
            <div class="calc-total-order-val">${result.boppGrossMetres.toLocaleString()} m</div>
            <div class="calc-total-order-lbl">BOPP Film</div>
          </div>` : ''}
      </div>
    ` : ''}
  `;
  panel.appendChild(totalDiv);

  // ── Component breakdown card ──
  const breakdownCard = document.createElement('div');
  breakdownCard.className = 'calc-breakdown-card';

  const components = getComponents(result);
  const hasData = components.some(c => c.value > 0);

  breakdownCard.innerHTML = `
    <div class="calc-breakdown-header">
      <span class="calc-breakdown-title">📊 Component Breakdown</span>
      ${hasData ? `<span style="font-size:0.7rem;color:var(--color-text-muted);">per bag</span>` : ''}
    </div>
  `;

  if (!hasData) {
    breakdownCard.innerHTML += `
      <div class="empty-state" style="padding:var(--space-8);">
        <div class="empty-state-icon" style="font-size:2rem;">🧮</div>
        <div class="empty-state-title">No data yet</div>
        <div class="empty-state-desc">Fill in the dimensions to see breakdown.</div>
      </div>
    `;
  } else {
    components.forEach(comp => {
      const pct = bagWt > 0 ? Math.min((comp.value / bagWt) * 100, 100) : 0;
      const row = document.createElement('div');
      row.className = 'calc-component-row';
      row.innerHTML = `
        <div class="calc-component-icon" style="background:${comp.color}22;color:${comp.color};">${comp.icon}</div>
        <div class="calc-component-info">
          <div class="calc-component-name">${comp.label}</div>
          <div class="calc-component-bar-wrap">
            <div class="calc-component-bar" style="width:${pct.toFixed(1)}%;background:${comp.color};"></div>
          </div>
        </div>
        <div class="calc-component-value">${comp.value.toFixed(2)} g</div>
      `;
      breakdownCard.appendChild(row);
    });

    // Total row
    const totalRow = document.createElement('div');
    totalRow.className = 'calc-component-row';
    totalRow.style.background = '#F8FAFC';
    totalRow.innerHTML = `
      <div class="calc-component-icon" style="background:#0F172A22;color:#0F172A;font-size:0.9rem;">⚖️</div>
      <div class="calc-component-info">
        <div class="calc-component-name" style="font-weight:700;">TOTAL BAG WEIGHT</div>
      </div>
      <div class="calc-component-value" style="font-size:0.9rem;color:var(--color-accent);">${bagWt.toFixed(2)} g</div>
    `;
    breakdownCard.appendChild(totalRow);

    // Action row
    const actionRow = document.createElement('div');
    actionRow.className = 'calc-action-row';
    actionRow.innerHTML = `
      <button class="btn btn-secondary btn-sm" id="btn-print-calc">🖨️ Print</button>
      <button class="btn btn-primary btn-sm" id="btn-send-to-spec">📋 Send to Spec</button>
    `;
    breakdownCard.appendChild(actionRow);

    setTimeout(() => {
      document.getElementById('btn-print-calc')?.addEventListener('click', () => printCalcResult(result));
      document.getElementById('btn-send-to-spec')?.addEventListener('click', () => {
        showToast('Open Product Specification to create a full spec sheet.', 'info', 4000);
      });
    }, 0);
  }

  panel.appendChild(breakdownCard);

  // ── Material requirement card ──
  if (hasData) {
    const reqCard = document.createElement('div');
    reqCard.className = 'calc-breakdown-card';
    reqCard.innerHTML = `
      <div class="calc-breakdown-header">
        <span class="calc-breakdown-title">🏭 Order Material Requirements</span>
      </div>
      <div style="padding:var(--space-4);">
        <div class="order-total-grid">
          ${reqBox('Total Order Wt', orderKg > 0 ? `${orderKg.toFixed(1)} KG` : '—', '#0F172A')}
          ${reqBox('Fabric Net', result?.fabricNetKg > 0 ? `${result.fabricNetKg} KG` : '—', '#2563EB')}
          ${reqBox('Fabric Gross', result?.fabricGrossKg > 0 ? `${result.fabricGrossKg} KG` : '—', '#7C3AED')}
          ${reqBox('Fabric GPM', result?.fabricGpm > 0 ? `${result.fabricGpm} g/m` : '—', '#059669')}
          ${(result?.boppNetKg || 0) > 0 ? reqBox('BOPP (Net KG)', `${result.boppNetKg} KG`, '#0891B2') : ''}
          ${(result?.boppGrossKg || 0) > 0 ? reqBox('BOPP (Gross KG)', `${result.boppGrossKg} KG`, '#6366F1') : ''}
          ${(result?.boppNetMetres || 0) > 0 ? reqBox('BOPP Net Mtrs', `${result.boppNetMetres.toLocaleString()} m`, '#F59E0B') : ''}
          ${(result?.boppGrossMetres || 0) > 0 ? reqBox('BOPP Gross Mtrs', `${result.boppGrossMetres.toLocaleString()} m`, '#EF4444') : ''}
          ${result?.bagArea > 0 ? reqBox('Bag Area', `${result.bagArea} m²`, '#10B981') : ''}
          ${result?.boppArea > 0 ? reqBox('BOPP Area', `${result.boppArea} m²`, '#EC4899') : ''}
          ${result?.boppGpm > 0 ? reqBox('BOPP GPM', `${result.boppGpm} g/m`, '#8B5CF6') : ''}
          ${result?.breakingLoad > 0 ? reqBox('Breaking Load', `${result.breakingLoad} KG`, '#DC2626') : ''}
        </div>
      </div>
    `;
    panel.appendChild(reqCard);
  }
}

function reqBox(label, value, color) {
  return `
    <div class="order-total-item">
      <div class="order-total-item-label" style="color:${color};">${label}</div>
      <div class="order-total-item-value">${value}</div>
    </div>
  `;
}

function getComponents(r) {
  if (!r) return [];
  const all = [
    { label: 'Fabric',     icon: '🧵', key: 'fabricWt',    color: COMPONENT_COLORS.fabric  },
    { label: 'BOPP Film',  icon: '🎨', key: 'boppWt',      color: COMPONENT_COLORS.bopp    },
    { label: 'Lamination', icon: '✨', key: 'lamiWt',      color: COMPONENT_COLORS.lami    },
    { label: 'Metalize',   icon: '🔮', key: 'metalizeWt',  color: COMPONENT_COLORS.metalize },
    { label: 'Adhesive',   icon: '💧', key: 'adhesiveWt',  color: COMPONENT_COLORS.adhesive },
    { label: 'Ink',        icon: '🖨️', key: 'inkWt',       color: COMPONENT_COLORS.ink     },
    { label: 'Thread',     icon: '🪡', key: 'threadWt',    color: COMPONENT_COLORS.thread  },
    { label: 'Liner',      icon: '📦', key: 'linerWt',     color: COMPONENT_COLORS.liner   },
    { label: 'Handle',     icon: '👜', key: 'handleWt',    color: COMPONENT_COLORS.handle  },
  ];
  return all.map(c => ({ ...c, value: r[c.key] || 0 })).filter(c => c.value > 0);
}

function printCalcResult(result) {
  const comps = getComponents(result);
  const win = window.open('', '_blank', 'width=700,height=800');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Dimension Calculator — Satyendra Packaging</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 20px; }
      h1 { font-size: 16px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; }
      h2 { font-size: 13px; background: #0F172A; color: white; padding: 4px 8px; margin: 12px 0 6px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
      td, th { border: 1px solid #ccc; padding: 5px 8px; font-size: 11px; }
      th { background: #F1F5F9; width: 50%; }
      .total { background: #F0FDF4; font-size: 20px; font-weight: 900; color: #059669; text-align: center; padding: 12px; border: 2px solid #10B981; border-radius: 6px; margin: 10px 0; }
    </style></head><body>
    <h1>🏭 Dimension Calculator — Satyendra Packaging Limited</h1>
    <p style="text-align:center;font-size:11px;color:#666;">Calculated: ${new Date().toLocaleString('en-IN')} | Type: ${_activeType}</p>
    <h2>Weight Breakdown (Per Bag)</h2>
    <table>
      ${comps.map(c=>`<tr><th>${c.label}</th><td>${c.value.toFixed(4)} g</td></tr>`).join('')}
    </table>
    <div class="total">TOTAL BAG WEIGHT: ${result?.totalBagWt || 0} g / bag</div>
    <h2>Order Material Requirements</h2>
    <table>
      <tr><th>Total Order Weight</th><td>${result?.totalOrderWtKg || 0} KG</td></tr>
      <tr><th>Fabric (Net)</th><td>${result?.fabricNetKg || 0} KG</td></tr>
      <tr><th>Fabric (Gross)</th><td>${result?.fabricGrossKg || 0} KG</td></tr>
      <tr><th>Fabric GPM</th><td>${result?.fabricGpm || 0} g/m</td></tr>
      <tr><th>BOPP Film (KG)</th><td>${result?.boppGrossKg || 0} KG</td></tr>
      <tr><th>BOPP Film (Metres)</th><td>${result?.boppGrossMetres?.toLocaleString() || 0} m</td></tr>
      <tr><th>Bag Area</th><td>${result?.bagArea || 0} m²</td></tr>
    </table>
    <script>window.print();<\/script>
    </body></html>
  `);
  win.document.close();
}

function buildResultText(result) {
  if (!result) return '';
  return [
    `=== Satyendra Packaging ERP — Calculation Result ===`,
    `Type: ${_activeType}`,
    `Date: ${new Date().toLocaleString('en-IN')}`,
    ``,
    `--- Per Bag Weights ---`,
    `Fabric:     ${result.fabricWt    || 0} g`,
    `BOPP Film:  ${result.boppWt      || 0} g`,
    `Lamination: ${result.lamiWt      || 0} g`,
    `Metalize:   ${result.metalizeWt  || 0} g`,
    `Ink:        ${result.inkWt       || 0} g`,
    `Thread:     ${result.threadWt    || 0} g`,
    `Liner:      ${result.linerWt     || 0} g`,
    `Handle:     ${result.handleWt    || 0} g`,
    `TOTAL:      ${result.totalBagWt  || 0} g/bag`,
    ``,
    `--- Order Requirements ---`,
    `Total Order Weight: ${result.totalOrderWtKg || 0} KG`,
    `Fabric (Gross):     ${result.fabricGrossKg  || 0} KG`,
    `BOPP Film:          ${result.boppGrossKg    || 0} KG`,
    `BOPP Metres:        ${result.boppGrossMetres || 0} m`,
  ].join('\n');
}
