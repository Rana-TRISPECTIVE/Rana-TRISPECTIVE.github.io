/**
 * PYQs Pro - IndexedDB Schema & Store Definitions
 */

export const STORES = {
  QUESTIONS: 'questions',
  COLUMNS: 'columns',
  METADATA: 'metadata'
};

/**
 * Initializes or upgrades the IndexedDB schema.
 * @param {IDBDatabase} db
 * @param {IDBVersionChangeEvent} event
 */
export function initDatabaseSchema(db, event) {
  // Questions / Rows Store
  if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
    const questionsStore = db.createObjectStore(STORES.QUESTIONS, { keyPath: 'id' });
    questionsStore.createIndex('by_year', 'cells.year', { unique: false });
    questionsStore.createIndex('by_topic', 'cells.topic', { unique: false });
    questionsStore.createIndex('by_status', 'cells.status', { unique: false });
    questionsStore.createIndex('by_bookmarked', 'bookmarked', { unique: false });
  }

  // Columns Store
  if (!db.objectStoreNames.contains(STORES.COLUMNS)) {
    db.createObjectStore(STORES.COLUMNS, { keyPath: 'id' });
  }

  // Metadata / Settings Store
  if (!db.objectStoreNames.contains(STORES.METADATA)) {
    db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
  }
}
