/**
 * PYQs Pro - Reactive Application State Manager
 * Pub/Sub event-driven state container for table, filters, timer, and modal coordination.
 */

class PYQStateManager {
  constructor() {
    this.state = {
      columns: [],
      rows: [],
      filteredRows: [],
      sortState: null, // { columnId: string, direction: 'asc' | 'desc' }
      filters: [],     // [{ id, columnId, operator, value }]
      filterConjunction: 'AND',
      searchQuery: '',
      bookmarkOnly: false,
      rowLimit: 50,
      isTimerOpen: false,
      isSuspended: false,
      isFullscreen: false,
      isFilterDrawerOpen: false,
      toast: null
    };

    this.listeners = new Set();
    this.keyListeners = new Map();
  }

  /**
   * Returns current full state snapshot.
   */
  getState() {
    return this.state;
  }

  /**
   * Updates state partially and notifies subscribers.
   * @param {Partial<typeof this.state>} partialState
   */
  setState(partialState) {
    const prevState = { ...this.state };
    const changedKeys = [];

    for (const [key, value] of Object.entries(partialState)) {
      if (this.state[key] !== value) {
        this.state[key] = value;
        changedKeys.push(key);
      }
    }

    if (changedKeys.length === 0) return;

    // Notify specific key subscribers
    for (const key of changedKeys) {
      if (this.keyListeners.has(key)) {
        const keySubs = this.keyListeners.get(key);
        for (const sub of keySubs) {
          try {
            sub(this.state[key], prevState[key], this.state);
          } catch (e) {
            console.error(`Error in state subscriber for ${key}:`, e);
          }
        }
      }
    }

    // Notify global subscribers
    for (const listener of this.listeners) {
      try {
        listener(this.state, prevState, changedKeys);
      } catch (e) {
        console.error('Error in global state subscriber:', e);
      }
    }
  }

  /**
   * Subscribe to all state updates.
   * @param {Function} listener (state, prevState, changedKeys) => void
   * @returns {Function} unsubscribe
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to updates of a specific key in state.
   * @param {string} key
   * @param {Function} listener (newValue, oldValue, fullState) => void
   * @returns {Function} unsubscribe
   */
  subscribeKey(key, listener) {
    if (!this.keyListeners.has(key)) {
      this.keyListeners.set(key, new Set());
    }
    this.keyListeners.get(key).add(listener);
    return () => {
      const set = this.keyListeners.get(key);
      if (set) set.delete(listener);
    };
  }

  /**
   * Show a toast message.
   * @param {string} message
   * @param {'success'|'info'|'warning'|'error'} [type='success']
   * @param {number} [duration=3500]
   */
  showToast(message, type = 'success', duration = 3500) {
    this.setState({ toast: { message, type, id: Date.now() } });
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.setState({ toast: null });
    }, duration);
  }
}

export const stateManager = new PYQStateManager();
