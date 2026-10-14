/**
 * PYQs Pro - IndexedDB Database Wrapper
 * Provides a structured, transactional, versioned storage engine for high-volume questions.
 */

import { APP_CONFIG, DEFAULT_COLUMNS, DEFAULT_SEED_DATA } from './config.js';
import { STORES, initDatabaseSchema } from './schema.js';

class PYQDatabase {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Initializes the IndexedDB connection and seeds default data if first launch.
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(APP_CONFIG.DB_NAME, APP_CONFIG.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        initDatabaseSchema(db, event);
      };

      request.onsuccess = async () => {
        this.db = request.result;
        try {
          await this.seedDefaultsIfEmpty();
          resolve(this.db);
        } catch (err) {
          console.error('Error during database seed check:', err);
          resolve(this.db);
        }
      };

      request.onerror = () => {
        console.error('IndexedDB open failed:', request.error);
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  /**
   * Seeds initial Mains Economics dataset and column schema if database is brand new.
   */
  async seedDefaultsIfEmpty() {
    const existingCols = await this.getColumns();
    if (!existingCols || existingCols.length === 0) {
      await this.saveColumns(DEFAULT_COLUMNS);
    }

    const existingRows = await this.getAllRows();
    if (!existingRows || existingRows.length === 0) {
      await this.putRows(DEFAULT_SEED_DATA);
    }
  }

  /**
   * Helper to execute a transactional operation.
   * @param {string|string[]} storeNames
   * @param {'readonly'|'readwrite'} mode
   * @param {Function} callback
   * @returns {Promise<any>}
   */
  async transaction(storeNames, mode, callback) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, mode);
      const stores = Array.isArray(storeNames)
        ? storeNames.map(name => tx.objectStore(name))
        : tx.objectStore(storeNames);

      let result;
      try {
        result = callback(stores, tx);
      } catch (err) {
        reject(err);
        return;
      }

      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // --- QUESTIONS (ROWS) CRUD ---

  async getAllRows() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.QUESTIONS, 'readonly');
      const store = tx.objectStore(STORES.QUESTIONS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getRow(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.QUESTIONS, 'readonly');
      const store = tx.objectStore(STORES.QUESTIONS);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async putRow(row) {
    return this.transaction(STORES.QUESTIONS, 'readwrite', (store) => {
      store.put(row);
      return row;
    });
  }

  async putRows(rows) {
    return this.transaction(STORES.QUESTIONS, 'readwrite', (store) => {
      for (const row of rows) {
        store.put(row);
      }
      return rows;
    });
  }

  async deleteRow(id) {
    return this.transaction(STORES.QUESTIONS, 'readwrite', (store) => {
      store.delete(id);
    });
  }

  async clearRows() {
    return this.transaction(STORES.QUESTIONS, 'readwrite', (store) => {
      store.clear();
    });
  }

  async toggleBookmark(id) {
    const row = await this.getRow(id);
    if (!row) return null;
    row.bookmarked = !row.bookmarked;
    await this.putRow(row);
    return row.bookmarked;
  }

  // --- COLUMNS CRUD ---

  async getColumns() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.COLUMNS, 'readonly');
      const store = tx.objectStore(STORES.COLUMNS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveColumns(columns) {
    return this.transaction(STORES.COLUMNS, 'readwrite', (store) => {
      store.clear();
      for (const col of columns) {
        store.put(col);
      }
      return columns;
    });
  }

  async clearColumns() {
    return this.transaction(STORES.COLUMNS, 'readwrite', (store) => {
      store.clear();
    });
  }

  // --- METADATA & SETTINGS ---

  async getSetting(key, fallback = null) {
    const db = await this.init();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.METADATA, 'readonly');
        const store = tx.objectStore(STORES.METADATA);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ? request.result.value : fallback);
        request.onerror = () => resolve(fallback);
      } catch {
        resolve(fallback);
      }
    });
  }

  async setSetting(key, value) {
    return this.transaction(STORES.METADATA, 'readwrite', (store) => {
      store.put({ key, value });
    });
  }

  // --- RESET & BULK OPERATIONS ---

  async resetToDefaults() {
    await this.clearRows();
    await this.clearColumns();
    await this.saveColumns(DEFAULT_COLUMNS);
    await this.putRows(DEFAULT_SEED_DATA);
    return { columns: DEFAULT_COLUMNS, rows: DEFAULT_SEED_DATA };
  }

  async wipeAll() {
    await this.clearRows();
    await this.clearColumns();
    return { columns: [], rows: [] };
  }
}

export const db = new PYQDatabase();
