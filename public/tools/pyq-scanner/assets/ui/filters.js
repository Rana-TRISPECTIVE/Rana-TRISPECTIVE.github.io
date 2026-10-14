/**
 * PYQs Pro - Advanced Multi-Rule Filter Drawer & Status Pills
 */

import { el } from '../utils/helpers.js';
import { stateManager } from '../core/state.js';
import { triggerSearch } from '../search/search.js';
import { COLUMN_TYPES } from '../core/config.js';
import { getTagColorConfig } from './editor.js';

/**
 * Extracts all unique tags and values for a column from column options and database rows.
 */
function getColumnTagOptions(column, rows) {
  const optionsMap = new Map();

  // 1. Predefined column options
  if (Array.isArray(column.options)) {
    column.options.forEach(opt => {
      if (opt && opt.label) {
        optionsMap.set(opt.label.trim().toLowerCase(), opt.label.trim());
      }
    });
  }

  // 2. Scan all rows for this column
  if (Array.isArray(rows)) {
    rows.forEach(r => {
      const val = r.cells ? r.cells[column.id] : null;
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        const strVal = String(val).trim();
        if (column.type === COLUMN_TYPES.SELECT) {
          strVal.split(/[,;]/).forEach(part => {
            const trimmed = part.trim();
            if (trimmed) {
              optionsMap.set(trimmed.toLowerCase(), trimmed);
            }
          });
        } else {
          optionsMap.set(strVal.toLowerCase(), strVal);
        }
      }
    });
  }

  return Array.from(optionsMap.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
}

export class PYQFilters {
  constructor(mountContainer) {
    this.container = mountContainer;
    this.init();
  }

  init() {
    this.render();
    stateManager.subscribeKey('filters', () => this.render());
    stateManager.subscribeKey('filterConjunction', () => this.render());
    stateManager.subscribeKey('isFilterDrawerOpen', () => this.render());
    stateManager.subscribeKey('columns', () => this.render());
  }

  render() {
    const { filters, filterConjunction, isFilterDrawerOpen, columns } = stateManager.getState();
    this.container.innerHTML = '';

    if (!isFilterDrawerOpen) {
      this.container.style.display = 'none';
      return;
    }
    this.container.style.display = 'block';

    const drawer = el('div', { className: 'pyq-filter-drawer' });

    // Drawer Header
    const header = el('div', { className: 'pyq-drawer-header' });
    const headerLeft = el('div', { className: 'pyq-drawer-header-left' },
      el('span', { className: 'pyq-drawer-title' }, 'Advanced Filter Rules'),
      filters.length > 1 ? this.buildConjunctionToggle(filterConjunction) : ''
    );

    const headerRight = el('div', { className: 'pyq-drawer-header-right' });

    if (filters.length > 0) {
      headerRight.appendChild(
        el('button', {
          type: 'button',
          className: 'pyq-btn pyq-btn-xs pyq-btn-ghost',
          title: 'Clear all active filter conditions',
          onclick: () => this.clearAllFilters()
        }, 'Clear All')
      );
    }

    headerRight.appendChild(
      el('button', {
        type: 'button',
        className: 'pyq-btn pyq-btn-xs pyq-btn-secondary',
        onclick: () => this.addRule()
      }, '+ Add Rule')
    );

    headerRight.appendChild(
      el('button', {
        type: 'button',
        className: 'pyq-btn pyq-btn-xs pyq-btn-ghost',
        title: 'Close drawer',
        innerHTML: '&times;',
        onclick: () => stateManager.setState({ isFilterDrawerOpen: false })
      })
    );

    header.appendChild(headerLeft);
    header.appendChild(headerRight);
    drawer.appendChild(header);

    // Rule Rows
    const rulesList = el('div', { className: 'pyq-rules-list' });

    if (filters.length === 0) {
      rulesList.appendChild(
        el('div', { className: 'pyq-no-rules-hint' },
          el('span', {}, 'No active filter conditions. All database rows are displayed.'),
          el('button', {
            type: 'button',
            className: 'pyq-btn pyq-btn-xs pyq-btn-primary pyq-ml-2',
            onclick: () => this.addRule()
          }, 'Create First Rule')
        )
      );
    } else {
      filters.forEach((rule, idx) => {
        const ruleRow = this.buildRuleRow(rule, idx, columns, filterConjunction);
        rulesList.appendChild(ruleRow);
      });
    }

    drawer.appendChild(rulesList);
    this.container.appendChild(drawer);
  }

  buildConjunctionToggle(currentConjunction) {
    const wrapper = el('div', { className: 'pyq-conjunction-wrapper' });

    const btnAnd = el('button', {
      type: 'button',
      className: `pyq-conj-btn ${currentConjunction === 'AND' ? 'pyq-conj-active' : ''}`,
      onclick: () => {
        stateManager.setState({ filterConjunction: 'AND' });
        triggerSearch();
      }
    }, 'AND');

    const btnOr = el('button', {
      type: 'button',
      className: `pyq-conj-btn ${currentConjunction === 'OR' ? 'pyq-conj-active' : ''}`,
      onclick: () => {
        stateManager.setState({ filterConjunction: 'OR' });
        triggerSearch();
      }
    }, 'OR');

    wrapper.appendChild(btnAnd);
    wrapper.appendChild(btnOr);
    return wrapper;
  }

  buildRuleRow(rule, index, columns, conjunction) {
    const row = el('div', { className: 'pyq-rule-row' });

    // Prefix: Where / AND / OR
    const prefixLabel = index === 0 ? 'Where' : conjunction;
    const prefix = el('div', { className: 'pyq-rule-prefix' }, prefixLabel);
    row.appendChild(prefix);

    // 1. Column Selector
    const colSelect = el('select', {
      className: 'pyq-select pyq-rule-col-select',
      onchange: (e) => {
        const newColId = e.target.value;
        const targetCol = columns.find(c => c.id === newColId);
        const newOperator = targetCol && targetCol.type === COLUMN_TYPES.CHECKBOX ? 'is_checked' : 'contains';
        this.updateRule(rule.id, { columnId: newColId, operator: newOperator, value: '' });
      }
    });

    columns.forEach(c => {
      colSelect.appendChild(el('option', { value: c.id, selected: c.id === rule.columnId }, `${c.name} (${c.type})`));
    });
    row.appendChild(colSelect);

    const activeCol = columns.find(c => c.id === rule.columnId) || columns[0];

    // 2. Operator Selector
    const opSelect = el('select', {
      className: 'pyq-select pyq-rule-op-select',
      onchange: (e) => {
        this.updateRule(rule.id, { operator: e.target.value });
      }
    });

    const operators = this.getOperatorsForType(activeCol ? activeCol.type : 'text');
    operators.forEach(op => {
      opSelect.appendChild(el('option', { value: op.id, selected: op.id === rule.operator }, op.label));
    });
    row.appendChild(opSelect);

    // 3. Value Input (if applicable)
    const requiresValue = !['is_empty', 'is_not_empty', 'is_checked', 'is_unchecked'].includes(rule.operator);

    if (requiresValue) {
      const { rows } = stateManager.getState();
      const availableOptions = activeCol ? getColumnTagOptions(activeCol, rows) : [];

      if (activeCol && activeCol.type === COLUMN_TYPES.SELECT) {
        // Tag / Multi-tag dropdown: directly pick option without typing
        const valSelect = el('select', {
          className: 'pyq-select pyq-rule-val-select',
          onchange: (e) => this.updateRule(rule.id, { value: e.target.value })
        });

        valSelect.appendChild(el('option', { value: '' }, '— Select Tag / Option —'));
        availableOptions.forEach(optVal => {
          valSelect.appendChild(el('option', {
            value: optVal,
            selected: optVal.toLowerCase() === (rule.value || '').toLowerCase()
          }, optVal));
        });

        row.appendChild(valSelect);
      } else if (availableOptions.length > 0 && availableOptions.length <= 80) {
        // For columns like Year, Paper, Status with discrete values: hybrid datalist so user can pick or type
        const datalistId = `dl_${rule.id}_${activeCol ? activeCol.id : 'col'}`;
        const datalist = el('datalist', { id: datalistId });
        availableOptions.forEach(optVal => {
          datalist.appendChild(el('option', { value: optVal }));
        });

        const valInput = el('input', {
          type: activeCol && activeCol.type === COLUMN_TYPES.NUMBER ? 'number' : 'text',
          className: 'pyq-input pyq-rule-val-input',
          placeholder: 'Select or type value...',
          list: datalistId,
          value: rule.value || '',
          oninput: (e) => this.updateRule(rule.id, { value: e.target.value })
        });

        row.appendChild(valInput);
        row.appendChild(datalist);
      } else {
        // Standard text/number input
        const valInput = el('input', {
          type: activeCol && activeCol.type === COLUMN_TYPES.NUMBER ? 'number' : 'text',
          className: 'pyq-input pyq-rule-val-input',
          placeholder: 'Compare value...',
          value: rule.value || '',
          oninput: (e) => this.updateRule(rule.id, { value: e.target.value })
        });
        row.appendChild(valInput);
      }
    }

    // 4. Delete Rule Button
    const delBtn = el('button', {
      type: 'button',
      className: 'pyq-rule-del-btn',
      title: 'Remove condition',
      innerHTML: '&times;',
      onclick: () => this.removeRule(rule.id)
    });
    row.appendChild(delBtn);

    return row;
  }

  getOperatorsForType(type) {
    if (type === COLUMN_TYPES.CHECKBOX) {
      return [
        { id: 'is_checked', label: 'is Checked' },
        { id: 'is_unchecked', label: 'is Unchecked' }
      ];
    }

    if (type === COLUMN_TYPES.SELECT) {
      return [
        { id: 'contains', label: 'contains tag' },
        { id: 'equals', label: 'is exactly' },
        { id: 'not_contains', label: 'does not contain' },
        { id: 'not_equals', label: 'is not' },
        { id: 'is_empty', label: 'has no tag' },
        { id: 'is_not_empty', label: 'has any tag' }
      ];
    }

    return [
      { id: 'contains', label: 'contains' },
      { id: 'not_contains', label: 'does not contain' },
      { id: 'equals', label: 'equals exactly' },
      { id: 'not_equals', label: 'does not equal' },
      { id: 'is_empty', label: 'is empty' },
      { id: 'is_not_empty', label: 'is not empty' }
    ];
  }

  clearAllFilters() {
    stateManager.setState({ filters: [] });
    triggerSearch();
  }

  addRule() {
    const { columns, filters } = stateManager.getState();
    if (!columns || columns.length === 0) return;

    const firstCol = columns[0];
    const initialOp = firstCol.type === COLUMN_TYPES.CHECKBOX ? 'is_checked' : 'contains';

    const newRule = {
      id: `filter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      columnId: firstCol.id,
      operator: initialOp,
      value: ''
    };

    stateManager.setState({
      filters: [...filters, newRule],
      isFilterDrawerOpen: true
    });
    triggerSearch();
  }

  updateRule(ruleId, updates) {
    const { filters } = stateManager.getState();
    const nextFilters = filters.map(f => f.id === ruleId ? { ...f, ...updates } : f);
    stateManager.setState({ filters: nextFilters });
    triggerSearch();
  }

  removeRule(ruleId) {
    const { filters } = stateManager.getState();
    const nextFilters = filters.filter(f => f.id !== ruleId);
    stateManager.setState({ filters: nextFilters });
    triggerSearch();
  }
}
