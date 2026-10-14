/**
 * PYQs Pro - Interactive Visual Column Mapping Logic
 * Maps incoming dataset columns to target table columns with automated similarity suggestions.
 */

import { el, escapeHtml } from '../utils/helpers.js';

/**
 * Computes a string similarity score from 0.0 to 1.0.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function calculateSimilarity(a, b) {
  const s1 = String(a || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = String(b || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  // Simple token/character bigram overlap
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;

  for (const item of b1) {
    if (b2.has(item)) intersection++;
  }

  const total = b1.size + b2.size;
  return total > 0 ? (2.0 * intersection) / total : 0;
}

/**
 * Automatically suggests the best matching existing column for an incoming header.
 * @param {string} incomingHeader
 * @param {Array<{id: string, name: string}>} targetColumns
 * @returns {string} Target column ID or '__create__'
 */
export function autoSuggestColumnMatch(incomingHeader, targetColumns) {
  let bestScore = 0;
  let bestColId = '__create__';

  for (const col of targetColumns) {
    const scoreName = calculateSimilarity(incomingHeader, col.name);
    const scoreId = calculateSimilarity(incomingHeader, col.id);
    const maxScore = Math.max(scoreName, scoreId);

    if (maxScore > bestScore && maxScore >= 0.45) {
      bestScore = maxScore;
      bestColId = col.id;
    }
  }

  return bestColId;
}

/**
 * Creates an interactive DOM component for visual column alignment.
 * @param {string[]} incomingHeaders
 * @param {Array<{id: string, name: string, type: string}>} targetColumns
 * @param {Function} onChange (currentMapping) => void
 * @returns {HTMLElement}
 */
export function renderColumnMapper(incomingHeaders, targetColumns, onChange) {
  const mapping = {};

  // Initial auto-suggestions
  for (const header of incomingHeaders) {
    mapping[header] = autoSuggestColumnMatch(header, targetColumns);
  }

  const container = el('div', { className: 'pyq-column-mapper' });

  const headerNotice = el('div', { className: 'pyq-mapper-header-notice' },
    el('p', { className: 'pyq-mapper-title' }, 'Align Incoming Columns to Table Schema'),
    el('p', { className: 'pyq-mapper-subtitle' }, 'Match source file attributes to your current questions database. New columns will be auto-created.')
  );
  container.appendChild(headerNotice);

  const grid = el('div', { className: 'pyq-mapper-grid' });

  incomingHeaders.forEach((header) => {
    const row = el('div', { className: 'pyq-mapper-row' });

    // Incoming field pill
    const leftCol = el('div', { className: 'pyq-mapper-source' },
      el('span', { className: 'pyq-mapper-label-source', title: header }, header)
    );

    // Arrow icon
    const arrow = el('div', { className: 'pyq-mapper-arrow', innerHTML: '&#8594;' });

    // Target select dropdown
    const select = el('select', {
      className: 'pyq-select pyq-mapper-select',
      onchange: (e) => {
        mapping[header] = e.target.value;
        if (onChange) onChange({ ...mapping });
      }
    });

    // Option 1: Matched target columns
    targetColumns.forEach((col) => {
      const isSelected = mapping[header] === col.id;
      const opt = el('option', { value: col.id, selected: isSelected }, `${col.name} (${col.type})`);
      select.appendChild(opt);
    });

    // Option 2: Create new column with this header name
    const optCreate = el('option', {
      value: '__create__',
      selected: mapping[header] === '__create__'
    }, `+ Create new "${header}" column`);
    select.appendChild(optCreate);

    // Option 3: Skip column
    const optSkip = el('option', {
      value: '__skip__',
      selected: mapping[header] === '__skip__'
    }, '✕ Do not import (Skip)');
    select.appendChild(optSkip);

    const rightCol = el('div', { className: 'pyq-mapper-target' }, select);

    row.appendChild(leftCol);
    row.appendChild(arrow);
    row.appendChild(rightCol);
    grid.appendChild(row);
  });

  container.appendChild(grid);

  if (onChange) onChange({ ...mapping });
  return { element: container, getMapping: () => ({ ...mapping }) };
}
