/**
 * Navbar.js — Top navbar component
 * Shows breadcrumb, current page title, and utility icons
 * Satyendra Packaging ERP — Phase 1
 */

/** Page title map */
const PAGE_TITLES = {
  'dashboard':       { title: 'Dashboard',              breadcrumb: ['Home', 'Dashboard'] },
  'customer-master': { title: 'Customer Master',         breadcrumb: ['Master Data', 'Customer Master'] },
  'product-master':  { title: 'Product Master',          breadcrumb: ['Master Data', 'Product Master'] },
  'sales-order':     { title: 'Sales Orders',            breadcrumb: ['Production', 'Sales Orders'] },
  'product-spec':    { title: 'Product Specification',   breadcrumb: ['Production', 'Product Specification'] },
  'dim-calculator':  { title: 'Dimension Calculator',    breadcrumb: ['Production', 'Dimension Calculator'] },
};

/**
 * Renders the navbar HTML into the given container element.
 * @param {HTMLElement} container - The element to render navbar into
 * @param {string} activePage - Current page id
 * @param {Function} onMobileMenuToggle - Callback when hamburger is clicked
 */
export function renderNavbar(container, activePage, onMobileMenuToggle) {
  const pageInfo = PAGE_TITLES[activePage] || {
    title: 'ERP',
    breadcrumb: ['Home'],
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  container.innerHTML = `
    <div class="navbar-left">
      <!-- Hamburger for mobile -->
      <button class="navbar-hamburger" id="navbar-hamburger" aria-label="Toggle sidebar">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${pageInfo.breadcrumb.map((crumb, i) => `
          <span class="breadcrumb-item ${i === pageInfo.breadcrumb.length - 1 ? 'active' : ''}">
            ${crumb}
          </span>
          ${i < pageInfo.breadcrumb.length - 1 ? '<span class="breadcrumb-sep">›</span>' : ''}
        `).join('')}
      </nav>
    </div>

    <div class="navbar-right">
      <!-- Date display -->
      <span class="navbar-date">${today}</span>

      <!-- Divider -->
      <div class="navbar-divider"></div>

      <!-- Notification bell -->
      <button class="navbar-icon-btn" aria-label="Notifications" title="Notifications">
        <span class="icon">🔔</span>
        <span class="notif-dot"></span>
      </button>

      <!-- Help -->
      <button class="navbar-icon-btn" aria-label="Help" title="Help">
        <span class="icon">❓</span>
      </button>

      <!-- Divider -->
      <div class="navbar-divider"></div>

      <!-- User avatar -->
      <div class="navbar-user">
        <div class="navbar-avatar">NS</div>
        <div class="navbar-user-text">
          <span class="navbar-user-name">Nitin Soni</span>
          <span class="navbar-user-role">Admin</span>
        </div>
      </div>
    </div>
  `;

  // Hamburger click → toggle sidebar on mobile
  const hamburger = container.querySelector('#navbar-hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      if (onMobileMenuToggle) onMobileMenuToggle();
    });
  }
}

/**
 * Updates only the breadcrumb section (faster than full re-render).
 * @param {string} activePage
 */
export function updateNavbarBreadcrumb(activePage) {
  const pageInfo = PAGE_TITLES[activePage] || {
    title: 'ERP',
    breadcrumb: ['Home'],
  };

  const breadcrumbEl = document.querySelector('.breadcrumb');
  if (!breadcrumbEl) return;

  breadcrumbEl.innerHTML = pageInfo.breadcrumb.map((crumb, i) => `
    <span class="breadcrumb-item ${i === pageInfo.breadcrumb.length - 1 ? 'active' : ''}">
      ${crumb}
    </span>
    ${i < pageInfo.breadcrumb.length - 1 ? '<span class="breadcrumb-sep">›</span>' : ''}
  `).join('');
}
