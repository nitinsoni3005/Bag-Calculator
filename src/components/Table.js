/**
 * Table.js — Reusable data table component
 * Satyendra Packaging ERP — Phase 1
 */

/**
 * Creates a data table.
 * @param {Object} options
 * @param {Array<{key: string, label: string, render?: Function}>} options.columns
 * @param {Array<Object>} options.data       - Array of row objects
 * @param {string} [options.emptyMessage]    - Message when no data
 * @returns {HTMLElement}                    - The <table> element
 */
export function createTable({ columns, data, emptyMessage = 'No records found.' }) {
  const table = document.createElement('table');
  table.className = 'data-table';

  // ── Head ──
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      ${columns.map(col => `<th>${col.label}</th>`).join('')}
    </tr>
  `;
  table.appendChild(thead);

  // ── Body ──
  const tbody = document.createElement('tbody');

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${columns.length}">
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-title">${emptyMessage}</div>
          </div>
        </td>
      </tr>
    `;
  } else {
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', row.id);

      tr.innerHTML = columns.map(col => {
        // If column has a custom render function, use it
        if (typeof col.render === 'function') {
          return `<td>${col.render(row[col.key], row)}</td>`;
        }
        // Default: escape and display
        return `<td>${escapeHtml(String(row[col.key] ?? ''))}</td>`;
      }).join('');

      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  return table;
}

/**
 * Re-renders table body with new data (without recreating the whole table).
 * @param {HTMLElement} tableEl - Existing <table> element
 * @param {Array<Object>} data
 * @param {Array<Object>} columns
 */
export function refreshTableBody(tableEl, data, columns) {
  const tbody = tableEl.querySelector('tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${columns.length}">
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-title">No records found.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', row.id);

    tr.innerHTML = columns.map(col => {
      if (typeof col.render === 'function') {
        return `<td>${col.render(row[col.key], row)}</td>`;
      }
      return `<td>${escapeHtml(String(row[col.key] ?? ''))}</td>`;
    }).join('');

    tbody.appendChild(tr);
  });
}

/**
 * Basic HTML escape to prevent XSS in table cells.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
