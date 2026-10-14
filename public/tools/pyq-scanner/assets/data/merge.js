/**
 * PYQs Pro - Sequential Multi-Year Dataset Append Logic
 * Implements cross-format progressive appending (e.g. importing 2026 PYQs into 2020-2025 dataset)
 * with zero deduplication overhead.
 */

import { inferColumnType } from './csv.js';
import { sanitizeCellValue } from './validator.js';
import { generateId } from '../utils/helpers.js';

/**
 * Appends or replaces an incoming dataset into the existing table schema and records.
 * @param {Object} params
 * @param {Array} params.existingColumns
 * @param {Array} params.existingRows
 * @param {string[]} params.incomingHeaders
 * @param {Array<any[]>} params.incomingRowsData 2D array of values
 * @param {Object.<string, string>} params.columnMapping e.g. { 'Year': 'year', 'Q': 'question', 'Subject': '__create__' }
 * @param {boolean} [params.isReplace=false]
 * @returns {{ finalColumns: Array, finalRows: Array, addedCount: number }}
 */
export function mergeDatasets({
  existingColumns,
  existingRows,
  incomingHeaders,
  incomingRowsData,
  columnMapping,
  isReplace = false
}) {
  const finalColumns = isReplace ? [] : [...existingColumns];
  const colIdMap = new Map(); // header -> column id

  // 1. Process column mappings
  incomingHeaders.forEach((header, colIndex) => {
    const target = columnMapping[header] || '__create__';

    if (target === '__skip__') {
      return;
    }

    if (target === '__create__' || isReplace) {
      // Check if target column was already mapped or created
      const sanitizedId = header.toLowerCase().replace(/[^a-z0-9]/g, '_') || `col_${colIndex}`;
      let finalId = sanitizedId;
      let counter = 1;
      while (finalColumns.some(c => c.id === finalId)) {
        finalId = `${sanitizedId}_${counter++}`;
      }

      // Sample column values to infer type
      const sampleValues = incomingRowsData.slice(0, 50).map(r => r[colIndex]);
      const inferredType = inferColumnType(sampleValues, header);

      const newCol = {
        id: finalId,
        name: header,
        type: inferredType,
        width: inferredType === 'markdown' ? 320 : inferredType === 'checkbox' ? 95 : 170
      };

      if (inferredType === 'select') {
        const uniqueValues = Array.from(new Set(
          incomingRowsData.map(r => String(r[colIndex] || '').trim()).filter(Boolean)
        )).slice(0, 15);
        const palette = ['rose', 'amber', 'cyan', 'emerald', 'purple', 'zinc', 'blue', 'pink'];
        newCol.options = uniqueValues.map((v, i) => ({
          label: v,
          color: palette[i % palette.length]
        }));
      }

      finalColumns.push(newCol);
      colIdMap.set(header, finalId);
    } else {
      // Mapped to existing column
      colIdMap.set(header, target);
    }
  });

  // 2. Build rows
  const newProcessedRows = incomingRowsData.map((rowArr, rowIdx) => {
    const cells = {};

    // Initialize all active columns with defaults
    finalColumns.forEach(col => {
      cells[col.id] = col.type === 'checkbox' ? false : '';
    });

    // Populate mapped incoming values
    incomingHeaders.forEach((header, colIdx) => {
      const colId = colIdMap.get(header);
      if (!colId) return;

      const targetCol = finalColumns.find(c => c.id === colId);
      const rawVal = rowArr[colIdx];
      const sanitized = sanitizeCellValue(rawVal, targetCol ? targetCol.type : 'text');
      cells[colId] = sanitized;
    });

    return {
      id: generateId(`row_${rowIdx}`),
      bookmarked: false,
      cells
    };
  });

  // 3. Sequential Multi-Year Append (Zero Deduplication Overhead)
  const finalRows = isReplace ? newProcessedRows : [...existingRows, ...newProcessedRows];

  return {
    finalColumns,
    finalRows,
    addedCount: newProcessedRows.length
  };
}
