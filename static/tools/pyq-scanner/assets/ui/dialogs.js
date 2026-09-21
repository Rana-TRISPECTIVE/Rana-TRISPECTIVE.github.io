/**
 * PYQs Pro - Unified Import/Export Modal & Dialogs
 * Tabbed [Import] and [Export] interface supporting CSV, XLSX, and JSON with Visual Column Mapping.
 */

import { el } from '../utils/helpers.js';
import { parseCSV, serializeCSV } from '../data/csv.js';
import { parseXLSX, exportXLSX } from '../data/xlsx.js';
import { parseJSON, exportJSON } from '../data/json.js';
import { exportMarkdown } from '../data/markdown.js';
import { renderColumnMapper } from '../data/mapper.js';
import { mergeDatasets } from '../data/merge.js';
import { stateManager } from '../core/state.js';
import { db } from '../core/database.js';
import { triggerSearch } from '../search/search.js';
import { COLUMN_TYPES } from '../core/config.js';

let activeModal = null;

export function closeModal() {
  if (activeModal) {
    activeModal.remove();
    activeModal = null;
  }
}

/**
 * Opens confirmation modal for destructive operations.
 */
export function openConfirmDialog({ title, message, confirmText = 'Confirm', confirmType = 'danger', onConfirm }) {
  closeModal();

  const backdrop = el('div', { className: 'pyq-modal-backdrop' });
  const card = el('div', { className: 'pyq-modal-card pyq-modal-confirm' });

  const titleEl = el('h3', { className: 'pyq-modal-title' }, title);
  const msgEl = el('p', { className: 'pyq-modal-desc' }, message);

  const actions = el('div', { className: 'pyq-modal-actions' },
    el('button', {
      type: 'button',
      className: 'pyq-btn pyq-btn-sm pyq-btn-ghost',
      onclick: closeModal
    }, 'Cancel'),
    el('button', {
      type: 'button',
      className: `pyq-btn pyq-btn-sm pyq-btn-${confirmType}`,
      onclick: () => {
        closeModal();
        if (onConfirm) onConfirm();
      }
    }, confirmText)
  );

  card.appendChild(titleEl);
  card.appendChild(msgEl);
  card.appendChild(actions);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  activeModal = backdrop;
}

/**
 * Opens Column Creation or Edit Dialog.
 */
export function openColumnDialog(existingColumn = null) {
  closeModal();

  const isEditing = !!existingColumn;
  const backdrop = el('div', { className: 'pyq-modal-backdrop' });
  const card = el('div', { className: 'pyq-modal-card' });

  const header = el('div', { className: 'pyq-modal-header' },
    el('h3', { className: 'pyq-modal-title' }, isEditing ? 'Edit Column Settings' : 'Create New Column'),
    el('button', { type: 'button', className: 'pyq-modal-close-btn', innerHTML: '&times;', onclick: closeModal })
  );

  const form = el('form', { className: 'pyq-modal-form', onsubmit: (e) => e.preventDefault() });

  // Name
  const nameInput = el('input', {
    type: 'text',
    className: 'pyq-input',
    placeholder: 'Column Name (e.g. Subject, Question No)...',
    value: isEditing ? existingColumn.name : '',
    required: true
  });

  // Type
  const typeSelect = el('select', { className: 'pyq-select' },
    el('option', { value: COLUMN_TYPES.TEXT, selected: !isEditing || existingColumn.type === COLUMN_TYPES.TEXT }, 'Plain Text (string)'),
    el('option', { value: COLUMN_TYPES.NUMBER, selected: isEditing && existingColumn.type === COLUMN_TYPES.NUMBER }, 'Number (integer/decimal)'),
    el('option', { value: COLUMN_TYPES.DATE, selected: isEditing && existingColumn.type === COLUMN_TYPES.DATE }, 'Date (YYYY-MM-DD)'),
    el('option', { value: COLUMN_TYPES.CHECKBOX, selected: isEditing && existingColumn.type === COLUMN_TYPES.CHECKBOX }, 'Checkbox (boolean)'),
    el('option', { value: COLUMN_TYPES.SELECT, selected: isEditing && existingColumn.type === COLUMN_TYPES.SELECT }, 'Select / Multi-Tags (color pills)'),
    el('option', { value: COLUMN_TYPES.MARKDOWN, selected: isEditing && existingColumn.type === COLUMN_TYPES.MARKDOWN }, 'Markdown (rich formatted text)')
  );

  form.appendChild(el('label', { className: 'pyq-form-label' }, 'Column Name', nameInput));
  form.appendChild(el('label', { className: 'pyq-form-label' }, 'Data Type', typeSelect));

  const actions = el('div', { className: 'pyq-modal-actions' });

  if (isEditing) {
    const deleteColBtn = el('button', {
      type: 'button',
      className: 'pyq-btn pyq-btn-sm pyq-btn-danger',
      onclick: () => {
        openConfirmDialog({
          title: `Delete Column "${existingColumn.name}"?`,
          message: 'All question values stored under this column will be permanently deleted across all rows in IndexedDB.',
          confirmText: 'Delete Column',
          confirmType: 'danger',
          onConfirm: async () => {
            const { columns, rows } = stateManager.getState();
            const nextCols = columns.filter(c => c.id !== existingColumn.id);
            const nextRows = rows.map(r => {
              const cells = { ...r.cells };
              delete cells[existingColumn.id];
              return { ...r, cells };
            });

            stateManager.setState({ columns: nextCols, rows: nextRows });
            await db.saveColumns(nextCols);
            await db.putRows(nextRows);
            stateManager.showToast(`Column "${existingColumn.name}" deleted`, 'info');
            triggerSearch();
          }
        });
      }
    }, 'Delete Column');
    actions.appendChild(deleteColBtn);
  }

  const saveBtn = el('button', {
    type: 'button',
    className: 'pyq-btn pyq-btn-sm pyq-btn-primary',
    onclick: async () => {
      const name = nameInput.value.trim();
      if (!name) return;
      const type = typeSelect.value;
      const { columns, rows } = stateManager.getState();

      if (isEditing) {
        // Update column definition
        const nextCols = columns.map(c => c.id === existingColumn.id ? { ...c, name, type } : c);
        stateManager.setState({ columns: nextCols });
        await db.saveColumns(nextCols);
        stateManager.showToast('Column updated', 'success');
      } else {
        // Add new column
        const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '_') || `col_${Date.now()}`;
        let finalId = newId;
        let c = 1;
        while (columns.some(col => col.id === finalId)) {
          finalId = `${newId}_${c++}`;
        }

        const newCol = {
          id: finalId,
          name,
          type,
          width: type === COLUMN_TYPES.MARKDOWN ? 320 : type === COLUMN_TYPES.CHECKBOX ? 95 : 170,
          options: type === COLUMN_TYPES.SELECT ? [] : undefined
        };

        const nextCols = [...columns, newCol];
        const nextRows = rows.map(r => ({
          ...r,
          cells: { ...r.cells, [finalId]: type === COLUMN_TYPES.CHECKBOX ? false : '' }
        }));

        stateManager.setState({ columns: nextCols, rows: nextRows });
        await db.saveColumns(nextCols);
        await db.putRows(nextRows);
        stateManager.showToast(`Created column "${name}"`, 'success');
      }

      closeModal();
      triggerSearch();
    }
  }, isEditing ? 'Save Changes' : 'Create Column');

  actions.appendChild(el('button', { type: 'button', className: 'pyq-btn pyq-btn-sm pyq-btn-ghost', onclick: closeModal }, 'Cancel'));
  actions.appendChild(saveBtn);

  card.appendChild(header);
  card.appendChild(form);
  card.appendChild(actions);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  activeModal = backdrop;
}

/**
 * Unified Import & Export Modal
 * Tabbed interface: [Import] and [Export]
 */
export function openUnifiedIOModal(initialTab = 'import') {
  closeModal();

  let activeTab = initialTab;
  let parsedFileData = null; // { headers, rowsData, format }
  let importMode = 'append'; // 'append' | 'replace'
  let columnMapping = {};

  const backdrop = el('div', { className: 'pyq-modal-backdrop' });
  const card = el('div', { className: 'pyq-modal-card pyq-modal-io' });

  // Modal Header with Tabs
  const header = el('div', { className: 'pyq-modal-header pyq-io-header' });
  const tabsContainer = el('div', { className: 'pyq-modal-tabs' });

  const tabImport = el('button', {
    type: 'button',
    className: `pyq-tab-btn ${activeTab === 'import' ? 'pyq-tab-active' : ''}`,
    onclick: () => switchTab('import')
  }, 'Import Dataset');

  const tabExport = el('button', {
    type: 'button',
    className: `pyq-tab-btn ${activeTab === 'export' ? 'pyq-tab-active' : ''}`,
    onclick: () => switchTab('export')
  }, 'Export Database');

  tabsContainer.appendChild(tabImport);
  tabsContainer.appendChild(tabExport);

  const closeBtn = el('button', {
    type: 'button',
    className: 'pyq-modal-close-btn',
    innerHTML: '&times;',
    onclick: closeModal
  });

  header.appendChild(tabsContainer);
  header.appendChild(closeBtn);
  card.appendChild(header);

  // Tab Contents Container
  const contentContainer = el('div', { className: 'pyq-io-content' });
  card.appendChild(contentContainer);

  const switchTab = (tabName) => {
    activeTab = tabName;
    tabImport.className = `pyq-tab-btn ${activeTab === 'import' ? 'pyq-tab-active' : ''}`;
    tabExport.className = `pyq-tab-btn ${activeTab === 'export' ? 'pyq-tab-active' : ''}`;
    renderContent();
  };

  const renderContent = () => {
    contentContainer.innerHTML = '';
    if (activeTab === 'import') {
      renderImportTab();
    } else {
      renderExportTab();
    }
  };

  // --- IMPORT TAB ---
  const renderImportTab = () => {
    const importWrapper = el('div', { className: 'pyq-import-wrapper' });

    if (!parsedFileData) {
      // Step 1: File Drop Zone
      const dropZone = el('div', {
        className: 'pyq-file-dropzone',
        onclick: () => fileInput.click()
      });

      const fileInput = el('input', {
        type: 'file',
        accept: '.csv,.xlsx,.xls,.json',
        style: { display: 'none' },
        onchange: (e) => handleFileSelect(e.target.files[0])
      });

      dropZone.appendChild(fileInput);
      dropZone.appendChild(el('div', { className: 'pyq-dropzone-icon', innerHTML: '&#128194;' }));
      dropZone.appendChild(el('p', { className: 'pyq-dropzone-title' }, 'Drop your CSV, XLSX, or JSON file here'));
      dropZone.appendChild(el('p', { className: 'pyq-dropzone-subtitle' }, 'Supports multi-year datasets, Excel sheets, and JSON backups'));
      dropZone.appendChild(el('span', { className: 'pyq-btn pyq-btn-sm pyq-btn-secondary pyq-mt-2' }, 'Browse Local Files'));

      // Drag and drop events
      ['dragenter', 'dragover'].forEach(name => {
        dropZone.addEventListener(name, (e) => {
          e.preventDefault();
          dropZone.classList.add('pyq-dropzone-active');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        dropZone.addEventListener(name, (e) => {
          e.preventDefault();
          dropZone.classList.remove('pyq-dropzone-active');
        });
      });
      dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileSelect(e.dataTransfer.files[0]);
        }
      });

      importWrapper.appendChild(dropZone);
    } else {
      // Step 2: Mode Selector & Visual Column Mapping Interface
      const previewNotice = el('div', { className: 'pyq-import-status' },
        el('span', { className: 'pyq-status-badge' }, `${parsedFileData.format.toUpperCase()}`),
        el('span', {}, `Detected ${parsedFileData.headers.length} columns and ${parsedFileData.rowsData.length} questions in file.`)
      );
      importWrapper.appendChild(previewNotice);

      // Mode Selector
      const modeGroup = el('div', { className: 'pyq-import-mode-group' });
      const appendRadio = el('label', { className: 'pyq-radio-label' },
        el('input', {
          type: 'radio',
          name: 'importMode',
          value: 'append',
          checked: importMode === 'append',
          onchange: () => { importMode = 'append'; renderContent(); }
        }),
        el('div', { className: 'pyq-radio-text' },
          el('strong', {}, 'Append Mode (Multi-Year Dataset Merge)'),
          el('p', {}, 'Progressively add new exam questions (e.g. 2026 PYQs) without wiping existing records. Zero deduplication overhead.')
        )
      );

      const replaceRadio = el('label', { className: 'pyq-radio-label' },
        el('input', {
          type: 'radio',
          name: 'importMode',
          value: 'replace',
          checked: importMode === 'replace',
          onchange: () => { importMode = 'replace'; renderContent(); }
        }),
        el('div', { className: 'pyq-radio-text' },
          el('strong', {}, 'Replace Mode (Fresh Wipe & Mount)'),
          el('p', {}, 'Wipes current database and rebuilds the table directly from the imported file.')
        )
      );

      modeGroup.appendChild(appendRadio);
      modeGroup.appendChild(replaceRadio);
      importWrapper.appendChild(modeGroup);

      // Visual Column Mapper (Only needed if appending or mapping columns)
      const { columns: targetColumns } = stateManager.getState();
      const mapper = renderColumnMapper(parsedFileData.headers, targetColumns, (newMapping) => {
        columnMapping = newMapping;
      });
      columnMapping = mapper.getMapping();
      importWrapper.appendChild(mapper.element);

      // Execution Actions
      const actions = el('div', { className: 'pyq-modal-actions' },
        el('button', {
          type: 'button',
          className: 'pyq-btn pyq-btn-sm pyq-btn-ghost',
          onclick: () => {
            parsedFileData = null;
            renderContent();
          }
        }, 'Choose Different File'),
        el('button', {
          type: 'button',
          className: `pyq-btn pyq-btn-sm ${importMode === 'replace' ? 'pyq-btn-danger' : 'pyq-btn-primary'}`,
          onclick: () => executeImport()
        }, importMode === 'replace' ? 'Confirm & Replace All Data' : `Append ${parsedFileData.rowsData.length} Questions`)
      );
      importWrapper.appendChild(actions);
    }

    contentContainer.appendChild(importWrapper);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const nameLower = file.name.toLowerCase();

    try {
      if (nameLower.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        if (headers.length === 0) throw new Error('No headers found in CSV file.');
        parsedFileData = { headers, rowsData: rows, format: 'csv' };
      } else if (nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls')) {
        const { headers, rows } = await parseXLSX(file);
        if (headers.length === 0) throw new Error('No valid columns found in Excel workbook.');
        parsedFileData = { headers, rowsData: rows, format: 'xlsx' };
      } else if (nameLower.endsWith('.json')) {
        const text = await file.text();
        const parsed = parseJSON(text);
        if (parsed.isCompleteBackup) {
          // Direct JSON backup restore
          const cols = parsed.columns || [];
          const rows = parsed.rows || [];
          parsedFileData = {
            headers: cols.map(c => c.name),
            rowsData: rows.map(r => cols.map(c => r.cells[c.id] || '')),
            format: 'json',
            rawBackup: parsed
          };
        } else {
          const cols = parsed.columns || [];
          parsedFileData = {
            headers: cols.map(c => c.name),
            rowsData: parsed.rows.map(r => cols.map(c => r.cells[c.id] || '')),
            format: 'json'
          };
        }
      } else {
        throw new Error('Unsupported file extension. Please select .csv, .xlsx, or .json');
      }

      renderContent();
    } catch (err) {
      stateManager.showToast(err.message, 'error', 4500);
    }
  };

  const executeImport = async () => {
    if (!parsedFileData) return;

    const performMerge = async () => {
      const { columns: curCols, rows: curRows } = stateManager.getState();
      const isReplace = importMode === 'replace';

      const merged = mergeDatasets({
        existingColumns: curCols,
        existingRows: curRows,
        incomingHeaders: parsedFileData.headers,
        incomingRowsData: parsedFileData.rowsData,
        columnMapping,
        isReplace
      });

      // Update state and IndexedDB
      stateManager.setState({
        columns: merged.finalColumns,
        rows: merged.finalRows
      });

      await db.saveColumns(merged.finalColumns);
      if (isReplace) {
        await db.clearRows();
      }
      await db.putRows(merged.finalRows);

      closeModal();
      stateManager.showToast(
        isReplace
          ? `Table wiped and mounted with ${merged.addedCount} questions!`
          : `Successfully appended ${merged.addedCount} questions! (Zero duplicates dropped)`,
        'success'
      );
      triggerSearch();
    };

    if (importMode === 'replace') {
      openConfirmDialog({
        title: 'Replace Entire Database?',
        message: 'This will wipe out your current table and mount the incoming dataset. Existing question entries and edits will be removed.',
        confirmText: 'Yes, Wipe & Replace',
        confirmType: 'danger',
        onConfirm: performMerge
      });
    } else {
      await performMerge();
    }
  };

  // --- EXPORT TAB ---
  const renderExportTab = () => {
    const { columns, rows } = stateManager.getState();
    const exportWrapper = el('div', { className: 'pyq-export-wrapper' });

    const infoNotice = el('div', { className: 'pyq-export-notice' },
      el('strong', {}, `Export Target: Consolidated Database (${rows.length} Questions)`),
      el('p', {}, 'Exports 100% of rows stored in IndexedDB with full schema properties and column attributes.')
    );
    exportWrapper.appendChild(infoNotice);

    const formatGrid = el('div', { className: 'pyq-export-format-grid' });

    // Option 1: CSV
    const optCsv = el('div', {
      className: 'pyq-export-card',
      onclick: () => {
        const csv = serializeCSV(columns, rows);
        const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `pyqs-pro-${Date.now()}.csv`);
        closeModal();
        stateManager.showToast('CSV export downloaded successfully! 📊', 'success');
      }
    },
      el('div', { className: 'pyq-card-icon', innerHTML: '&#128196;' }),
      el('h4', { className: 'pyq-card-title' }, 'CSV Spreadsheet (.csv)'),
      el('p', { className: 'pyq-card-desc' }, 'Universally compatible format with Excel, Google Sheets, Python, and R.')
    );

    // Option 2: XLSX
    const optXlsx = el('div', {
      className: 'pyq-export-card',
      onclick: async () => {
        closeModal();
        stateManager.showToast('Preparing XLSX download...', 'info');
        await exportXLSX(columns, rows, `pyqs-pro-${Date.now()}.xlsx`);
        stateManager.showToast('Excel workbook exported! 📗', 'success');
      }
    },
      el('div', { className: 'pyq-card-icon', innerHTML: '&#128202;' }),
      el('h4', { className: 'pyq-card-title' }, 'Microsoft Excel (.xlsx)'),
      el('p', { className: 'pyq-card-desc' }, 'Structured binary workbook with headers and styled sheets.')
    );

    // Option 3: JSON
    const optJson = el('div', {
      className: 'pyq-export-card',
      onclick: () => {
        exportJSON(columns, rows, `pyqs-pro-backup-${Date.now()}.json`);
        closeModal();
        stateManager.showToast('Full JSON backup downloaded! 💾', 'success');
      }
    },
      el('div', { className: 'pyq-card-icon', innerHTML: '&#128279;' }),
      el('h4', { className: 'pyq-card-title' }, 'JSON Snapshot (.json)'),
      el('p', { className: 'pyq-card-desc' }, 'Full lossless archive including custom tag options, widths, and schema metadata.')
    );

    // Option 4: Markdown (.md)
    const optMarkdown = el('div', {
      className: 'pyq-export-card',
      onclick: () => {
        exportMarkdown(columns, rows, `pyqs-pro-${Date.now()}.md`);
        closeModal();
        stateManager.showToast('Markdown document exported! 📝', 'success');
      }
    },
      el('div', { className: 'pyq-card-icon', innerHTML: '&#128221;' }),
      el('h4', { className: 'pyq-card-title' }, 'Markdown Table (.md)'),
      el('p', { className: 'pyq-card-desc' }, 'Formatted GitHub-flavored Markdown table ready for Hugo, Obsidian, and Notion.')
    );

    formatGrid.appendChild(optCsv);
    formatGrid.appendChild(optXlsx);
    formatGrid.appendChild(optJson);
    formatGrid.appendChild(optMarkdown);
    exportWrapper.appendChild(formatGrid);

    contentContainer.appendChild(exportWrapper);
  };

  renderContent();
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  activeModal = backdrop;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
