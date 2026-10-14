/**
 * PYQs Pro - Native Markdown Table Serializer & Exporter
 * Formats table rows into GitHub-flavored Markdown compatible with Hugo, Obsidian, and Notion.
 */

/**
 * Serializes columns and rows into a formatted Markdown document.
 * @param {Array<{id: string, name: string, type: string}>} columns
 * @param {Array<{id: string, cells: Object, bookmarked?: boolean}>} rows
 * @param {string} [title]
 * @returns {string}
 */
export function serializeMarkdown(columns, rows, title = 'Mains Previous Year Questions (PYQs Pro)') {
  if (!columns || columns.length === 0) return '';

  const escapeMdCell = (val, colType) => {
    if (val === null || val === undefined) return '';
    if (colType === 'checkbox') {
      return val ? '[x]' : '[ ]';
    }
    const str = String(val);
    // Replace newlines with <br> to prevent breaking Markdown table rows, and escape pipe characters
    return str
      .replace(/\|/g, '\\|')
      .replace(/\r?\n/g, '<br>');
  };

  const lines = [];

  // Header Title
  lines.push(`# ${title}`);
  lines.push(`*Consolidated Question Archive: ${rows.length} entries | Exported on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}*\n`);

  // Markdown Table Header
  const headers = ['#', ...columns.map(c => c.name), 'Bookmarked'];
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map((h, i) => (i === 0 ? ':---:' : '---')).join(' | ')} |`;

  lines.push(headerLine);
  lines.push(separatorLine);

  // Markdown Table Rows
  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const cells = columns.map(col => {
      const val = row.cells ? row.cells[col.id] : '';
      return escapeMdCell(val, col.type);
    });
    const bookmarkCell = row.bookmarked ? '★ Yes' : 'No';

    lines.push(`| ${rowNum} | ${cells.join(' | ')} | ${bookmarkCell} |`);
  });

  lines.push(''); // Trailing newline
  return lines.join('\n');
}

/**
 * Triggers browser download for Markdown document.
 * @param {Array} columns
 * @param {Array} rows
 * @param {string} filename
 */
export function exportMarkdown(columns, rows, filename = `pyqs-pro-${Date.now()}.md`) {
  const md = serializeMarkdown(columns, rows);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
