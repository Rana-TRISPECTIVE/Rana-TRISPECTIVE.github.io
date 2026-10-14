/**
 * PYQs Pro - Application Bootstrapper & Orchestrator
 * Pure native ES Module.
 */

import { APP_CONFIG } from './core/config.js';
import { db } from './core/database.js';
import { stateManager } from './core/state.js';
import { triggerSearch } from './search/search.js';
import { PYQTable } from './ui/table.js';
import { PYQFilters } from './ui/filters.js';
import { studyTimer } from './ui/timer.js';
import { PYQFullscreenController } from './ui/fullscreen.js';
import { openUnifiedIOModal, openConfirmDialog } from './ui/dialogs.js';
import { el, copyToClipboard } from './utils/helpers.js';
import { serializeCSV } from './data/csv.js';

class PYQApp {
  constructor() {
    this.root = null;
    this.table = null;
    this.filters = null;
    this.fullscreenController = null;
  }

  async start() {
    // 1. Locate or create root container
    this.root = document.getElementById('pyq-root') || document.querySelector('.pyq-app-container');
    if (!this.root) {
      this.root = el('div', { id: 'pyq-root', className: 'pyq-app-container' });
      document.body.appendChild(this.root);
    }

    // 2. Initialize Database and load records
    await db.init();
    const columns = await db.getColumns();
    const rows = await db.getAllRows();

    stateManager.setState({
      columns,
      rows,
      filteredRows: rows
    });

    // 3. Render Top Bar & App Layout
    this.renderLayout();

    // 4. Mount Subsystems
    this.fullscreenController = new PYQFullscreenController(this.root);

    // Initial search evaluation
    triggerSearch();

    // Setup global keyboard shortcuts
    this.bindKeyboardShortcuts();

    // Setup Toast Notification sync
    this.bindToastNotifications();
  }

  renderLayout() {
    this.root.innerHTML = '';

    // A. Top Navbar
    const topNav = el('header', { className: 'pyq-top-navbar', id: 'pyq-top-navbar' });

    // Modern Geometric Scanner Emblem SVG
    const logoWrapper = el('div', { className: 'pyq-brand-icon-wrapper' });
    const logoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    logoSvg.setAttribute('width', '32');
    logoSvg.setAttribute('height', '32');
    logoSvg.setAttribute('viewBox', '0 0 32 32');
    logoSvg.setAttribute('fill', 'none');
    logoSvg.setAttribute('class', 'pyq-logo-svg');
    logoSvg.innerHTML = `
      <defs>
        <linearGradient id="pyqLogoGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stop-color="#c084fc"/>
          <stop offset="0.5" stop-color="#9333ea"/>
          <stop offset="1" stop-color="#38bdf8"/>
        </linearGradient>
        <linearGradient id="pyqGlowGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#c084fc" stop-opacity="0.25"/>
          <stop offset="1" stop-color="#38bdf8" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#0d0419" stroke="url(#pyqLogoGrad)" stroke-width="1.75"/>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#pyqGlowGrad)"/>
      <path d="M7 11V8C7 7.44772 7.44772 7 8 7H11" stroke="#e9d5ff" stroke-width="1.75" stroke-linecap="round"/>
      <path d="M21 7H24C24.5523 7 25 7.44772 25 8V11" stroke="#e9d5ff" stroke-width="1.75" stroke-linecap="round"/>
      <path d="M7 21V24C7 24.5523 7.44772 25 8 25H11" stroke="#e9d5ff" stroke-width="1.75" stroke-linecap="round"/>
      <path d="M21 25H24C24.5523 25 25 24.5523 25 24V21" stroke="#e9d5ff" stroke-width="1.75" stroke-linecap="round"/>
      <circle cx="16" cy="15" r="4.5" stroke="#38bdf8" stroke-width="1.8"/>
      <path d="M19.2 18.2L22 21" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <path d="M10.5 15H12.5" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M19.5 15H21.5" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round"/>
    `;
    logoWrapper.appendChild(logoSvg);

    // Left Brand
    const brand = el('div', { className: 'pyq-brand-section' },
      logoWrapper,
      el('div', { className: 'pyq-brand-titles' },
        el('div', { className: 'pyq-title-row' },
          el('h1', { className: 'pyq-app-title' },
            'PYQs ',
            el('span', { className: 'pyq-title-pro' }, 'PRO')
          ),
          el('span', { className: 'pyq-author-badge' }, 'BY RANA')
        ),
        el('span', { className: 'pyq-counter-badge' }, this.getLiveCountText())
      )
    );
    topNav.appendChild(brand);

    // Right Action Controls
    const actionsToolbar = el('div', { className: 'pyq-actions-toolbar' });

    // 1. Smart Search Input
    const searchBox = el('div', { className: 'pyq-search-box' });
    const searchIcon = el('span', { className: 'pyq-search-icon', innerHTML: '&#128269;' });
    const searchInput = el('input', {
      type: 'text',
      id: 'pyq-smart-search',
      className: 'pyq-search-input',
      placeholder: 'Search keywords or topic:Budget year:2024...',
      value: stateManager.getState().searchQuery,
      oninput: (e) => {
        stateManager.setState({ searchQuery: e.target.value });
        clearBtn.style.display = e.target.value ? 'flex' : 'none';
        triggerSearch();
      }
    });

    const clearBtn = el('button', {
      type: 'button',
      className: 'pyq-search-clear',
      title: 'Clear search',
      innerHTML: '&times;',
      style: { display: stateManager.getState().searchQuery ? 'flex' : 'none' },
      onclick: () => {
        searchInput.value = '';
        stateManager.setState({ searchQuery: '' });
        clearBtn.style.display = 'none';
        triggerSearch();
        searchInput.focus();
      }
    });

    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchInput);
    searchBox.appendChild(clearBtn);
    actionsToolbar.appendChild(searchBox);

    // 2. Filter Rules Drawer Toggle
    const filterBtn = el('button', {
      type: 'button',
      className: `pyq-btn ${stateManager.getState().isFilterDrawerOpen ? 'pyq-btn-active' : 'pyq-btn-secondary'}`,
      title: 'Toggle advanced multi-rule filter drawer',
      onclick: () => {
        const { isFilterDrawerOpen } = stateManager.getState();
        stateManager.setState({ isFilterDrawerOpen: !isFilterDrawerOpen });
      }
    },
      el('span', { innerHTML: '&#9776;' }),
      el('span', {}, 'Filters'),
      this.buildFilterCountBadge()
    );
    actionsToolbar.appendChild(filterBtn);
    stateManager.subscribeKey('isFilterDrawerOpen', (isOpen) => {
      filterBtn.className = `pyq-btn ${isOpen ? 'pyq-btn-active' : 'pyq-btn-secondary'}`;
    });

    // 3. Bookmark Filter Toggle
    const bookmarkBtn = el('button', {
      type: 'button',
      className: `pyq-btn ${stateManager.getState().bookmarkOnly ? 'pyq-btn-active' : 'pyq-btn-secondary'}`,
      title: 'Filter to show bookmarked questions only',
      onclick: () => {
        const next = !stateManager.getState().bookmarkOnly;
        stateManager.setState({ bookmarkOnly: next });
        stateManager.showToast(next ? 'Showing Bookmarked questions only ★' : 'Showing All questions', 'info');
        triggerSearch();
      }
    },
      el('span', { innerHTML: '&#9733;' }),
      el('span', {}, 'Bookmarks')
    );
    actionsToolbar.appendChild(bookmarkBtn);
    stateManager.subscribeKey('bookmarkOnly', (next) => {
      bookmarkBtn.className = `pyq-btn ${next ? 'pyq-btn-active' : 'pyq-btn-secondary'}`;
    });

    // 4. Study Timer Trigger
    const timerBtn = el('button', {
      type: 'button',
      className: 'pyq-btn pyq-btn-secondary',
      title: 'Open isolated floating Mains study timer',
      onclick: () => {
        studyTimer.open();
      }
    },
      el('span', { innerHTML: '&#9201;' }),
      el('span', {}, 'Study Timer')
    );
    actionsToolbar.appendChild(timerBtn);
    stateManager.subscribeKey('isTimerOpen', (isOpen) => {
      timerBtn.className = `pyq-btn ${isOpen ? 'pyq-btn-active' : 'pyq-btn-secondary'}`;
    });

    // 5. Unified Import / Export Modal Trigger
    const ioBtn = el('button', {
      type: 'button',
      className: 'pyq-btn pyq-btn-secondary',
      title: 'Import CSV/XLSX/JSON or Export database (Markdown/CSV/JSON/XLSX)',
      onclick: () => openUnifiedIOModal('import')
    },
      el('span', { innerHTML: '&#8644;' }),
      el('span', {}, 'Import / Export')
    );
    actionsToolbar.appendChild(ioBtn);

    // 6. Fullscreen Focus Mode Toggle (Icon Only)
    const focusBtn = el('button', {
      type: 'button',
      className: 'pyq-btn pyq-btn-secondary pyq-btn-icon-only pyq-btn-focus-mode',
      title: 'Fullscreen Focus Mode (F11 / Esc to exit)',
      onclick: () => this.fullscreenController.toggleFocusMode()
    });
    const fsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fsSvg.setAttribute('width', '16');
    fsSvg.setAttribute('height', '16');
    fsSvg.setAttribute('viewBox', '0 0 24 24');
    fsSvg.setAttribute('fill', 'none');
    fsSvg.setAttribute('stroke', 'currentColor');
    fsSvg.setAttribute('stroke-width', '2');
    fsSvg.setAttribute('stroke-linecap', 'round');
    fsSvg.setAttribute('stroke-linejoin', 'round');
    fsSvg.innerHTML = `
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    `;
    focusBtn.appendChild(fsSvg);
    actionsToolbar.appendChild(focusBtn);

    // 7. Exit Fullscreen Focus Mode Button (shown only when Focus Mode is active)
    const exitFocusBtn = el('button', {
      type: 'button',
      className: 'pyq-btn pyq-btn-primary pyq-exit-focus-btn',
      title: 'Exit Fullscreen Focus Mode (Esc)',
      onclick: () => this.fullscreenController.exitFocusMode()
    });
    const exitFsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exitFsSvg.setAttribute('width', '14');
    exitFsSvg.setAttribute('height', '14');
    exitFsSvg.setAttribute('viewBox', '0 0 24 24');
    exitFsSvg.setAttribute('fill', 'none');
    exitFsSvg.setAttribute('stroke', 'currentColor');
    exitFsSvg.setAttribute('stroke-width', '2');
    exitFsSvg.setAttribute('stroke-linecap', 'round');
    exitFsSvg.setAttribute('stroke-linejoin', 'round');
    exitFsSvg.innerHTML = `
      <path d="M4 14h6m0 0v6m0-6L3 21m17-11h-6m0 0V4m0 6l7-7"/>
    `;
    exitFocusBtn.appendChild(exitFsSvg);
    exitFocusBtn.appendChild(el('span', {}, 'Exit (Esc)'));
    actionsToolbar.appendChild(exitFocusBtn);

    topNav.appendChild(actionsToolbar);
    this.root.appendChild(topNav);

    // B. Filter Drawer Mount
    const filterContainer = el('div', { id: 'pyq-filter-container' });
    this.root.appendChild(filterContainer);
    this.filters = new PYQFilters(filterContainer);

    // C. Virtualized Grid Mount
    const tableContainer = el('main', { id: 'pyq-grid-container', className: 'pyq-grid-wrapper' });
    this.root.appendChild(tableContainer);
    this.table = new PYQTable(tableContainer);

    // D. Toast Container
    this.toastContainer = el('div', { className: 'pyq-toast-container' });
    this.root.appendChild(this.toastContainer);

    // Keep live counter badge updated
    stateManager.subscribeKey('filteredRows', () => {
      const counterEl = this.root.querySelector('.pyq-counter-badge');
      if (counterEl) counterEl.textContent = this.getLiveCountText();
    });

    stateManager.subscribeKey('filters', () => {
      const badge = this.root.querySelector('.pyq-filter-badge');
      const { filters } = stateManager.getState();
      if (badge) {
        badge.textContent = String(filters.length);
        badge.style.display = filters.length > 0 ? 'inline-block' : 'none';
      }
    });
  }

  getLiveCountText() {
    const { filteredRows, rows } = stateManager.getState();
    if (filteredRows.length === rows.length) {
      return `(${rows.length} Questions)`;
    }
    return `(${filteredRows.length} of ${rows.length} Questions)`;
  }

  buildFilterCountBadge() {
    const { filters } = stateManager.getState();
    return el('span', {
      className: 'pyq-filter-badge',
      style: {
        display: filters.length > 0 ? 'inline-block' : 'none',
        backgroundColor: 'var(--pyq-purple-primary)',
        color: '#000000',
        borderRadius: 'var(--pyq-radius-full)',
        padding: '0 5px',
        fontSize: '10px',
        fontWeight: '800',
        marginLeft: '4px'
      }
    }, String(filters.length));
  }

  generateTableMarkdown(columns, rows) {
    if (!columns || columns.length === 0) return '';
    const headerLine = `| ${columns.map(c => c.name.replace(/\|/g, '\\|')).join(' | ')} |`;
    const dividerLine = `| ${columns.map(c => c.type === 'checkbox' ? ':---:' : ':---').join(' | ')} |`;

    const rowLines = rows.map(r => {
      const cellVals = columns.map(c => {
        const val = r.cells ? r.cells[c.id] : '';
        if (c.type === 'checkbox') return val ? '[x]' : '[ ]';
        if (c.type === 'select') return val ? `\`${String(val).replace(/\|/g, '\\|')}\`` : '';
        return String(val || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br/>');
      });
      return `| ${cellVals.join(' | ')} |`;
    });

    return [headerLine, dividerLine, ...rowLines].join('\n');
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl+K or / focuses search bar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('pyq-smart-search');
        if (searchInput) searchInput.focus();
      }
    });
  }

  bindToastNotifications() {
    stateManager.subscribeKey('toast', (toast) => {
      if (!this.toastContainer) return;
      this.toastContainer.innerHTML = '';
      if (!toast) return;

      const toastEl = el('div', { className: `pyq-toast pyq-toast-${toast.type}` },
        el('span', {}, toast.message)
      );
      this.toastContainer.appendChild(toastEl);
    });
  }
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new PYQApp();
    app.start();
  });
} else {
  const app = new PYQApp();
  app.start();
}
