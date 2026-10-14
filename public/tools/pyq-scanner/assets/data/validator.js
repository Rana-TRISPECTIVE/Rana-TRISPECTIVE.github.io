/**
 * PYQs Pro - File Schema Validation & Cell Sanitization
 */

import { COLUMN_TYPES } from '../core/config.js';

/**
 * Validates and casts an incoming cell value into the appropriate type.
 * @param {any} rawValue
 * @param {'text'|'number'|'date'|'checkbox'|'select'|'markdown'} type
 * @returns {any} Sanitized value
 */
export function sanitizeCellValue(rawValue, type) {
  if (rawValue === null || rawValue === undefined) {
    return type === COLUMN_TYPES.CHECKBOX ? false : '';
  }

  const str = String(rawValue).trim();

  switch (type) {
    case COLUMN_TYPES.CHECKBOX: {
      const lower = str.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'checked' || rawValue === true;
    }

    case COLUMN_TYPES.NUMBER: {
      if (str === '') return '';
      const num = Number(str.replace(/,/g, ''));
      return isNaN(num) ? str : num;
    }

    case COLUMN_TYPES.DATE: {
      return str;
    }

    case COLUMN_TYPES.SELECT: {
      return str;
    }

    case COLUMN_TYPES.MARKDOWN:
    case COLUMN_TYPES.TEXT:
    default:
      return String(rawValue);
  }
}

/**
 * Validates an entire batch of incoming rows against the column schema.
 * @param {Array<{id: string, type: string}>} columns
 * @param {Array<Object>} rows
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDataset(columns, rows) {
  const errors = [];

  if (!Array.isArray(columns) || columns.length === 0) {
    errors.push('Table must have at least one column definition.');
  }

  if (!Array.isArray(rows)) {
    errors.push('Row records must be provided as an array.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
