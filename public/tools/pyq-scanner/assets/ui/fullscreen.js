/**
 * PYQs Pro - Distraction-Free Study Focus Mode Controller
 * Eliminates UI clutter (Export, Import, Timer, Extra toolbars) while keeping Search
 * and Question Table front and center, without hijacking native browser windows or hiding other tabs.
 */

import { stateManager } from '../core/state.js';

export class PYQFocusModeController {
  constructor(appRoot) {
    this.appRoot = appRoot;
    this.init();
  }

  init() {
    // Listen for Escape key to exit Focus Mode
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const { isFocusMode } = stateManager.getState();
        if (isFocusMode) {
          this.exitFocusMode();
        }
      }
    });

    stateManager.subscribeKey('isFocusMode', (isFocus) => {
      if (isFocus) {
        this.appRoot.classList.add('pyq-focus-mode');
      } else {
        this.appRoot.classList.remove('pyq-focus-mode');
      }
    });
  }

  toggleFocusMode() {
    const { isFocusMode } = stateManager.getState();
    if (isFocusMode) {
      this.exitFocusMode();
    } else {
      this.enterFocusMode();
    }
  }

  enterFocusMode() {
    stateManager.setState({ isFocusMode: true });
    this.appRoot.classList.add('pyq-focus-mode');
    stateManager.showToast('🎯 Focus Mode Activated (Press Esc to exit)', 'info');
  }

  exitFocusMode() {
    stateManager.setState({ isFocusMode: false });
    this.appRoot.classList.remove('pyq-focus-mode');
    stateManager.showToast('Exited Focus Mode', 'info');
  }

  // Alias for backward compatibility
  toggleFullscreen() {
    this.toggleFocusMode();
  }
}

export const PYQFullscreenController = PYQFocusModeController;
