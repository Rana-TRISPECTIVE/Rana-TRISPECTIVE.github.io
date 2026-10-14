/**
 * PYQs Pro - Immersive Dark Purple Study Timer
 * Distraction-free full-window dark purple study screen with ultra-bold typography,
 * quick Start/Pause/Reset controls, and a dedicated Settings (⚙️) panel for presets & alarms.
 */

import { el, alarmAudio } from '../utils/helpers.js';
import { stateManager } from '../core/state.js';
import { TIMER_PRESETS } from '../core/config.js';

export class PYQStudyTimer {
  constructor() {
    this.container = null;
    this.timerInterval = null;

    this.remainingSeconds = 25 * 60;
    this.targetSeconds = 25 * 60;
    this.isRunning = false;
    this.isAlarmActive = false;
    this.isSettingsOpen = false;
    this.isSoundEnabled = true;
    this.activePresetLabel = '25 min (GS 15-Marker Drill)';

    this.init();
  }

  init() {
    stateManager.subscribeKey('isTimerOpen', (isOpen) => {
      if (isOpen) {
        this.open();
      } else {
        this.close();
      }
    });
  }

  open() {
    if (this.container) return;

    // Window Isolation: Suspend heavy table calculations while timer is active
    stateManager.setState({ isSuspended: true });

    this.render();
  }

  close() {
    if (!this.container) return;
    this.stopAlarm();
    this.pauseTimer();
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
    this.container.remove();
    this.container = null;
    this.isSettingsOpen = false;

    // Resume table reactivity
    stateManager.setState({ isTimerOpen: false, isSuspended: false });
  }

  render() {
    this.container = el('div', {
      className: 'pyq-immersive-timer',
      id: 'pyq-study-timer-window'
    });

    // 1. Top Header Bar (Subtle & Unobtrusive)
    const topBar = el('div', { className: 'pyq-timer-topbar' },
      el('div', { className: 'pyq-timer-badge-group' },
        el('span', { className: 'pyq-timer-glyph', innerHTML: '&#9201;' }),
        el('span', { className: 'pyq-timer-heading' }, 'Mains Focus Timer'),
        el('span', { className: 'pyq-timer-preset-tag' }, this.activePresetLabel)
      ),
      el('button', {
        type: 'button',
        className: 'pyq-timer-exit-btn',
        title: 'Exit Timer (Esc)',
        innerHTML: '&times;',
        onclick: () => this.close()
      })
    );

    // 2. Alarm Alert Banner (Hidden until 00:00)
    this.alarmBanner = el('div', {
      className: 'pyq-timer-alarm-banner',
      style: { display: this.isAlarmActive ? 'flex' : 'none' }
    },
      el('div', { className: 'pyq-alarm-text' },
        el('span', { className: 'pyq-alarm-bell', innerHTML: '&#128276;' }),
        el('strong', {}, 'TIME EXPIRED! Mains Answer Writing Window Finished.')
      ),
      el('button', {
        type: 'button',
        className: 'pyq-btn pyq-btn-danger pyq-btn-stop-alarm',
        onclick: () => this.stopAlarm()
      }, 'STOP ALARM (Space)')
    );

    // 3. Central Ultra-Bold Typography Display
    const clockSection = el('div', { className: 'pyq-timer-center-display' });
    this.clockDisplay = el('div', { className: 'pyq-timer-mega-clock' }, this.formatTime(this.remainingSeconds));
    this.subStatusDisplay = el('div', { className: 'pyq-timer-substatus' },
      this.isRunning ? 'Focus Mode Active • Writing Answer' : 'Ready • Click Start to Begin'
    );
    clockSection.appendChild(this.clockDisplay);
    clockSection.appendChild(this.subStatusDisplay);

    // 4. Floating Glass Bottom Controls Bar
    const bottomControls = el('div', { className: 'pyq-timer-bottom-controls' });

    // Start / Pause button (starts with "Start")
    this.startBtn = el('button', {
      type: 'button',
      className: `pyq-timer-btn-main ${this.isRunning ? 'pyq-btn-pause' : 'pyq-btn-start'}`,
      onclick: () => this.toggleTimer()
    }, this.isRunning ? 'Pause' : 'Start');

    // Reset button
    this.resetBtn = el('button', {
      type: 'button',
      className: 'pyq-timer-btn-secondary',
      title: 'Reset countdown',
      onclick: () => this.resetTimer()
    }, 'Reset');

    // Settings ⚙️ button
    this.settingsBtn = el('button', {
      type: 'button',
      className: 'pyq-timer-icon-btn pyq-timer-settings-btn',
      title: 'Timer Settings (Presets, Custom Time & Alarm Sound)',
      innerHTML: '&#9881;',
      onclick: () => this.toggleSettings()
    });

    bottomControls.appendChild(this.startBtn);
    bottomControls.appendChild(this.resetBtn);
    bottomControls.appendChild(this.settingsBtn);

    // 5. Floating Settings Popover Modal (Hidden by default)
    this.settingsModal = this.renderSettingsModal();

    this.container.appendChild(topBar);
    this.container.appendChild(this.alarmBanner);
    this.container.appendChild(clockSection);
    this.container.appendChild(bottomControls);
    this.container.appendChild(this.settingsModal);

    document.body.appendChild(this.container);

    // Keyboard Shortcuts (Space for Start/Pause/Stop Alarm, Esc to exit)
    this.keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.isAlarmActive) {
          this.stopAlarm();
        } else {
          this.toggleTimer();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (this.isSettingsOpen) {
          this.toggleSettings();
        } else {
          this.close();
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  renderSettingsModal() {
    const modal = el('div', {
      className: 'pyq-timer-settings-overlay',
      style: { display: 'none' },
      onclick: (e) => {
        if (e.target === modal) this.toggleSettings();
      }
    });

    const card = el('div', { className: 'pyq-timer-settings-card' });

    // Header
    const cardHeader = el('div', { className: 'pyq-timer-settings-header' },
      el('h3', { className: 'pyq-settings-title' },
        el('span', { innerHTML: '&#9881; ' }),
        document.createTextNode('Timer Settings')
      ),
      el('button', {
        type: 'button',
        className: 'pyq-modal-close-btn',
        innerHTML: '&times;',
        onclick: () => this.toggleSettings()
      })
    );

    const cardBody = el('div', { className: 'pyq-settings-body' });

    // Section 1: Study Drill Presets
    const presetSection = el('div', { className: 'pyq-settings-section' },
      el('label', { className: 'pyq-settings-label' }, 'Study Drill Presets:'),
      el('div', { className: 'pyq-settings-presets-grid' })
    );

    const presetGrid = presetSection.querySelector('.pyq-settings-presets-grid');
    TIMER_PRESETS.forEach(preset => {
      const btn = el('button', {
        type: 'button',
        className: `pyq-preset-card-btn ${this.targetSeconds === preset.minutes * 60 ? 'pyq-preset-active' : ''}`,
        onclick: () => {
          this.activePresetLabel = `${preset.label} (${preset.description})`;
          this.applyPreset(preset.minutes * 60);
          this.toggleSettings();
        }
      },
        el('strong', {}, preset.label),
        el('span', {}, preset.description)
      );
      presetGrid.appendChild(btn);
    });

    // Section 2: Custom Duration
    const customSection = el('div', { className: 'pyq-settings-section' },
      el('label', { className: 'pyq-settings-label' }, 'Custom Countdown Duration:'),
      el('div', { className: 'pyq-settings-custom-row' })
    );

    const customRow = customSection.querySelector('.pyq-settings-custom-row');

    const hoursInput = el('input', {
      type: 'number',
      min: '0',
      max: '23',
      className: 'pyq-settings-num-input',
      value: String(Math.floor(this.targetSeconds / 3600)),
      placeholder: '00'
    });

    const minsInput = el('input', {
      type: 'number',
      min: '0',
      max: '59',
      className: 'pyq-settings-num-input',
      value: String(Math.floor((this.targetSeconds % 3600) / 60)),
      placeholder: '25'
    });

    const secsInput = el('input', {
      type: 'number',
      min: '0',
      max: '59',
      className: 'pyq-settings-num-input',
      value: String(this.targetSeconds % 60),
      placeholder: '00'
    });

    const applyBtn = el('button', {
      type: 'button',
      className: 'pyq-btn pyq-btn-sm pyq-btn-primary',
      onclick: () => {
        const h = Math.max(0, parseInt(hoursInput.value, 10) || 0);
        const m = Math.max(0, parseInt(minsInput.value, 10) || 0);
        const s = Math.max(0, parseInt(secsInput.value, 10) || 0);
        const total = (h * 3600) + (m * 60) + s;
        if (total > 0) {
          this.activePresetLabel = `Custom (${h}h ${m}m ${s}s)`;
          this.applyPreset(total);
          this.toggleSettings();
        }
      }
    }, 'Set Time');

    customRow.appendChild(el('div', { className: 'pyq-input-group' }, hoursInput, el('span', {}, 'hr')));
    customRow.appendChild(el('div', { className: 'pyq-input-group' }, minsInput, el('span', {}, 'min')));
    customRow.appendChild(el('div', { className: 'pyq-input-group' }, secsInput, el('span', {}, 'sec')));
    customRow.appendChild(applyBtn);

    // Section 3: Alarm Audio Options
    const soundSection = el('div', { className: 'pyq-settings-section pyq-settings-sound-section' },
      el('label', { className: 'pyq-settings-label' }, 'Audio Alarm & Alerts:'),
      el('div', { className: 'pyq-sound-controls-row' },
        el('label', { className: 'pyq-sound-toggle-label' },
          el('input', {
            type: 'checkbox',
            checked: this.isSoundEnabled,
            onchange: (e) => {
              this.isSoundEnabled = e.target.checked;
            }
          }),
          el('span', {}, 'Continuous Looping Alarm on Finish')
        ),
        el('button', {
          type: 'button',
          className: 'pyq-btn pyq-btn-xs pyq-btn-secondary',
          title: 'Test Web Audio buzzer',
          onclick: () => {
            alarmAudio.init();
            alarmAudio.playBeep(950, 0.1, 0);
            alarmAudio.playBeep(950, 0.1, 0.18);
          }
        }, '🔔 Test Alarm Sound')
      )
    );

    cardBody.appendChild(presetSection);
    cardBody.appendChild(customSection);
    cardBody.appendChild(soundSection);

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    modal.appendChild(card);

    return modal;
  }

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
    if (this.settingsModal) {
      this.settingsModal.style.display = this.isSettingsOpen ? 'flex' : 'none';
    }
  }

  formatTime(totalSecs) {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  updateDisplay() {
    if (this.clockDisplay) {
      this.clockDisplay.textContent = this.formatTime(this.remainingSeconds);
    }
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.remainingSeconds <= 0) return;
    this.stopAlarm();
    this.isRunning = true;
    if (this.startBtn) {
      this.startBtn.textContent = 'Pause';
      this.startBtn.className = 'pyq-timer-btn-main pyq-btn-pause';
    }
    if (this.subStatusDisplay) {
      this.subStatusDisplay.textContent = 'Focus Mode Active • Writing Answer';
    }

    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.updateDisplay();
      } else {
        this.triggerAlarm();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.startBtn) {
      this.startBtn.textContent = 'Resume';
      this.startBtn.className = 'pyq-timer-btn-main pyq-btn-start';
    }
    if (this.subStatusDisplay) {
      this.subStatusDisplay.textContent = 'Timer Paused • Click Resume to Continue';
    }
  }

  resetTimer() {
    this.pauseTimer();
    this.stopAlarm();
    this.remainingSeconds = this.targetSeconds;
    this.updateDisplay();
    if (this.startBtn) {
      this.startBtn.textContent = 'Start';
      this.startBtn.className = 'pyq-timer-btn-main pyq-btn-start';
    }
    if (this.subStatusDisplay) {
      this.subStatusDisplay.textContent = 'Ready • Click Start to Begin';
    }
  }

  applyPreset(seconds) {
    this.targetSeconds = seconds;
    this.resetTimer();
    const tag = this.container?.querySelector('.pyq-timer-preset-tag');
    if (tag) {
      tag.textContent = this.activePresetLabel;
    }
  }

  triggerAlarm() {
    this.pauseTimer();
    this.isAlarmActive = true;
    if (this.alarmBanner) {
      this.alarmBanner.style.display = 'flex';
    }
    if (this.subStatusDisplay) {
      this.subStatusDisplay.textContent = '🔔 TIME EXPIRED!';
    }

    if (this.isSoundEnabled) {
      alarmAudio.startLoop();
    }

    if (this.container) {
      this.container.classList.add('pyq-timer-ringing');
    }
  }

  stopAlarm() {
    this.isAlarmActive = false;
    alarmAudio.stopLoop();
    if (this.alarmBanner) {
      this.alarmBanner.style.display = 'none';
    }
    if (this.container) {
      this.container.classList.remove('pyq-timer-ringing');
    }
    if (this.subStatusDisplay) {
      this.subStatusDisplay.textContent = 'Ready • Click Start to Begin';
    }
  }
}

export const studyTimer = new PYQStudyTimer();
