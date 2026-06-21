/**
 * Sidebar.js — Fixed sidebar navigation component
 * Satyendra Packaging ERP — Phase 1
 */

/** Navigation menu config */
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    enabled: true,
    section: null,
  },
  {
    id: null,
    label: 'MASTER DATA',
    icon: null,
    enabled: false,
    section: true, // section header
  },
  {
    id: 'customer-master',
    label: 'Customer Master',
    icon: '👥',
    enabled: true,
    section: null,
  },
  {
    id: 'product-master',
    label: 'Product Master',
    icon: '📦',
    enabled: true,
    section: null,
  },
  {
    id: null,
    label: 'PRODUCTION',
    icon: null,
    enabled: false,
    section: true,
  },
  {
    id: 'sales-order',
    label: 'Sales Order',
    icon: '🛒',
    enabled: true,   // Phase 2 ✓
    section: null,
  },
  {
    id: 'product-spec',
    label: 'Product Specification',
    icon: '📋',
    enabled: true,   // Phase 2 ✓
    section: null,
  },
  {
    id: 'dim-calculator',
    label: 'Dimension Calculator',
    icon: '🔢',
    enabled: true,   // Phase 2 ✓
    section: null,
  },
  {
    id: null,
    label: 'MATERIALS & BOM',
    icon: null,
    enabled: false,
    section: true,
  },
  {
    id: 'raw-material',
    label: 'Raw Material Master',
    icon: '🧱',
    enabled: true,    // Phase 3 ✓
    section: null,
  },
  {
    id: 'sap-material',
    label: 'SAP Material Master',
    icon: '⚙️',
    enabled: true,    // Phase 3 ✓
    section: null,
  },
  {
    id: 'bom-generator',
    label: 'BOM Generator',
    icon: '🔩',
    enabled: true,    // Phase 3 ✓
    section: null,
  },
  {
    id: 'bom-report',
    label: 'BOM Report',
    icon: '📊',
    enabled: true,    // Phase 3 ✓
    section: null,
  },
  {
    id: 'work-order',
    label: 'Work Order',
    icon: '🏭',
    enabled: false,
    badge: 'Soon',
    section: null,
  },
  {
    id: null,
    label: 'FINANCE',
    icon: null,
    enabled: false,
    section: true,
  },
  {
    id: 'costing',
    label: 'Costing',
    icon: '💰',
    enabled: false,
    badge: 'Soon',
    section: null,
  },
  {
    id: null,
    label: 'ANALYTICS',
    icon: null,
    enabled: false,
    section: true,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '📈',
    enabled: false,
    badge: 'Soon',
    section: null,
  },
];

/**
 * Renders sidebar HTML into the given container element.
 * @param {HTMLElement} container - The element to render sidebar into
 * @param {string} activePage - The currently active page id
 * @param {Function} onNavigate - Callback(pageId) when a nav item is clicked
 */
export function renderSidebar(container, activePage, onNavigate) {
  container.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-logo">
        <span class="sidebar-logo-icon">🏭</span>
        <div class="sidebar-logo-text">
          <span class="sidebar-company">Satyendra</span>
          <span class="sidebar-sub">Packaging ERP</span>
        </div>
      </div>
      <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close sidebar">
        ✕
      </button>
    </div>

    <nav class="sidebar-nav" role="navigation" aria-label="Main navigation">
      <ul class="sidebar-menu">
        ${NAV_ITEMS.map(item => renderNavItem(item, activePage)).join('')}
      </ul>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">NS</div>
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">Nitin Soni</span>
          <span class="sidebar-user-role">ERP Administrator</span>
        </div>
      </div>
    </div>
  `;

  // Attach click events to enabled nav items
  container.querySelectorAll('.sidebar-nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.getAttribute('data-page');
      if (pageId && onNavigate) {
        onNavigate(pageId);
      }
    });
  });

  // Close button (mobile)
  const closeBtn = container.querySelector('#sidebar-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.remove('open');
      document.querySelector('.sidebar-overlay')?.classList.remove('active');
    });
  }
}

/** Renders a single nav item or section header */
function renderNavItem(item, activePage) {
  // Section header
  if (item.section) {
    return `<li class="sidebar-section-header">${item.label}</li>`;
  }

  const isActive = item.id === activePage;
  const isDisabled = !item.enabled;

  return `
    <li>
      <a
        class="sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}"
        ${item.id ? `data-page="${item.id}"` : ''}
        href="#"
        ${isDisabled ? 'tabindex="-1" aria-disabled="true"' : ''}
        title="${item.label}"
      >
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
      </a>
    </li>
  `;
}

/**
 * Updates the active state of sidebar nav items without full re-render.
 * @param {string} activePage - New active page id
 */
export function updateSidebarActive(activePage) {
  document.querySelectorAll('.sidebar-nav-item[data-page]').forEach(el => {
    const isActive = el.getAttribute('data-page') === activePage;
    el.classList.toggle('active', isActive);
  });
}
