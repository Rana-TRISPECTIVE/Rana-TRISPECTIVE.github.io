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
  return match || TAG_COLORS[4]; // Default purple
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
 * Select Tag Cell: Pill display with searchable dropdown & option creator.
 */
function renderSelectCell(container, row, column, value, onCellChange) {
  const currentLabel = value !== null && value !== undefined ? String(value).trim() : '';
  const colOptions = column.options || [];

  // Match color
  const matchedOpt = colOptions.find(o => o.label.toLowerCase() === currentLabel.toLowerCase());
  const colorName = matchedOpt ? matchedOpt.color : 'purple';
  const colorCfg = getTagColorConfig(colorName);

  const pillContainer = el('div', { className: 'pyq-select-pill-wrapper' });

  if (currentLabel) {
    const pill = el('span', {
      className: `pyq-tag-pill pyq-tag-${colorCfg.name}`,
      style: {
        backgroundColor: colorCfg.bg,
        borderColor: colorCfg.border,
        color: colorCfg.text
      }
    }, currentLabel);

    const clearBtn = el('button', {
      type: 'button',
      className: 'pyq-pill-clear-btn',
      title: 'Remove tag',
      innerHTML: '&times;',
      onclick: (e) => {
        e.stopPropagation();
        onCellChange(row.id, column.id, '');
      }
    });

    pill.appendChild(clearBtn);
    pillContainer.appendChild(pill);
  } else {
    pillContainer.appendChild(el('span', { className: 'pyq-cell-empty' }, '— Select —'));
  }

  // Click to open dropdown editor
  container.appendChild(pillContainer);

  container.addEventListener('click', (e) => {
    // If clicking on clear button, do nothing
    if (e.target.closest('.pyq-pill-clear-btn')) return;
    openSelectDropdown(container, row, column, currentLabel, onCellChange);
  });

  return container;
}

/**
 * Dropdown picker for select tags.
 */
function openSelectDropdown(container, row, column, currentValue, onCellChange) {
  // Close any existing dropdowns
  document.querySelectorAll('.pyq-select-dropdown').forEach(d => d.remove());

  const colOptions = column.options || [];
  let filterText = '';

  const dropdown = el('div', { className: 'pyq-select-dropdown' });

  // Search input
  const searchInput = el('input', {
    type: 'text',
    className: 'pyq-input pyq-dropdown-search',
    placeholder: 'Filter or add tag...',
    autofocus: true
  });

  const optionsList = el('div', { className: 'pyq-dropdown-options' });

  const renderOptions = () => {
    optionsList.innerHTML = '';
    const filtered = colOptions.filter(opt =>
      opt.label.toLowerCase().includes(filterText.toLowerCase())
    );

    // Option: None / Clear
    const clearOption = el('div', {
      className: `pyq-dropdown-item ${!currentValue ? 'pyq-item-active' : ''}`,
      onclick: () => {
        onCellChange(row.id, column.id, '');
        dropdown.remove();
      }
    }, el('span', { className: 'pyq-item-italic' }, 'None (Clear)'));
    optionsList.appendChild(clearOption);

    filtered.forEach(opt => {
      const isSelected = opt.label.toLowerCase() === currentValue.toLowerCase();
      const cfg = getTagColorConfig(opt.color);
      const item = el('div', {
        className: `pyq-dropdown-item ${isSelected ? 'pyq-item-active' : ''}`,
        onclick: () => {
          onCellChange(row.id, column.id, opt.label);
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

    // If searching a new tag that doesn't exist yet, show "Create tag" option
    const exactExists = colOptions.some(o => o.label.toLowerCase() === filterText.trim().toLowerCase());
    if (filterText.trim() && !exactExists) {
      const createItem = el('div', {
        className: 'pyq-dropdown-item pyq-dropdown-create',
        onclick: async () => {
          const newLabel = filterText.trim();
          const palette = ['rose', 'amber', 'cyan', 'emerald', 'purple', 'zinc', 'blue', 'pink'];
          const randomColor = palette[Math.floor(Math.random() * palette.length)];
          const newOption = { label: newLabel, color: randomColor };

          const updatedOptions = [...colOptions, newOption];
          const { columns } = stateManager.getState();
          const newCols = columns.map(c => c.id === column.id ? { ...c, options: updatedOptions } : c);

          stateManager.setState({ columns: newCols });
          await db.saveColumns(newCols);

          onCellChange(row.id, column.id, newLabel);
          dropdown.remove();
        }
      }, `+ Add tag "${filterText.trim()}"`);
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
