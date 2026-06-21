/**
 * app.js — SPA Router, app initializer, and utility functions
 * Satyendra Packaging ERP — Phase 1
 *
 * Responsibilities:
 *  - Build the app shell (sidebar + navbar + content area)
 *  - Route page requests to the correct page module
 *  - Provide shared utilities: showToast()
 */

import { renderSidebar, updateSidebarActive } from '../components/Sidebar.js';
import { renderNavbar, updateNavbarBreadcrumb } from '../components/Navbar.js';
import { renderDashboard }          from '../pages/Dashboard.js';
import { renderCustomerMaster }      from '../pages/CustomerMaster.js';
import { renderProductMaster }       from '../pages/ProductMaster.js';
import { renderSalesOrder }          from '../pages/SalesOrder.js';
import { renderProductSpecification } from '../pages/ProductSpecification.js';
import { renderDimensionCalculator }  from '../pages/DimensionCalculator.js';
import { renderRawMaterialMaster }    from '../pages/RawMaterialMaster.js';
import { renderSAPMaterialMaster }    from '../pages/SAPMaterialMaster.js';
import { renderBOMGenerator }         from '../pages/BOMGenerator.js';
import { renderBOMReport }            from '../pages/BOMReport.js';

/** Current active page */
let _currentPage = 'dashboard';

/** References to key DOM nodes (set after shell render) */
let _sidebarEl   = null;
let _navbarEl    = null;
let _contentEl   = null;

/**
 * Bootstraps the ERP application.
 * Called once from main.js after CSS imports.
 * @param {HTMLElement} appRoot - The #app div
 * @param {string} [startPage='dashboard'] - Initial page to load
 */
export function initApp(appRoot, startPage = 'dashboard') {
  _currentPage = startPage;
  // Build the app shell HTML
  appRoot.innerHTML = `
    <!-- Sidebar overlay (mobile) -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- ── Sidebar ── -->
    <aside class="sidebar" id="sidebar" role="complementary" aria-label="Sidebar navigation">
    </aside>

    <!-- ── Main Wrapper ── -->
    <div class="main-wrapper" id="main-wrapper">

      <!-- Top Navbar -->
      <header class="navbar" id="navbar" role="banner">
      </header>

      <!-- Page Content -->
      <main class="page-content" id="main-content" role="main">
      </main>

    </div>

    <!-- Toast container (portal) -->
    <div id="toast-container"></div>
  `;

  // Cache DOM references
  _sidebarEl = document.getElementById('sidebar');
  _navbarEl  = document.getElementById('navbar');
  _contentEl = document.getElementById('main-content');

  // Render sidebar
  renderSidebar(_sidebarEl, _currentPage, handleNavigate);

  // Render navbar
  renderNavbar(_navbarEl, _currentPage, toggleMobileSidebar);

  // Mobile overlay click → close sidebar
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    _sidebarEl?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  });

  // Load initial page
  loadPage(_currentPage);
}

/**
 * Handles sidebar navigation click.
 * @param {string} pageId
 */
function handleNavigate(pageId) {
  if (pageId === _currentPage) return;
  _currentPage = pageId;

  // Update sidebar active state
  updateSidebarActive(pageId);

  // Update navbar breadcrumb
  updateNavbarBreadcrumb(pageId);

  // Close mobile sidebar
  _sidebarEl?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');

  // Load the new page
  loadPage(pageId);

  // Update browser URL hash (no-reload routing)
  window.location.hash = pageId;
}

/**
 * Loads the requested page module into the content area.
 * @param {string} pageId
 */
function loadPage(pageId) {
  if (!_contentEl) return;

  // Smooth fade transition
  _contentEl.style.opacity = '0';
  _contentEl.style.transform = 'translateY(8px)';

  setTimeout(() => {
    // Route to page renderer
    switch (pageId) {
      case 'dashboard':
        renderDashboard(_contentEl);
        break;

      case 'customer-master':
        renderCustomerMaster(_contentEl);
        break;

      case 'product-master':
        renderProductMaster(_contentEl);
        break;

      case 'sales-order':
        renderSalesOrder(_contentEl);
        break;

      case 'product-spec':
        renderProductSpecification(_contentEl);
        break;

      case 'dim-calculator':
        renderDimensionCalculator(_contentEl);
        break;

      case 'raw-material':
        renderRawMaterialMaster(_contentEl);
        break;

      case 'sap-material':
        renderSAPMaterialMaster(_contentEl);
        break;

      case 'bom-generator':
        renderBOMGenerator(_contentEl);
        break;

      case 'bom-report':
        renderBOMReport(_contentEl);
        break;

      default:
        renderNotFound(_contentEl, pageId);
    }

    // Fade in
    _contentEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    _contentEl.style.opacity    = '1';
    _contentEl.style.transform  = 'translateY(0)';

    // Scroll to top
    _contentEl.scrollTop = 0;
  }, 120);
}

/**
 * Toggles the sidebar open/close on mobile.
 */
function toggleMobileSidebar() {
  const isOpen = _sidebarEl?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('active', isOpen);
}

/**
 * Shows a 404-style page for unknown routes.
 * @param {HTMLElement} container
 * @param {string} pageId
 */
function renderNotFound(container, pageId) {
  container.innerHTML = `
    <div class="empty-state" style="height: 60vh;">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">Page Not Found</div>
      <div class="empty-state-desc">"${pageId}" is not a recognised page in this ERP system.</div>
      <button class="btn btn-primary" onclick="window.location.hash='dashboard'">
        Go to Dashboard
      </button>
    </div>
  `;
}

/**
 * Shows a toast notification.
 * Can be imported and called from any page/component.
 * @param {string} message
 * @param {'success' | 'error' | 'info'} type
 * @param {number} [duration=3500] - Auto-dismiss after ms
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${icons[type] || 'ℹ️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

/**
 * Handle hash-based routing on page load / back button.
 */
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && hash !== _currentPage) {
    handleNavigate(hash);
  }
});
