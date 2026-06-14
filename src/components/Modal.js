/**
 * Modal.js — Reusable modal dialog component
 * Satyendra Packaging ERP — Phase 1
 */

/** Currently active modal instance */
let _activeModal = null;

/**
 * Opens a modal dialog.
 * @param {Object} options
 * @param {string} options.id           - Unique modal id (used for DOM id)
 * @param {string} options.title        - Modal header title
 * @param {string} options.body         - HTML string for modal body
 * @param {string} [options.size]       - 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 * @param {Array}  [options.footer]     - Array of button configs: { label, className, onClick, type }
 * @param {Function} [options.onClose]  - Callback when modal is closed
 * @returns {HTMLElement} The modal overlay element
 */
export function openModal({ id, title, body, size = 'md', footer = [], onClose }) {
  // Remove any existing modal with same id
  closeModal(id);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = `modal-overlay-${id}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', `modal-title-${id}`);

  overlay.innerHTML = `
    <div class="modal modal-${size}" id="modal-${id}">
      <!-- Header -->
      <div class="modal-header">
        <h3 class="modal-title" id="modal-title-${id}">${title}</h3>
        <button class="modal-close-btn" id="modal-close-${id}" aria-label="Close modal">
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body" id="modal-body-${id}">
        ${body}
      </div>

      <!-- Footer -->
      ${footer.length > 0 ? `
        <div class="modal-footer">
          ${footer.map(btn => `
            <button
              class="btn ${btn.className || 'btn-secondary'}"
              data-modal-action="${btn.action || ''}"
              type="${btn.type || 'button'}"
            >
              ${btn.label}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(id);
      if (onClose) onClose();
    }
  });

  // Close button
  overlay.querySelector(`#modal-close-${id}`)?.addEventListener('click', () => {
    closeModal(id);
    if (onClose) onClose();
  });

  // Footer button click handlers
  if (footer.length > 0) {
    footer.forEach(btn => {
      if (btn.action) {
        overlay.querySelector(`[data-modal-action="${btn.action}"]`)
          ?.addEventListener('click', () => {
            if (btn.onClick) btn.onClick();
          });
      }
    });
  }

  // ESC key to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(id);
      if (onClose) onClose();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Focus trap: focus first input in modal
  setTimeout(() => {
    const firstInput = overlay.querySelector('input, select, textarea, button');
    if (firstInput) firstInput.focus();
  }, 100);

  _activeModal = { id, overlay, onClose };

  return overlay;
}

/**
 * Closes a modal by id.
 * @param {string} id - Modal id
 */
export function closeModal(id) {
  const overlay = document.getElementById(`modal-overlay-${id}`);
  if (!overlay) return;

  overlay.classList.remove('active');
  overlay.classList.add('closing');

  setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = '';
  }, 250);

  _activeModal = null;
}

/**
 * Updates the body content of an open modal.
 * @param {string} id
 * @param {string} html
 */
export function setModalBody(id, html) {
  const body = document.getElementById(`modal-body-${id}`);
  if (body) body.innerHTML = html;
}

/**
 * Shows a confirm dialog and returns a Promise<boolean>.
 * @param {string} message
 * @param {string} [title]
 * @returns {Promise<boolean>}
 */
export function confirmDialog(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    openModal({
      id: 'confirm-dialog',
      title,
      size: 'sm',
      body: `
        <div class="confirm-body">
          <div class="confirm-icon">⚠️</div>
          <p class="confirm-message">${message}</p>
        </div>
      `,
      footer: [
        {
          label: 'Cancel',
          className: 'btn btn-secondary',
          action: 'cancel',
          onClick: () => {
            closeModal('confirm-dialog');
            resolve(false);
          },
        },
        {
          label: 'Confirm',
          className: 'btn btn-danger',
          action: 'confirm',
          onClick: () => {
            closeModal('confirm-dialog');
            resolve(true);
          },
        },
      ],
      onClose: () => resolve(false),
    });
  });
}
