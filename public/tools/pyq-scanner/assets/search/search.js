/**
 * PYQs Pro - Main-Thread Search Controller & Query Dispatcher
 * Coordinates background Web Worker execution with an in-thread fallback.
 */

import { stateManager } from '../core/state.js';
import { debounce } from '../utils/helpers.js';

class SearchController {
  constructor() {
    this.worker = null;
    this.currentRequestId = 0;
    this.callbacks = new Map();
    this.initWorker();
  }

  /**
   * Initializes background Web Worker.
   */
  initWorker() {
    try {
      // Relative path resolution for worker
      const workerUrl = new URL('./search-worker.js', import.meta.url);
      this.worker = new Worker(workerUrl, { type: 'module' });

      this.worker.onmessage = (e) => {
        const { type, requestId, matchedRowIds } = e.data;
        if (type === 'SEARCH_RESULTS' && this.callbacks.has(requestId)) {
          const cb = this.callbacks.get(requestId);
          this.callbacks.delete(requestId);
          cb(matchedRowIds);
        }
      };

      this.worker.onerror = (err) => {
        console.warn('Search Web Worker encountered an error; falling back to main-thread search:', err);
        this.worker = null;
      };
    } catch (e) {
      console.warn('Web Worker initialization failed (likely file:// protocol or iframe security policy). Using in-thread search.', e);
      this.worker = null;
    }
  }

  /**
   * Main query execution method.
   * Filters and sorts rows based on current state.
   */
  execute() {
    const { rows, columns, searchQuery, bookmarkOnly, filters, filterConjunction, sortState } = stateManager.getState();
    const requestId = ++this.currentRequestId;

    const onResults = (matchedRowIds) => {
      if (requestId !== this.currentRequestId) return; // Discard stale responses

      const matchedSet = new Set(matchedRowIds);
      let matchedRows = rows.filter(r => matchedSet.has(r.id));

      // Apply active sorting
      if (sortState && sortState.columnId) {
        const { columnId, direction } = sortState;
        const col = columns.find(c => c.id === columnId);

        matchedRows.sort((a, b) => {
          const valA = a.cells ? a.cells[columnId] : '';
          const valB = b.cells ? b.cells[columnId] : '';

          if (col && col.type === 'checkbox') {
            const numA = valA ? 1 : 0;
            const numB = valB ? 1 : 0;
            return direction === 'asc' ? numA - numB : numB - numA;
          }

          if (col && col.type === 'number') {
            const numA = Number(valA) || 0;
            const numB = Number(valB) || 0;
            return direction === 'asc' ? numA - numB : numB - numA;
          }

          const strA = valA !== null && valA !== undefined ? String(valA) : '';
          const strB = valB !== null && valB !== undefined ? String(valB) : '';

          if (!strA && strB) return 1;
          if (strA && !strB) return -1;
          if (!strA && !strB) return 0;

          const cmp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
          return direction === 'asc' ? cmp : -cmp;
        });
      }

      stateManager.setState({ filteredRows: matchedRows });
    };

    if (this.worker) {
      this.callbacks.set(requestId, onResults);
      this.worker.postMessage({
        type: 'SEARCH',
        requestId,
        query: searchQuery,
        rows,
        columns,
        bookmarkOnly,
        filters,
        conjunction: filterConjunction
      });
    } else {
      // In-thread synchronous fallback
      this.fallbackSearch(rows, columns, searchQuery, bookmarkOnly, filters, filterConjunction, onResults);
    }
  }

  /**
   * Fallback search evaluator running on main thread if Web Worker is disabled.
   */
  fallbackSearch(rows, columns, query, bookmarkOnly, filters, conjunction, callback) {
    const qLower = (query || '').toLowerCase().trim();
    const matchedIds = [];

    // Parse simple namespace if present
    const nsMatch = qLower.match(/^([a-z0-9_-]+):(.*)$/i);
    const targetNsField = nsMatch ? nsMatch[1] : null;
    const targetNsVal = nsMatch ? nsMatch[2].replace(/^["']|["']$/g, '').trim() : null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (bookmarkOnly && !row.bookmarked) continue;

      // Filter drawer checks
      if (filters && filters.length > 0) {
        const pass = filters.map(f => {
          const val = row.cells ? String(row.cells[f.columnId] || '').toLowerCase().trim() : '';
          const rVal = String(f.value || '').toLowerCase().trim();
          const tags = val.includes(',') || val.includes(';')
            ? val.split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean)
            : [val];

          switch (f.operator) {
            case 'equals': return val === rVal || tags.includes(rVal);
            case 'not_equals': return val !== rVal && !tags.includes(rVal);
            case 'contains': return val.includes(rVal) || tags.some(t => t.includes(rVal));
            case 'not_contains': return !val.includes(rVal) && !tags.some(t => t.includes(rVal));
            case 'is_empty': return !val.trim();
            case 'is_not_empty': return !!val.trim();
            case 'is_checked': return row.cells && row.cells[f.columnId] === true;
            case 'is_unchecked': return !row.cells || row.cells[f.columnId] !== true;
            default: return true;
          }
        });

        const passes = conjunction === 'OR' ? pass.some(Boolean) : pass.every(Boolean);
        if (!passes) continue;
      }

      // Query checks
      if (qLower) {
        if (targetNsField && targetNsVal !== null) {
          const targetCol = columns.find(c =>
            c.id.toLowerCase() === targetNsField || c.name.toLowerCase() === targetNsField
          );
          if (targetCol) {
            const cellVal = String((row.cells && row.cells[targetCol.id]) || '').toLowerCase();
            if (!cellVal.includes(targetNsVal)) continue;
          } else {
            // Field not found, match globally
            const anyMatch = Object.values(row.cells || {}).some(v =>
              String(v || '').toLowerCase().includes(targetNsVal)
            );
            if (!anyMatch) continue;
          }
        } else {
          // Standard full-text search
          const words = qLower.split(/\s+/).filter(Boolean);
          const allCellText = Object.values(row.cells || {}).map(v => String(v || '').toLowerCase()).join(' ');
          const allWordsMatch = words.every(w => allCellText.includes(w));
          if (!allWordsMatch) continue;
        }
      }

      matchedIds.push(row.id);
    }

    callback(matchedIds);
  }
}

export const searchController = new SearchController();

// Debounced trigger for input keystrokes
export const triggerSearch = debounce(() => {
  searchController.execute();
}, 60);
