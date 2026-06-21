/**
 * main.js — Application entry point
 * Satyendra Packaging ERP — Phase 1
 *
 * Imports all CSS first, then bootstraps the SPA via initApp()
 */

// ── CSS Imports (order matters) ──
import './css/common.css';
import './css/dashboard.css';
import './css/customer.css';
import './css/product.css';
import './css/salesorder.css';
import './css/specification.css';
import './css/calculator.css';

// ── App Bootstrap ──
import { initApp } from './js/app.js';

// Wait for DOM to be ready, then mount the ERP
document.addEventListener('DOMContentLoaded', () => {
  const appRoot = document.getElementById('app');

  if (!appRoot) {
    console.error('[ERP] Fatal: #app element not found in DOM.');
    return;
  }

  // Check for hash-based initial route
  const initialPage = window.location.hash.replace('#', '') || 'dashboard';

  // Boot the app
  initApp(appRoot, initialPage);

  console.log('[ERP] Satyendra Packaging ERP v2.0 — Phase 2 loaded ✅');
});
