/**
 * PYQs Pro - Inline Cell Editor & Rich Markdown Renderer / Copy
 * Provides smooth inline cell editing for Text, Number, Date, Checkbox, Select tags, and Markdown.
 */

import { el, renderMarkdown, copyToClipboard, escapeHtml } from '../utils/helpers.js';
import { COLUMN_TYPES, TAG_COLORS } from '../core/config.js';
import { stateManager } from '../core/state.js';
import { db } from '../core/database.js';

/**
 * Returns tag color configuration by name or label.
 * @param {string} colorName
 * @returns {{ name: string, bg: string, border: string, text: string }}
 */
export function getTagColorConfig(colorName) {
  const match = TAG_COLORS.find(c => c.name === colorName);
  return match || TAG_COLORS[0];
}

/**
 * Generates a deterministic distinct color from TAG_COLORS based on text string.
 * @param {string} text
 * @returns {{ name: string, bg: string, border: string, text: string }}
 */
export function getDeterministicColor(text) {
  if (!text) return TAG_COLORS[0];
  let hash = 0;
  const str = String(text).trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

/**
 * Returns color config for a tag, checking column options first, then falling back to deterministic hashing.
 * @param {string} tagText
 * @param {Array} columnOptions
 * @returns {{ name: string, bg: string, border: string, text: string }}
 */
export function getColorForTag(tagText, columnOptions = []) {
  if (!tagText) return TAG_COLORS[0];
  const str = String(tagText).trim();
  const match = (columnOptions || []).find(o => o.label && o.label.toLowerCase() === str.toLowerCase());
  if (match && match.color) {
    const directCfg = getTagColorConfig(match.color);
    if (directCfg) return directCfg;
  }
  return getDeterministicColor(str);
}

/**
 * Creates the DOM element for a table cell, handling editing and formatted display.
 * @param {Object} params
 * @param {Object} params.row
 * @param {Object} params.column
 * @param {Function} params.onCellChange (rowId, colId, newValue) => void
 * @returns {HTMLElement}
 */
export function renderCell({ row, column, onCellChange }) {
  const cellContainer = el('div', {
    className: `pyq-cell pyq-cell-${column.type}`,
    dataset: { rowId: row.id, colId: column.id }
  });

  const value = row.cells ? row.cells[column.id] : undefined;

  switch (column.type) {
    case COLUMN_TYPES.CHECKBOX:
      return renderCheckboxCell(cellContainer, row, column, value, onCellChange);

    case COLUMN_TYPES.SELECT:
      return renderSelectCell(cellContainer, row, column, value, onCellChange);

    case COLUMN_TYPES.MARKDOWN:
      return renderMarkdownCell(cellContainer, row, column, value, onCellChange);

    case COLUMN_TYPES.NUMBER:
      return renderNumberCell(cellContainer, row, column, value, onCellChange);

    case COLUMN_TYPES.DATE:
      return renderDateCell(cellContainer, row, column, value, onCellChange);

    case COLUMN_TYPES.TEXT:
    default:
      return renderTextCell(cellContainer, row, column, value, onCellChange);
  }
}

/**
 * Checkbox Cell: Custom boolean toggle.
 */
function renderCheckboxCell(container, row, column, value, onCellChange) {
  const isChecked = Boolean(value);

  const toggleBtn = el('button', {
    type: 'button',
    className: `pyq-checkbox-btn ${isChecked ? 'pyq-checkbox-checked' : ''}`,
    title: isChecked ? 'Mark as Unverified' : 'Mark as Verified',
    onclick: (e) => {
      e.stopPropagation();
      const nextVal = !isChecked;
      onCellChange(row.id, column.id, nextVal);
    }
  }, isChecked ? el('span', { className: 'pyq-check-icon', innerHTML: '&#10003;' }) : '');

  container.appendChild(toggleBtn);
  return container;
}

/**
 * Select / Multi-Tag Cell: Pill display with searchable dropdown & option creator.
 */
function renderSelectCell(container, row, column, value, onCellChange) {
  const rawStr = value !== null && value !== undefined ? String(value).trim() : '';
  const colOptions = column.options || [];

  // Parse comma-separated tags or single tag
  const tags = rawStr ? rawStr.split(/[,;]/).map(t => t.trim()).filter(Boolean) : [];

  const pillContainer = el('div', { className: 'pyq-select-pill-wrapper' });

  if (tags.length > 0) {
    tags.forEach(tag => {
      const colorCfg = getColorForTag(tag, colOptions);
      const pill = el('span', {
        className: `pyq-tag-pill pyq-tag-${colorCfg.name}`,
        style: {
          backgroundColor: colorCfg.bg,
          borderColor: colorCfg.border,
          color: colorCfg.text
        }
      }, tag);

      const clearBtn = el('button', {
        type: 'button',
        className: 'pyq-pill-clear-btn',
        title: `Remove tag "${tag}"`,
        innerHTML: '&times;',
        onclick: (e) => {
          e.stopPropagation();
          const remaining = tags.filter(t => t.toLowerCase() !== tag.toLowerCase());
          onCellChange(row.id, column.id, remaining.join(', '));
        }
      });

      pill.appendChild(clearBtn);
      pillContainer.appendChild(pill);
    });
  } else {
    pillContainer.appendChild(el('span', { className: 'pyq-cell-empty' }, '— Select Tag —'));
  }

  // Click to open dropdown editor
  container.appendChild(pillContainer);

  container.addEventListener('click', (e) => {
    if (e.target.closest('.pyq-pill-clear-btn')) return;
    openSelectDropdown(container, row, column, tags, onCellChange);
  });

  return container;
}

/**
 * Dropdown picker for select / multi-tags.
 */
function openSelectDropdown(container, row, column, currentTags, onCellChange) {
  // Close any existing dropdowns
  document.querySelectorAll('.pyq-select-dropdown').forEach(d => d.remove());

  const colOptions = column.options || [];
  const { rows } = stateManager.getState();

  // Harvest any unique tags present in database rows for this column
  const allKnownTags = new Map(); // labelLower -> { label, color }

  // 1. Defined options
  colOptions.forEach(opt => {
    if (opt.label) {
      allKnownTags.set(opt.label.toLowerCase(), { label: opt.label, color: opt.color });
    }
  });

  // 2. Existing cell values in database
  rows.forEach(r => {
    const val = r.cells ? r.cells[column.id] : null;
    if (val) {
      String(val).split(/[,;]/).forEach(rawT => {
        const t = rawT.trim();
        if (t && !allKnownTags.has(t.toLowerCase())) {
          const cfg = getColorForTag(t, colOptions);
          allKnownTags.set(t.toLowerCase(), { label: t, color: cfg.name });
        }
      });
    }
  });

  const availableOptions = Array.from(allKnownTags.values());
  let filterText = '';

  const dropdown = el('div', { className: 'pyq-select-dropdown' });

  // Search input
  const searchInput = el('input', {
    type: 'text',
    className: 'pyq-input pyq-dropdown-search',
    placeholder: 'Search tag or type new...',
    autofocus: true
  });

  const optionsList = el('div', { className: 'pyq-dropdown-options' });

  const renderOptions = () => {
    optionsList.innerHTML = '';
    const filtered = availableOptions.filter(opt =>
      opt.label.toLowerCase().includes(filterText.toLowerCase())
    );

    // Option: Clear All
    const clearOption = el('div', {
      className: `pyq-dropdown-item ${currentTags.length === 0 ? 'pyq-item-active' : ''}`,
      onclick: () => {
        onCellChange(row.id, column.id, '');
        dropdown.remove();
      }
    }, el('span', { className: 'pyq-item-italic' }, 'None (Clear All)'));
    optionsList.appendChild(clearOption);

    filtered.forEach(opt => {
      const isSelected = currentTags.some(t => t.toLowerCase() === opt.label.toLowerCase());
      const cfg = getColorForTag(opt.label, colOptions);
      const item = el('div', {
        className: `pyq-dropdown-item ${isSelected ? 'pyq-item-active' : ''}`,
        onclick: () => {
          let nextTags;
          if (isSelected) {
            // Remove tag
            nextTags = currentTags.filter(t => t.toLowerCase() !== opt.label.toLowerCase());
          } else {
            // Add tag
            nextTags = [...currentTags, opt.label];
          }
          onCellChange(row.id, column.id, nextTags.join(', '));
          dropdown.remove();
        }
      },
        el('span', {
          className: 'pyq-tag-pill',
          style: { backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.text }
        }, opt.label),
        isSelected ? el('span', { className: 'pyq-dropdown-checkmark', innerHTML: '&#10003;' }) : ''
      );
      optionsList.appendChild(item);
    });

    // If typing a new tag that doesn't exist yet, show "+ Add tag"
    const trimmed = filterText.trim();
    const exactExists = availableOptions.some(o => o.label.toLowerCase() === trimmed.toLowerCase());
    if (trimmed && !exactExists) {
      const createItem = el('div', {
        className: 'pyq-dropdown-item pyq-dropdown-create',
        onclick: async () => {
          const cfg = getDeterministicColor(trimmed);
          const newOption = { label: trimmed, color: cfg.name };

          const updatedOptions = [...colOptions, newOption];
          const { columns } = stateManager.getState();
          const newCols = columns.map(c => c.id === column.id ? { ...c, options: updatedOptions } : c);

          stateManager.setState({ columns: newCols });
          await db.saveColumns(newCols);

          const nextTags = [...currentTags.filter(t => t.toLowerCase() !== trimmed.toLowerCase()), trimmed];
          onCellChange(row.id, column.id, nextTags.join(', '));
          dropdown.remove();
        }
      }, `+ Add tag "${trimmed}"`);
      optionsList.appendChild(createItem);
    }
  };

  searchInput.addEventListener('input', (e) => {
    filterText = e.target.value;
    renderOptions();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dropdown.remove();
  });

  renderOptions();

  dropdown.appendChild(searchInput);
  dropdown.appendChild(optionsList);
  container.appendChild(dropdown);
  setTimeout(() => searchInput.focus(), 10);

  // Close when clicking outside
  const closeListener = (evt) => {
    if (!dropdown.contains(evt.target) && !container.contains(evt.target)) {
      dropdown.remove();
      document.removeEventListener('mousedown', closeListener);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', closeListener), 10);
}

/**
 * Markdown Cell: Rich Formatted HTML view with inline editor & raw toggle.
 */
function renderMarkdownCell(container, row, column, value, onCellChange) {
  let isEditing = false;
  const rawText = value !== null && value !== undefined ? String(value) : '';

  const displayWrapper = el('div', { className: 'pyq-md-cell-display' });

  // Actions toolbar inside cell (Markdown raw toggle + Markdown copy)
  const cellToolbar = el('div', { className: 'pyq-md-cell-toolbar' });

  const copyBtn = el('button', {
    type: 'button',
    className: 'pyq-cell-icon-btn',
    title: 'Copy Markdown text to clipboard',
    innerHTML: '&#128203;',
    onclick: async (e) => {
      e.stopPropagation();
      const success = await copyToClipboard(rawText);
      if (success) {
        stateManager.showToast('Markdown copied to clipboard! 📋', 'success');
      }
    }
  });

  const editToggleBtn = el('button', {
    type: 'button',
    className: 'pyq-cell-icon-btn',
    title: 'Edit Markdown source',
    innerHTML: '&#9998;',
    onclick: (e) => {
      e.stopPropagation();
      startEditing();
    }
  });

  cellToolbar.appendChild(copyBtn);
  cellToolbar.appendChild(editToggleBtn);

  const preview = el('div', {
    className: 'pyq-md-content',
    innerHTML: rawText ? renderMarkdown(rawText) : '<span class="pyq-cell-empty">Empty markdown...</span>'
  });

  displayWrapper.appendChild(preview);
  displayWrapper.appendChild(cellToolbar);
  container.appendChild(displayWrapper);

  const startEditing = () => {
    if (isEditing) return;
    isEditing = true;
    container.innerHTML = '';

    const textarea = el('textarea', {
      className: 'pyq-textarea pyq-cell-textarea',
      placeholder: 'Type Markdown here (supports **bold**, `code`, lists, formulas)...',
      value: rawText
    });

    const editActions = el('div', { className: 'pyq-editor-actions' },
      el('button', {
        type: 'button',
        className: 'pyq-btn pyq-btn-xs pyq-btn-primary',
        onclick: (e) => {
          e.stopPropagation();
          onCellChange(row.id, column.id, textarea.value);
        }
      }, 'Save'),
      el('button', {
        type: 'button',
        className: 'pyq-btn pyq-btn-xs pyq-btn-ghost',
        onclick: (e) => {
          e.stopPropagation();
          isEditing = false;
          container.innerHTML = '';
          renderMarkdownCell(container, row, column, rawText, onCellChange);
        }
      }, 'Cancel')
    );

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        isEditing = false;
        container.innerHTML = '';
        renderMarkdownCell(container, row, column, rawText, onCellChange);
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        onCellChange(row.id, column.id, textarea.value);
      }
    });

    container.appendChild(textarea);
    container.appendChild(editActions);
    textarea.focus();
  };

  container.addEventListener('dblclick', startEditing);
  return container;
}

/**
 * Text / Number / Date Cell: Simple inline click-to-edit.
 */
function renderTextCell(container, row, column, value, onCellChange) {
  return renderSimpleInputCell(container, row, column, value, onCellChange, 'text');
}

function renderNumberCell(container, row, column, value, onCellChange) {
  return renderSimpleInputCell(container, row, column, value, onCellChange, 'number');
}

function renderDateCell(container, row, column, value, onCellChange) {
  return renderSimpleInputCell(container, row, column, value, onCellChange, 'date');
}

function renderSimpleInputCell(container, row, column, value, onCellChange, inputType) {
  let isEditing = false;
  const currentStr = value !== null && value !== undefined ? String(value) : '';

  const display = el('div', {
    className: 'pyq-cell-text-display',
    title: 'Double-click to edit'
  });

  if (currentStr) {
    display.textContent = currentStr;
  } else {
    display.appendChild(el('span', { className: 'pyq-cell-empty' }, '—'));
  }

  container.appendChild(display);

  const startEdit = () => {
    if (isEditing) return;
    isEditing = true;
    container.innerHTML = '';

    const input = el('input', {
      type: inputType,
      className: 'pyq-input pyq-cell-input',
      value: currentStr
    });

    const commit = () => {
      isEditing = false;
      const newVal = inputType === 'number' ? (input.value === '' ? '' : Number(input.value)) : input.value;
      onCellChange(row.id, column.id, newVal);
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        isEditing = false;
        container.innerHTML = '';
        renderSimpleInputCell(container, row, column, currentStr, onCellChange, inputType);
      }
    });

    container.appendChild(input);
    input.focus();
    if (inputType === 'text') input.select();
  };

  container.addEventListener('click', startEdit);
  return container;
}
