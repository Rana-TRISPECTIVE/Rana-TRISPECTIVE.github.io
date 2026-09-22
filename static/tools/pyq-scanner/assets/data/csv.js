/**
 * PYQs Pro - Native CSV Parser & Serializer
 * Fully compliant with RFC 4180.
 * Zero external libraries needed. Handles multiline quoted strings and escapes safely.
 */

/**
 * Parses raw CSV string into an array of headers and 2D row data.
 * @param {string} csvText
 * @returns {{ headers: string[], rows: string[][] }}
 */
export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { headers: [], rows: [] };
  }

  const result = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  const len = csvText.length;

  for (let i = 0; i < len; i++) {
    const char = csvText[i];
    const nextChar = i + 1 < len ? csvText[i + 1] : '';

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped double quote inside quotes
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // handle \r\n
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
        result.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push final trailing field and row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || currentRow[0] !== '') {
      result.push(currentRow);
    }
  }

  if (result.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = result[0].map(h => h.trim());
  const rows = result.slice(1);

  return { headers, rows };
}

/**
 * Serializes column headers and row objects into RFC 4180 formatted CSV.
 * @param {Array<{id: string, name: string, type: string}>} columns
 * @param {Array<{id: string, cells: Object, bookmarked?: boolean}>} rows
 * @returns {string}
 */
export function serializeCSV(columns, rows) {
  if (!columns || columns.length === 0) return '';

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  // Header row
  const headerLine = columns.map(col => escapeCell(col.name)).join(',');

  // Data rows
  const dataLines = rows.map(row => {
    return columns.map(col => {
      const val = row.cells ? row.cells[col.id] : '';
      if (col.type === 'checkbox') {
        return escapeCell(val ? 'true' : 'false');
      }
      return escapeCell(val);
    }).join(',');
  });

  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Infers column type based on column name and sample values.
 * @param {string[]} values
 * @param {string} columnName
 * @returns {'text'|'number'|'date'|'checkbox'|'select'|'markdown'}
 */
export function inferColumnType(values, columnName = '') {
  const nameLower = columnName.toLowerCase();

  // Checkbox heuristics
  if (nameLower.includes('verified') || nameLower.includes('done') || nameLower.includes('complete') || nameLower.includes('flag')) {
    return 'checkbox';
  }

  const nonEmpties = values.map(v => (v !== null && v !== undefined ? String(v).trim() : '')).filter(Boolean);
  if (nonEmpties.length === 0) return 'text';

  // Boolean check
  const isAllBoolean = nonEmpties.every(v => {
    const s = v.toLowerCase();
    return s === 'true' || s === 'false' || s === '1' || s === '0' || s === 'yes' || s === 'no';
  });
  if (isAllBoolean) return 'checkbox';

  // Select / Tag heuristics
  if (nameLower.includes('status') || nameLower.includes('topic') || nameLower.includes('subject') || nameLower.includes('category') || nameLower.includes('tag')) {
    return 'select';
  }

  // Markdown heuristics (contains formatting symbols or multi-line paragraphs)
  const hasMarkdown = nonEmpties.some(v => v.includes('\n') || v.includes('**') || v.includes('# ') || v.includes('`') || v.includes('* '));
  if (hasMarkdown) return 'markdown';

  // Number heuristics
  const isAllNumbers = nonEmpties.every(v => !isNaN(Number(v)) && v !== '');
  if (isAllNumbers) return 'number';

  // Date heuristics
  const isAllDates = nonEmpties.every(v => {
    if (v.length < 8) return false;
    const parsed = Date.parse(v);
    return !isNaN(parsed) && (v.includes('-') || v.includes('/'));
  });
  if (isAllDates) return 'date';

  return 'text';
}
