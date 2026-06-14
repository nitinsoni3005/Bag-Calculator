/**
 * Dashboard.js — Dashboard page
 * Shows KPI cards, recent activities, and quick summary
 * Satyendra Packaging ERP — Phase 1
 */

import { createStatCard } from '../components/Card.js';
import { customers } from '../data/customers.js';
import { products } from '../data/products.js';

/** Recent activity log (sample data) */
const RECENT_ACTIVITIES = [
  { date: '14 Jun 2026', activity: 'New Sales Order created — ZAD/2627/200151 (Blue Rose Rice 10kg)',    user: 'Mr. Anand',   type: 'order',    status: 'Active' },
  { date: '14 Jun 2026', activity: 'Work Order released for ZAD/2627/200151 — 25,000 bags',              user: 'Nitin Soni',  type: 'work',     status: 'Active' },
  { date: '13 Jun 2026', activity: 'Customer added — M.RAMSINGH AGRO FOODS PVT LTD',                    user: 'Nitin Soni',  type: 'customer', status: 'Done' },
  { date: '13 Jun 2026', activity: 'BOPP Film dispatched to Printing — 164 KGS (RGP04179)',              user: 'Store Dept',  type: 'material', status: 'Done' },
  { date: '12 Jun 2026', activity: 'BOM generated — FGS03783-BLUE ROSE STEAM RICE 10 KG',               user: 'Nitin Soni',  type: 'bom',      status: 'Done' },
  { date: '12 Jun 2026', activity: 'Lamination completed — 1,325 KGS laminated fabric ready',           user: 'Prod. Team',  type: 'prod',     status: 'Done' },
  { date: '11 Jun 2026', activity: 'Invoice raised — ZAD/2526/200931, Qty: 10,000 PCS',                 user: 'Accounts',    type: 'invoice',  status: 'Done' },
  { date: '11 Jun 2026', activity: 'Raw material received — Natural PP tape 587 KGS',                   user: 'Store Dept',  type: 'material', status: 'Done' },
  { date: '10 Jun 2026', activity: 'Product Master updated — FGS05305 SARSA TUBE BAG',                  user: 'Nitin Soni',  type: 'product',  status: 'Done' },
  { date: '09 Jun 2026', activity: 'Quotation sent — SPL/25-26/Q/06/01 to M.RAMSINGH AGRO',            user: 'Mr. Anand',   type: 'quote',    status: 'Done' },
];

/** KPI stats */
const STATS = [
  {
    title: 'Total Customers',
    key: 'customers',
    icon: '👥',
    color: 'blue',
    trend: '+3 this month',
    trendDir: 'up',
    subtitle: 'Registered customers',
  },
  {
    title: 'Total Products',
    key: 'products',
    icon: '📦',
    color: 'green',
    trend: '+2 this month',
    trendDir: 'up',
    subtitle: 'Active SKUs',
  },
  {
    title: 'Active Orders',
    key: 'orders',
    value: 32,
    icon: '🛒',
    color: 'orange',
    trend: '+8 this week',
    trendDir: 'up',
    subtitle: 'Open sales orders',
  },
  {
    title: 'Monthly Production',
    key: 'production',
    value: '120 MT',
    icon: '🏭',
    color: 'purple',
    trend: '+5% vs last month',
    trendDir: 'up',
    subtitle: 'Jun 2026',
  },
];

/** Activity type icon map */
const ACTIVITY_ICONS = {
  order:    { icon: '🛒', color: '#2563EB' },
  work:     { icon: '🏭', color: '#7C3AED' },
  customer: { icon: '👥', color: '#059669' },
  material: { icon: '📦', color: '#D97706' },
  bom:      { icon: '⚙️', color: '#0891B2' },
  prod:     { icon: '🔧', color: '#9333EA' },
  invoice:  { icon: '💰', color: '#16A34A' },
  product:  { icon: '📋', color: '#EA580C' },
  quote:    { icon: '📄', color: '#0284C7' },
};

/**
 * Renders the Dashboard page into the given container.
 * @param {HTMLElement} container - The #main-content element
 */
export function renderDashboard(container) {
  // Live values from data
  const liveValues = {
    customers: customers.filter(c => c.status === 'Active').length,
    products:  products.filter(p => p.status === 'Active').length,
    orders:    32,
    production: '120 MT',
  };

  container.innerHTML = '';

  // ── Welcome Banner ──
  const banner = document.createElement('div');
  banner.className = 'welcome-banner';
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  banner.innerHTML = `
    <div>
      <h2>${greeting}, Nitin! 👋</h2>
      <p>Here's what's happening at Satyendra Packaging today — ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  `;
  container.appendChild(banner);

  // ── Stats Grid ──
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';

  STATS.forEach(stat => {
    const value = liveValues[stat.key] ?? stat.value;
    const card = createStatCard({
      title:    stat.title,
      value:    value,
      icon:     stat.icon,
      color:    stat.color,
      trend:    stat.trend,
      trendDir: stat.trendDir,
      subtitle: stat.subtitle,
    });
    statsGrid.appendChild(card);
  });

  container.appendChild(statsGrid);

  // ── Bottom Grid: Activity + Summary ──
  const grid = document.createElement('div');
  grid.className = 'dashboard-grid';

  // ── Recent Activity Panel ──
  const activityPanel = document.createElement('div');
  activityPanel.className = 'panel';
  activityPanel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Recent Activities</span>
      <span class="badge badge-info">${RECENT_ACTIVITIES.length} records</span>
    </div>
    <div class="panel-body" style="overflow-x: auto;">
      <table class="activity-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Activity</th>
            <th>User</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${RECENT_ACTIVITIES.map(row => {
            const actInfo = ACTIVITY_ICONS[row.type] || { icon: '📌', color: '#64748B' };
            const statusClass = row.status === 'Active' ? 'badge-info' : 'badge-success';
            return `
              <tr>
                <td style="white-space:nowrap; color: var(--color-text-muted); font-size: 0.75rem;">${row.date}</td>
                <td>
                  <span style="margin-right:6px;">${actInfo.icon}</span>
                  <span>${row.activity}</span>
                </td>
                <td style="white-space:nowrap;">
                  <span class="badge badge-gray">${row.user}</span>
                </td>
                <td>
                  <span class="badge ${statusClass}">${row.status}</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // ── Quick Summary Panel ──
  const summaryPanel = document.createElement('div');
  summaryPanel.className = 'panel';

  const summaryItems = [
    { label: 'PP Woven Bags',    value: '18 Products', color: '#2563EB' },
    { label: 'BOPP Bags',        value: '12 Products', color: '#7C3AED' },
    { label: 'Laminated Bags',   value: '8 Products',  color: '#059669' },
    { label: 'FIBC / Jumbo Bag', value: '3 Products',  color: '#D97706' },
    { label: 'Pouches / Others', value: '4 Products',  color: '#DB2777' },
    { label: 'Active Orders',    value: '32 Orders',   color: '#0891B2' },
    { label: 'Pending Dispatch', value: '7 Orders',    color: '#EA580C' },
    { label: 'Completed (Jun)',  value: '25 Orders',   color: '#16A34A' },
  ];

  summaryPanel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Quick Summary</span>
    </div>
    <div class="panel-body">
      <div class="summary-list">
        ${summaryItems.map(item => `
          <div class="summary-item">
            <span class="summary-item-label">
              <span class="summary-dot" style="background:${item.color};"></span>
              ${item.label}
            </span>
            <span class="summary-item-value">${item.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  grid.appendChild(activityPanel);
  grid.appendChild(summaryPanel);
  container.appendChild(grid);
}
