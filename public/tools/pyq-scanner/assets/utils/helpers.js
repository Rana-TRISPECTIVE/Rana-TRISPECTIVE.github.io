/**
 * PYQs Pro - Helpers & DOM Utilities
 * Pure vanilla JavaScript utilities with zero external dependencies.
 */

/**
 * Creates a namespaced DOM element with attributes, event listeners, and children.
 * @param {string} tag
 * @param {Object} [attrs={}]
 * @param {Array|string|Node} [children=[]]
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className' || key === 'class') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign(element.dataset, value);
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (value === true) {
      element.setAttribute(key, '');
    } else if (value !== false && value !== null && value !== undefined) {
      element.setAttribute(key, String(value));
    }
  }

  appendChildren(element, children);
  return element;
}

/**
 * Helper to append diverse children (nodes, strings, arrays) to a parent element.
 */
function appendChildren(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    if (child instanceof Node) {
      parent.appendChild(child);
    } else {
      parent.appendChild(document.createTextNode(String(child)));
    }
  }
}

/**
 * Escapes HTML characters for safe rendering.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * High-performance lightweight Markdown to HTML renderer.
 * Handles headings, bold, italics, inline code, code blocks, lists, blockquotes, line breaks, and links.
 * @param {string} text
 * @returns {string} HTML string
 */
export function renderMarkdown(text) {
  if (!text) return '';
  let str = String(text);

  // Normalize line endings
  str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Code blocks (```language ... ```)
  str = str.replace(/```([\s\S]*?)```/g, (match, p1) => {
    return `<pre class="pyq-md-code-block"><code>${escapeHtml(p1.trim())}</code></pre>`;
  });

  // Inline code (`code`)
  str = str.replace(/`([^`]+)`/g, (match, p1) => {
    return `<code class="pyq-md-inline-code">${escapeHtml(p1)}</code>`;
  });

  // Blockquotes (> text)
  str = str.replace(/^>\s*(.+)$/gm, (match, p1) => {
    return `<blockquote class="pyq-md-quote">${p1}</blockquote>`;
  });

  // Headings (# h1, ## h2, ### h3)
  str = str.replace(/^###\s*(.+)$/gm, '<h5 class="pyq-md-h3">$1</h5>');
  str = str.replace(/^##\s*(.+)$/gm, '<h4 class="pyq-md-h2">$1</h4>');
  str = str.replace(/^#\s*(.+)$/gm, '<h3 class="pyq-md-h1">$1</h3>');

  // Bold & Italic (***bold italic*** or **bold** or *italic*)
  str = str.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  str = str.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  str = str.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
  str = str.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  str = str.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough (~~del~~)
  str = str.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Markdown links: [label](url)
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const safeUrl = escapeHtml(url.trim());
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="pyq-md-link">${escapeHtml(label)}</a>`;
  });

  // Unordered list items (* or - item)
  str = str.replace(/^[\*\-]\s+(.+)$/gm, '<li class="pyq-md-li">$1</li>');

  // Ordered list items (1. item)
  str = str.replace(/^\d+\.\s+(.+)$/gm, '<li class="pyq-md-li-num">$1</li>');

  // Group list items into <ul> or <ol>
  str = str.replace(/(<li class="pyq-md-li">[\s\S]*?<\/li>)/g, (match) => {
    return `<ul class="pyq-md-ul">${match}</ul>`;
  });
  // Clean double ul wrappers
  str = str.replace(/<\/ul>\s*<ul class="pyq-md-ul">/g, '');

  str = str.replace(/(<li class="pyq-md-li-num">[\s\S]*?<\/li>)/g, (match) => {
    return `<ol class="pyq-md-ol">${match}</ol>`;
  });
  str = str.replace(/<\/ol>\s*<ol class="pyq-md-ol">/g, '');

  // Line breaks inside regular paragraphs (double newline to paragraph, single newline to br)
  const paragraphs = str.split(/\n\n+/);
  str = paragraphs.map(para => {
    para = para.trim();
    if (!para) return '';
    if (para.startsWith('<pre') || para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<blockquote') || para.startsWith('<h')) {
      return para;
    }
    return `<p class="pyq-md-p">${para.replace(/\n/g, '<br/>')}</p>`;
  }).filter(Boolean).join('\n');

  return str;
}

/**
 * Standard debounce function.
 */
export function debounce(fn, delay = 200) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Standard throttle function.
 */
export function throttle(fn, limit = 100) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Unique ID generator.
 */
export function generateId(prefix = 'pyq') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Copies text string to clipboard with fallback.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Web Audio API synthesizer for the Continuous Looping Alarm.
 * Produces an authentic digital watch / physical alarm clock beep pattern.
 */
class AlarmAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.timerId = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playBeep(freq = 880, duration = 0.12, timeOffset = 0) {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime + timeOffset;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Start looping double-beep pattern: beep-beep ... beep-beep ...
   */
  startLoop() {
    if (this.isPlaying) return;
    this.init();
    this.isPlaying = true;

    const beepCycle = () => {
      if (!this.isPlaying) return;
      // Double beep at 950Hz
      this.playBeep(950, 0.1, 0);
      this.playBeep(950, 0.1, 0.16);
      this.timerId = setTimeout(beepCycle, 850);
    };

    beepCycle();
  }

  stopLoop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

export const alarmAudio = new AlarmAudioEngine();
