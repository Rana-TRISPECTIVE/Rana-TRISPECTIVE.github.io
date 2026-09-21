/**
 * PYQs Pro - High-Performance Virtualized Grid
 * Renders only visible rows in viewport to ensure 60fps scrolling across extensive Mains questions.
 * Handles drag-to-resize columns, sorting, bookmarking, and inline updates.
 */

import { el, copyToClipboard } from '../utils/helpers.js';
import { renderCell } from './editor.js';
import { stateManager } from '../core/state.js';
import { db } from '../core/database.js';
import { triggerSearch } from '../search/search.js';
import { openColumnDialog, openConfirmDialog } from './dialogs.js';

export class PYQTable {
  constructor(mountContainer, externalScrollContainer = null) {
    this.container = mountContainer;
    this.externalScroller = externalScrollContainer;
    this.tableScrollContainer = null;
    this.tbody = null;
    this.headerRow = null;

    // Virtualization metrics
    this.estimatedRowHeight = 64;
    this.overscan = 6;
    this.scrollTop = 0;
    this.containerHeight = 600;
    this.rowHeights = new Map(); // rowIndex -> measured height

    this.init();
  }

  init() {
    this.renderSkeleton();
    this.bindEvents();

    // Subscribe to state changes
    stateManager.subscribeKey('filteredRows', () => {
      this.renderFooter();
      this.renderRows();
    });
    stateManager.subscribeKey('columns', () => {
      this.renderHeader();
      this.renderRows();
    });
    stateManager.subscribeKey('sortState', () => {
      this.renderHeader();
      this.renderRows();
    });
    stateManager.subscribeKey('rowLimit', () => {
      this.renderFooter();
      this.renderRows();
    });
    stateManager.subscribeKey('rows', () => {
      this.renderFooter();
      this.renderRows();
    });
    stateManager.subscribeKey('isFocusMode', () => this.renderRows());
    stateManager.subscribeKey('isSuspended', (isSuspended) => {
      if (!isSuspended) this.renderRows();
    });

    // Resize observer to keep virtual window accurate
    if (window.ResizeObserver && this.tableScrollContainer) {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.height > 0) {
            this.containerHeight = entry.contentRect.height;
            this.renderRows();
          }
        }
      });
      ro.observe(this.tableScrollContainer);
    }
  }

  renderSkeleton() {
    this.container.innerHTML = '';

    const rootWrapper = el('div', { className: 'pyq-table-root' });

    // Internal scroll container dedicated strictly to table rows
    this.tableScrollContainer = el('div', { className: 'pyq-table-scroll-container' });

    const tableEl = el('table', { className: 'pyq-table' });
    this.colgroup = el('colgroup');
    const thead = el('thead', { className: 'pyq-thead' });
    this.headerRow = el('tr', { className: 'pyq-header-row' });
    thead.appendChild(this.headerRow);

    this.tbody = el('tbody', { className: 'pyq-tbody' });

    tableEl.appendChild(this.colgroup);
    tableEl.appendChild(thead);
    tableEl.appendChild(this.tbody);

    this.tableScrollContainer.appendChild(tableEl);
    rootWrapper.appendChild(this.tableScrollContainer);

    // Footer status bar (Always permanently pinned at bottom of table viewport)
    this.footerBar = el('div', { className: 'pyq-table-footer' });
    this.renderFooter();
    rootWrapper.appendChild(this.footerBar);

    this.container.appendChild(rootWrapper);

    this.containerHeight = this.tableScrollContainer.clientHeight || 600;

    this.renderHeader();
    this.renderRows();
  }

  bindEvents() {
    // Virtualized scroll listener with resource suspension check
    this.tableScrollContainer.addEventListener('scroll', () => {
      if (stateManager.getState().isSuspended) return; // Zero CPU lag during Study Timer
      this.scrollTop = this.tableScrollContainer.scrollTop;
      this.renderRows();
    }, { passive: true });
  }

  renderHeader() {
    const { columns, sortState } = stateManager.getState();
    this.headerRow.innerHTML = '';
    this.colgroup.innerHTML = '';

    // Col 1: Fixed index & bookmark
    const colBookmark = el('col', { style: { width: '56px' } });
    this.colgroup.appendChild(colBookmark);

    const thIndex = el('th', { className: 'pyq-th pyq-th-index' },
      el('span', { className: 'pyq-th-label' }, '#')
    );
    this.headerRow.appendChild(thIndex);

    // Dynamic Columns
    columns.forEach((col) => {
      const colWidth = col.width || (col.type === 'markdown' ? 320 : 160);
      const colTag = el('col', { style: { width: `${colWidth}px` } });
      this.colgroup.appendChild(colTag);

      const isSorted = sortState && sortState.columnId === col.id;
      const sortIcon = isSorted
        ? (sortState.direction === 'asc' ? ' &#9650;' : ' &#9660;')
        : '';

      const th = el('th', {
        className: `pyq-th pyq-th-${col.type} ${isSorted ? 'pyq-th-sorted' : ''}`,
        dataset: { colId: col.id }
      });

      const thInner = el('div', { className: 'pyq-th-inner' });

      // Title (clickable to sort)
      const titleSpan = el('span', {
        className: 'pyq-th-title',
        title: 'Click to sort',
        onclick: () => this.toggleSort(col.id),
        innerHTML: `${col.name}${sortIcon}`
      });
      thInner.appendChild(titleSpan);

      // Action menu button (rename, type, delete)
      const menuBtn = el('button', {
        type: 'button',
        className: 'pyq-col-menu-btn',
        title: 'Column Options',
        innerHTML: '&#8942;',
        onclick: (e) => {
          e.stopPropagation();
          openColumnDialog(col);
        }
      });
      thInner.appendChild(menuBtn);

      th.appendChild(thInner);

      // Drag-to-resize handle
      const resizeHandle = el('div', {
        className: 'pyq-resize-handle',
        title: 'Drag to resize column',
        onmousedown: (e) => this.initResize(e, col)
      });
      th.appendChild(resizeHandle);

      this.headerRow.appendChild(th);
    });

    // Col Last: Add Column & Row Actions
    const colActions = el('col', { style: { width: '80px' } });
    this.colgroup.appendChild(colActions);

    const thAdd = el('th', { className: 'pyq-th pyq-th-add-col' },
      el('button', {
        type: 'button',
        className: 'pyq-btn pyq-btn-xs pyq-btn-add-col',
        title: 'Add new column to database',
        onclick: () => openColumnDialog(null)
      }, '+ Column')
    );
    this.headerRow.appendChild(thAdd);
  }

  toggleSort(columnId) {
    const { sortState } = stateManager.getState();
    let nextSort = null;

    if (!sortState || sortState.columnId !== columnId) {
      nextSort = { columnId, direction: 'asc' };
    } else if (sortState.direction === 'asc') {
      nextSort = { columnId, direction: 'desc' };
    } else {
      nextSort = null; // Unsort
    }

    stateManager.setState({ sortState: nextSort });
    triggerSearch();
  }

  initResize(e, col) {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const initialWidth = col.width || 160;

    const onMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(70, Math.min(800, initialWidth + diff));

      const { columns } = stateManager.getState();
      const nextCols = columns.map(c => c.id === col.id ? { ...c, width: newWidth } : c);
      stateManager.setState({ columns: nextCols });
    };

    const onMouseUp = async () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      const { columns } = stateManager.getState();
      await db.saveColumns(columns);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  renderRows() {
    const { filteredRows, columns, rowLimit, isSuspended } = stateManager.getState();
    if (isSuspended) return;

    this.tbody.innerHTML = '';

    const limit = rowLimit === 'All' ? Infinity : Number(rowLimit) || 50;
    const displayList = filteredRows.slice(0, limit);
    const totalCount = displayList.length;

    if (totalCount === 0) {
      const emptyRow = el('tr', { className: 'pyq-empty-row' },
        el('td', {
          colSpan: columns.length + 2,
          className: 'pyq-empty-cell'
        },
          el('div', { className: 'pyq-empty-state' },
            el('div', { className: 'pyq-empty-icon', innerHTML: '&#128269;' }),
            el('p', { className: 'pyq-empty-title' }, 'No questions matched your search filters.'),
            el('p', { className: 'pyq-empty-hint' }, 'Try clearing keywords, disabling bookmark filters, or adding a new question.'),
            el('button', {
              type: 'button',
              className: 'pyq-btn pyq-btn-sm pyq-btn-primary pyq-mt-2',
              onclick: () => this.addNewRow()
            }, '+ Add New Question')
          )
        )
      );
      this.tbody.appendChild(emptyRow);
      this.renderFooter();
      return;
    }

    // --- VIRTUALIZATION ENGINE ---
    const visibleCount = Math.ceil((this.containerHeight || 600) / this.estimatedRowHeight);
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.estimatedRowHeight) - this.overscan);
    const endIndex = Math.min(totalCount, startIndex + visibleCount + (this.overscan * 2));

    const topSpacerHeight = startIndex * this.estimatedRowHeight;
    const bottomSpacerHeight = Math.max(0, (totalCount - endIndex) * this.estimatedRowHeight);

    // Top spacer
    if (topSpacerHeight > 0) {
      const topSpacer = el('tr', { className: 'pyq-virtual-spacer' },
        el('td', { colSpan: columns.length + 2, style: { height: `${topSpacerHeight}px` } })
      );
      this.tbody.appendChild(topSpacer);
    }

    // Render visible slice
    for (let i = startIndex; i < endIndex; i++) {
      const row = displayList[i];
      const tr = this.buildRowElement(row, i);
      this.tbody.appendChild(tr);
    }

    // Bottom spacer
    if (bottomSpacerHeight > 0) {
      const bottomSpacer = el('tr', { className: 'pyq-virtual-spacer' },
        el('td', { colSpan: columns.length + 2, style: { height: `${bottomSpacerHeight}px` } })
      );
      this.tbody.appendChild(bottomSpacer);
    }
  }

  buildRowElement(row, index) {
    const { columns } = stateManager.getState();
    const tr = el('tr', {
      className: `pyq-row ${row.bookmarked ? 'pyq-row-bookmarked' : ''}`,
      dataset: { rowId: row.id }
    });

    // 1. Index & Star Bookmark Cell
    const tdIndex = el('td', { className: 'pyq-td pyq-td-index' });
    const indexWrapper = el('div', { className: 'pyq-index-wrapper' });

    const starBtn = el('button', {
      type: 'button',
      className: `pyq-star-btn ${row.bookmarked ? 'pyq-star-active' : ''}`,
      title: row.bookmarked ? 'Remove bookmark' : 'Bookmark this question for quick revision',
      innerHTML: row.bookmarked ? '&#9733;' : '&#9734;',
      onclick: async (e) => {
        e.stopPropagation();
        await this.toggleRowBookmark(row.id);
      }
    });

    const numSpan = el('span', { className: 'pyq-row-number' }, String(index + 1));
    indexWrapper.appendChild(starBtn);
    indexWrapper.appendChild(numSpan);
    tdIndex.appendChild(indexWrapper);
    tr.appendChild(tdIndex);

    // 2. Data Cells
    columns.forEach((col) => {
      const td = el('td', { className: 'pyq-td' });
      const cellNode = renderCell({
        row,
        column: col,
        onCellChange: (rowId, colId, newVal) => this.handleCellUpdate(rowId, colId, newVal)
      });
      td.appendChild(cellNode);
      tr.appendChild(td);
    });

    // 3. Row Actions (Copy Row Markdown + Delete Row)
    const tdActions = el('td', { className: 'pyq-td pyq-td-row-actions' });
    const actionsWrapper = el('div', { className: 'pyq-row-actions-wrapper' });

    const copyRowBtn = el('button', {
      type: 'button',
      className: 'pyq-row-action-btn',
      title: 'Copy Question & Notes as Markdown',
      innerHTML: '&#128203;',
      onclick: (e) => {
        e.stopPropagation();
        this.copyRowMarkdown(row);
      }
    });

    const deleteRowBtn = el('button', {
      type: 'button',
      className: 'pyq-row-action-btn pyq-action-delete',
      title: 'Delete Question Row',
      innerHTML: '&#128465;',
      onclick: (e) => {
        e.stopPropagation();
        this.deleteRow(row.id);
      }
    });

    actionsWrapper.appendChild(copyRowBtn);
    actionsWrapper.appendChild(deleteRowBtn);
    tdActions.appendChild(actionsWrapper);
    tr.appendChild(tdActions);

    return tr;
  }

  async handleCellUpdate(rowId, columnId, newValue) {
    const { rows } = stateManager.getState();
    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          cells: { ...r.cells, [columnId]: newValue }
        };
      }
      return r;
    });

    stateManager.setState({ rows: updatedRows });

    // Update in database
    const targetRow = updatedRows.find(r => r.id === rowId);
    if (targetRow) {
      await db.putRow(targetRow);
    }

    triggerSearch();
  }

  async toggleRowBookmark(rowId) {
    const isBookmarked = await db.toggleBookmark(rowId);
    const { rows } = stateManager.getState();
    const nextRows = rows.map(r => r.id === rowId ? { ...r, bookmarked: isBookmarked } : r);
    stateManager.setState({ rows: nextRows });
    stateManager.showToast(isBookmarked ? 'Question bookmarked! ★' : 'Bookmark removed', 'info');
    triggerSearch();
  }

  async addNewRow() {
    const { columns, rows } = stateManager.getState();
    const newCells = {};

    columns.forEach(col => {
      newCells[col.id] = col.type === 'checkbox' ? false : '';
    });

    const newRow = {
      id: `pyq_row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      bookmarked: false,
      cells: newCells
    };

    const nextRows = [newRow, ...rows];
    stateManager.setState({ rows: nextRows });
    await db.putRow(newRow);
    stateManager.showToast('New question row created at top', 'success');
    triggerSearch();

    // Scroll to top
    if (this.tableScrollContainer) {
      this.tableScrollContainer.scrollTop = 0;
    }
  }

  async deleteRow(rowId) {
    openConfirmDialog({
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This action will remove it from IndexedDB.',
      confirmText: 'Delete Question',
      confirmType: 'danger',
      onConfirm: async () => {
        await db.deleteRow(rowId);
        const { rows } = stateManager.getState();
        stateManager.setState({ rows: rows.filter(r => r.id !== rowId) });
        stateManager.showToast('Question deleted', 'info');
        triggerSearch();
      }
    });
  }

  async copyRowMarkdown(row) {
    const { columns } = stateManager.getState();
    const lines = [];

    lines.push(`### ${row.cells.question || row.cells.title || 'Mains Question'}`);
    if (row.cells.year || row.cells.marks || row.cells.topic) {
      const meta = [];
      if (row.cells.topic) meta.push(`**Topic**: ${row.cells.topic}`);
      if (row.cells.year) meta.push(`**Year**: ${row.cells.year}`);
      if (row.cells.marks) meta.push(`**Marks**: ${row.cells.marks}M`);
      if (row.cells.status) meta.push(`**Status**: ${row.cells.status}`);
      lines.push(meta.join(' | '));
    }
    lines.push('');

    // Remaining fields
    columns.forEach(col => {
      if (col.id !== 'question' && col.id !== 'title' && col.id !== 'year' && col.id !== 'marks' && col.id !== 'topic' && col.id !== 'status') {
        const val = row.cells[col.id];
        if (val !== undefined && val !== null && val !== '') {
          lines.push(`**${col.name}**:`);
          lines.push(String(val));
          lines.push('');
        }
      }
    });

    const markdownText = lines.join('\n').trim();
    const success = await copyToClipboard(markdownText);
    if (success) {
      stateManager.showToast('Question copied as Markdown! 📋', 'success');
    }
  }

  renderFooter() {
    const { filteredRows, rows, rowLimit } = stateManager.getState();
    this.footerBar.innerHTML = '';

    const left = el('div', { className: 'pyq-footer-left' },
      el('span', { className: 'pyq-counter-label' }, 'Showing '),
      el('strong', { className: 'pyq-counter-highlight' }, String(Math.min(filteredRows.length, rowLimit === 'All' ? Infinity : Number(rowLimit) || 50))),
      el('span', { className: 'pyq-counter-label' }, ` of ${filteredRows.length} questions `),
      rows.length !== filteredRows.length
        ? el('span', { className: 'pyq-counter-total' }, `(${rows.length} total in database)`)
        : ''
    );

    const right = el('div', { className: 'pyq-footer-right' });

    // Limit Selector
    const limitWrapper = el('div', { className: 'pyq-limit-selector-group' },
      el('span', { className: 'pyq-limit-label' }, 'Page Limit:'),
      el('select', {
        className: 'pyq-select pyq-limit-select',
        value: String(rowLimit),
        onchange: (e) => {
          const val = e.target.value === 'All' ? 'All' : Number(e.target.value);
          stateManager.setState({ rowLimit: val });
        }
      },
        el('option', { value: '20', selected: rowLimit === 20 }, '20 rows'),
        el('option', { value: '50', selected: rowLimit === 50 }, '50 rows'),
        el('option', { value: '100', selected: rowLimit === 100 }, '100 rows'),
        el('option', { value: '500', selected: rowLimit === 500 }, '500 rows'),
        el('option', { value: 'All', selected: rowLimit === 'All' }, 'All rows')
      )
    );

    // Quick Add Row
    const addBtn = el('button', {
      type: 'button',
      className: 'pyq-btn pyq-btn-sm pyq-btn-primary',
      onclick: () => this.addNewRow()
    }, '+ Add Question');

    right.appendChild(limitWrapper);
    right.appendChild(addBtn);

    this.footerBar.appendChild(left);
    this.footerBar.appendChild(right);
  }
}
