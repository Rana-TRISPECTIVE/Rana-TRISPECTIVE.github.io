/**
 * PYQs Pro - Spreadsheet (XLSX) Interchange Handler
 * Provides spreadsheet parsing and generation with graceful zero-dependency fallback.
 */

import { parseCSV, serializeCSV } from './csv.js';

let xlsxLibraryPromise = null;

/**
 * Loads lightweight SheetJS standalone script dynamically on-demand if not already present.
 * @returns {Promise<any>}
 */
async function loadXlsxLibrary() {
  if (window.XLSX) return window.XLSX;
  if (xlsxLibraryPromise) return xlsxLibraryPromise;

  xlsxLibraryPromise = new Promise((resolve, reject) => {
    // Check if script tag is already in DOM
    const existing = document.querySelector('script[data-pyq-xlsx]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.XLSX));
      existing.addEventListener('error', () => resolve(null));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.mini.min.js';
    script.async = true;
    script.dataset.pyqXlsx = 'true';

    script.onload = () => {
      resolve(window.XLSX);
    };

    script.onerror = () => {
      console.warn('XLSX CDN could not be loaded. Falling back to native CSV parser.');
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return xlsxLibraryPromise;
}

/**
 * Parses an XLSX/XLS file into headers and 2D row array.
 * @param {ArrayBuffer|File} fileData
 * @returns {Promise<{ headers: string[], rows: any[][] }>}
 */
export async function parseXLSX(fileData) {
  const XLSX = await loadXlsxLibrary();

  if (XLSX) {
    try {
      const buffer = fileData instanceof ArrayBuffer ? fileData : await fileData.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!jsonRows || jsonRows.length === 0) {
        return { headers: [], rows: [] };
      }

      const headers = jsonRows[0].map(h => String(h || '').trim());
      const rows = jsonRows.slice(1).map(r => r.map(c => (c !== undefined && c !== null ? String(c) : '')));

      return { headers, rows };
    } catch (err) {
      console.error('XLSX parsing failed:', err);
      throw new Error(`Failed to parse Excel file: ${err.message}`);
    }
  }

  // Fallback: If array buffer contains plaintext or CSV representation
  try {
    const text = new TextDecoder('utf-8').decode(fileData instanceof ArrayBuffer ? fileData : await fileData.arrayBuffer());
    return parseCSV(text);
  } catch {
    throw new Error('XLSX processing requires online CDN access or CSV format.');
  }
}

/**
 * Exports data to an XLSX file and initiates download.
 * @param {Array<{id: string, name: string, type: string}>} columns
 * @param {Array<{id: string, cells: Object}>} rows
 * @param {string} [filename='pyqs-pro-export.xlsx']
 */
export async function exportXLSX(columns, rows, filename = 'pyqs-pro-export.xlsx') {
  const XLSX = await loadXlsxLibrary();

  if (XLSX) {
    try {
      const headerRow = columns.map(c => c.name);
      const dataRows = rows.map(r => {
        return columns.map(c => {
          const val = r.cells ? r.cells[c.id] : '';
          if (c.type === 'checkbox') return val ? 'TRUE' : 'FALSE';
          return val !== null && val !== undefined ? val : '';
        });
      });

      const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PYQs');

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('XLSX export failed:', e);
    }
  }

  // Fallback: Export as UTF-8 CSV with .csv extension
  const csvContent = serializeCSV(columns, rows);
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/\.xlsx$/i, '.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
