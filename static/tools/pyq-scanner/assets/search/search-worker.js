/**
 * PYQs Pro - Background Search Web Worker
 * Typo-Tolerant Fuzzy Matcher & Direct Field Namespace Query Dispatcher.
 * Executes on background thread to keep 60fps UI responsive across thousands of rows.
 */

/**
 * Calculates Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Parses query string into structured namespace and fuzzy tokens.
 * Supports: topic:Budget year:2024 "exact phrase" normal_word
 * @param {string} query
 * @returns {Array<{ type: 'namespace'|'free', field?: string, value: string }>}
 */
function parseQueryTokens(query) {
  const tokens = [];
  if (!query || typeof query !== 'string') return tokens;

  // Regex matches namespace:value, namespace:"quoted value", "quoted value", or standalone word
  const regex = /(\b[a-zA-Z0-9_-]+):(?:"([^"]+)"|([^\s]+))|(?:"([^"]+)"|([^\s]+))/g;
  let match;

  while ((match = regex.exec(query)) !== null) {
    if (match[1]) {
      // Namespace syntax: field:val
      const field = match[1].toLowerCase().trim();
      const value = (match[2] !== undefined ? match[2] : match[3] || '').trim();
      if (value) {
        tokens.push({ type: 'namespace', field, value });
      }
    } else {
      // Free text token
      const value = (match[4] !== undefined ? match[4] : match[5] || '').trim();
      if (value) {
        tokens.push({ type: 'free', value });
      }
    }
  }

  return tokens;
}

/**
 * Checks if a search term matches any part or word in the text with typo-tolerance.
 * Supports up to 2-3 character spelling errors (e.g. "easly" -> "easily") and partial word stems.
 * @param {string} text
 * @param {string} term
 * @returns {boolean}
 */
function fuzzyMatchText(text, term) {
  if (!text || !term) return false;
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase().trim();
  if (!lowerTerm) return true;

  // 1. Direct substring match (instant exact match)
  if (lowerText.includes(lowerTerm)) {
    return true;
  }

  // Very short terms (1-2 chars) require direct substring to prevent noise
  if (lowerTerm.length <= 2) {
    return false;
  }

  // 2. Tokenize text into words
  const words = lowerText.split(/[\s,.;:!?()[\]{}"'`*_\/\\#@%^&=+~<>|]+/).filter(w => w.length >= 2);

  // Maximum allowed typos:
  // 3-4 chars: 1 typo (e.g. "judg" -> "judge")
  // 5-8 chars: 2 typos (e.g. "easly" -> "easily", "parlimnt" -> "parliament")
  // 9+ chars: 3 typos
  const maxDistance = lowerTerm.length <= 4 ? 1 : (lowerTerm.length <= 8 ? 2 : 3);

  for (const word of words) {
    // Direct word containment or prefix match
    if (word.includes(lowerTerm)) {
      return true;
    }

    // Levenshtein distance on full word
    if (Math.abs(word.length - lowerTerm.length) <= maxDistance) {
      if (levenshteinDistance(word, lowerTerm) <= maxDistance) {
        return true;
      }
    }

    // Prefix stem distance check for longer words (e.g. term "constiut" for word "constitutional")
    if (word.length > lowerTerm.length) {
      const stem1 = word.slice(0, lowerTerm.length);
      if (levenshteinDistance(stem1, lowerTerm) <= maxDistance) {
        return true;
      }
      if (word.length >= lowerTerm.length + 1) {
        const stem2 = word.slice(0, lowerTerm.length + 1);
        if (levenshteinDistance(stem2, lowerTerm) <= maxDistance) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks if a row satisfies a single namespace or free-text token.
 * @param {Object} row
 * @param {Array} columns
 * @param {Object} token
 * @returns {boolean}
 */
function matchToken(row, columns, token) {
  const cells = row.cells || {};

  if (token.type === 'namespace') {
    const targetCol = columns.find(col =>
      col.id.toLowerCase() === token.field ||
      col.name.toLowerCase() === token.field ||
      col.id.toLowerCase().includes(token.field) ||
      col.name.toLowerCase().includes(token.field)
    );

    if (!targetCol) {
      // If namespace doesn't match a column, fallback to free search
      return matchFreeToken(row, token.value);
    }

    const cellVal = cells[targetCol.id];
    if (cellVal === null || cellVal === undefined) return false;

    if (targetCol.type === 'checkbox') {
      const boolVal = Boolean(cellVal);
      const queryBool = token.value.toLowerCase() === 'true' || token.value === '1' || token.value.toLowerCase() === 'yes';
      return boolVal === queryBool;
    }

    return fuzzyMatchText(String(cellVal), token.value);
  }

  return matchFreeToken(row, token.value);
}

/**
 * Matches free-text across all row fields.
 */
function matchFreeToken(row, term) {
  const cells = row.cells || {};
  for (const val of Object.values(cells)) {
    if (val !== null && val !== undefined) {
      if (fuzzyMatchText(String(val), term)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Evaluates active drawer filter rules with multi-tag and single-tag awareness.
 * @param {Object} row
 * @param {Array} filters
 * @param {'AND'|'OR'} conjunction
 * @returns {boolean}
 */
function evaluateFilters(row, filters, conjunction) {
  if (!filters || filters.length === 0) return true;

  const cells = row.cells || {};
  const results = filters.map(rule => {
    const rawVal = cells[rule.columnId];
    const strVal = rawVal !== null && rawVal !== undefined ? String(rawVal).toLowerCase().trim() : '';
    const ruleVal = String(rule.value || '').toLowerCase().trim();

    // Check individual tags if string contains comma/semicolon
    const tags = strVal.includes(',') || strVal.includes(';')
      ? strVal.split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean)
      : [strVal];

    switch (rule.operator) {
      case 'equals':
        return strVal === ruleVal || tags.includes(ruleVal);
      case 'not_equals':
        return strVal !== ruleVal && !tags.includes(ruleVal);
      case 'contains':
        return strVal.includes(ruleVal) || tags.some(t => t.includes(ruleVal));
      case 'not_contains':
        return !strVal.includes(ruleVal) && !tags.some(t => t.includes(ruleVal));
      case 'is_empty':
        return rawVal === null || rawVal === undefined || String(rawVal).trim() === '';
      case 'is_not_empty':
        return rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '';
      case 'is_checked':
        return rawVal === true;
      case 'is_unchecked':
        return rawVal === false || rawVal === null || rawVal === undefined;
      default:
        return true;
    }
  });

  return conjunction === 'OR'
    ? results.some(Boolean)
    : results.every(Boolean);
}

// Web Worker message listener
self.onmessage = function (e) {
  const { type, query, rows, columns, bookmarkOnly, filters, conjunction, requestId } = e.data;

  if (type === 'SEARCH') {
    const queryTokens = parseQueryTokens(query);

    // Evaluate 100% of rows
    const matchedRowIds = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Bookmark filter check
      if (bookmarkOnly && !row.bookmarked) {
        continue;
      }

      // Filter drawer rules check
      if (!evaluateFilters(row, filters, conjunction)) {
        continue;
      }

      // Smart search query matching (all tokens must match)
      if (queryTokens.length > 0) {
        let allMatched = true;
        for (let j = 0; j < queryTokens.length; j++) {
          if (!matchToken(row, columns, queryTokens[j])) {
            allMatched = false;
            break;
          }
        }
        if (!allMatched) continue;
      }

      matchedRowIds.push(row.id);
    }

    self.postMessage({
      type: 'SEARCH_RESULTS',
      requestId,
      matchedRowIds,
      totalEvaluated: rows.length,
      matchedCount: matchedRowIds.length
    });
  }
};
