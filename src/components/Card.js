/**
 * Card.js — Reusable card component
 * Used for stat cards, info panels, etc.
 * Satyendra Packaging ERP — Phase 1
 */

/**
 * Creates a stat card element for the dashboard.
 * @param {Object} options
 * @param {string} options.title       - Card title
 * @param {string|number} options.value - Main stat value
 * @param {string} options.icon        - Emoji icon
 * @param {string} options.color       - Color variant: 'blue' | 'green' | 'orange' | 'purple'
 * @param {string} [options.trend]     - Optional trend text e.g. '+12%'
 * @param {string} [options.trendDir]  - 'up' | 'down'
 * @param {string} [options.subtitle]  - Optional small subtitle text
 * @returns {HTMLElement}
 */
export function createStatCard({ title, value, icon, color = 'blue', trend, trendDir = 'up', subtitle }) {
  const card = document.createElement('div');
  card.className = `stat-card ${color}`;

  card.innerHTML = `
    <div class="stat-card-top">
      <div class="stat-card-icon">${icon}</div>
      ${trend ? `
        <div class="stat-card-trend ${trendDir}">
          ${trendDir === 'up' ? '↑' : '↓'} ${trend}
        </div>
      ` : ''}
    </div>
    <div>
      <div class="stat-card-value">${value}</div>
      <div class="stat-card-label">${title}</div>
      ${subtitle ? `<div class="stat-card-sub">${subtitle}</div>` : ''}
    </div>
  `;

  return card;
}

/**
 * Creates a generic panel/card container.
 * @param {Object} options
 * @param {string} options.title        - Panel header title
 * @param {string} [options.actionHtml] - Optional HTML string for header right action
 * @param {string|HTMLElement} options.body - Panel body content
 * @returns {HTMLElement}
 */
export function createPanel({ title, actionHtml = '', body }) {
  const panel = document.createElement('div');
  panel.className = 'panel';

  const bodyHtml = typeof body === 'string' ? body : '';

  panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">${title}</span>
      ${actionHtml}
    </div>
    <div class="panel-body panel-body-content">
    </div>
  `;

  // If body is an HTMLElement, append it
  if (body instanceof HTMLElement) {
    panel.querySelector('.panel-body-content').appendChild(body);
  } else {
    panel.querySelector('.panel-body-content').innerHTML = bodyHtml;
  }

  return panel;
}

/**
 * Creates a simple info card with icon + text.
 * @param {string} icon
 * @param {string} label
 * @param {string} value
 * @returns {HTMLElement}
 */
export function createInfoCard(icon, label, value) {
  const card = document.createElement('div');
  card.className = 'info-card';
  card.innerHTML = `
    <span class="info-card-icon">${icon}</span>
    <div class="info-card-text">
      <span class="info-card-label">${label}</span>
      <span class="info-card-value">${value}</span>
    </div>
  `;
  return card;
}
