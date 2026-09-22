/**
 * PYQs Pro - Structured JSON Backup & Restore Handlers
 */

import { APP_CONFIG } from '../core/config.js';

/**
 * Serializes database into structured JSON backup format.
 * @param {Array} columns
 * @param {Array} rows
 * @param {Object} [metadata={}]
 * @returns {string} JSON string
 */
export function serializeJSON(columns, rows, metadata = {}) {
  const payload = {
    version: APP_CONFIG.VERSION,
    appName: APP_CONFIG.NAME,
    exportedAt: new Date().toISOString(),
    totalQuestions: rows.length,
    columns,
    rows,
    metadata
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Parses and validates structured JSON backup file.
 * Supports both full backup structure and raw array of objects.
 * @param {string} jsonText
 * @returns {{ columns?: Array, rows: Array, isCompleteBackup: boolean }}
 */
export function parseJSON(jsonText) {
  if (!jsonText || typeof jsonText !== 'string') {
    throw new Error('Invalid JSON string provided.');
  }

  const data = JSON.parse(jsonText);

  // Case 1: Full PYQs Pro backup format
  if (data && typeof data === 'object' && Array.isArray(data.rows)) {
    return {
      columns: Array.isArray(data.columns) ? data.columns : undefined,
      rows: data.rows,
      isCompleteBackup: true
    };
  }

  // Case 2: Array of row objects (e.g. [{ topic: '...', question: '...' }])
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { rows: [], isCompleteBackup: false };
    }

    // Inspect first item
    const first = data[0];
    // Check if it's our internal row shape { id, cells: {...} }
    if (first && typeof first === 'object' && first.cells && typeof first.cells === 'object') {
      return { rows: data, isCompleteBackup: false };
    }

    // Otherwise flat objects: convert keys into columns
    const allKeys = new Set();
    data.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(k => allKeys.add(k));
      }
    });

    const inferredColumns = Array.from(allKeys).map(key => ({
      id: key.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: key,
      type: 'text'
    }));

    const rows = data.map((item, idx) => {
      const cells = {};
      inferredColumns.forEach(col => {
        cells[col.id] = item[col.name] !== undefined ? item[col.name] : '';
      });
      return {
        id: `json_row_${Date.now()}_${idx}`,
        bookmarked: false,
        cells
      };
    });

    return {
      columns: inferredColumns,
      rows,
      isCompleteBackup: false
    };
  }

  throw new Error('Unrecognized JSON structure. Expected PYQs Pro backup or array of question items.');
}

/**
 * Initiates file download for JSON backup.
 * @param {Array} columns
 * @param {Array} rows
 * @param {string} [filename='pyqs-pro-backup.json']
 */
export function exportJSON(columns, rows, filename = 'pyqs-pro-backup.json') {
  const jsonStr = serializeJSON(columns, rows);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
