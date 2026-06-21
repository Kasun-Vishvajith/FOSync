/**
 * Chat parsing and intent matching helper.
 * Normalizes input text and applies keyword-group matching with typo similarity checks.
 */

export const KEYWORD_GROUPS = {
  timeline: ['timeline', 'timline', 'timleine', 'time line', 'schedule', 'sched', 'all events', 'everything'],
  exam: ['exam', 'exm', 'eaxm', 'exma', 'ezam', 'xam', 'test', 'tst', 'quiz', 'quz'],
  deadline: ['deadline', 'deadlin', 'dedline', 'dealine', 'due', 'du', 'assignment', 'assignmnt', 'asg'],
  lecture: ['lecture', 'lectur', 'lecutre', 'class', 'cls', 'lec'],
  practical: ['practical', 'practcal', 'pratical', 'lab', 'labo', 'prac'],
  tutorial: ['tutorial', 'tutoral', 'tutrial', 'tut', 'tute'],
  action: ['add', 'ad', 'aad', 'create', 'creat', 'crt', 'new', 'nw', 'schedule', 'sched', 'shedule', 'make', 'mk'],
  
  // New groups
  viewAction: ['show', 'list', 'find', 'display', 'what', 'view', 'shw', 'lst', 'fnd', 'fid', 'displa', 'displya', 'wat', 'vw', 'viw'],
  dateFilter: ['today', 'tomorrow', 'this week', 'next week', 'upcoming', 'tomorow', 'tommorow', 'todey', 'upcomming', 'upcoing'],
  updateAction: ['edit', 'update', 'change', 'reschedule', 'move', 'modify', 'edt', 'eidt', 'updat', 'updte', 'chang', 'chnge', 'reschedul', 'reschdule', 'mve', 'modfy', 'modyfy'],
  deleteAction: ['delete', 'remove', 'cancel', 'clear', 'delet', 'dlete', 'deltee', 'remve', 'rmove', 'cancle', 'cncel', 'cncl', 'clera', 'clr'],
  help: ['help', 'hi', 'hello', 'hey', 'assist', 'commands', 'hlp', 'halp', 'helo', 'hii', 'heyy', 'assit', 'asist', 'comands'],
  confirmYes: ['yes', 'confirm', 'ok', 'okay', 'sure', 'yess', 'ye', 'confrm', 'cofirm', 'okey', 'suree'],
  confirmNo: ['no', 'cancel that', 'nevermind', 'stop', 'abort', 'noo', 'n', 'nevermnd', 'nvm', 'stp', 'abrt'],
  recurrence: ['every', 'daily', 'weekly', 'recurring', 'repeat', 'evry', 'evey', 'dayli', 'weekl', 'weekley', 'recuring', 'recurrng', 'repeet', 'repeatt'],
  locationTrigger: ['at', 'in', 'room', 'venue', 'hall', 'lab no', 'located', 'rm', 'vanue', 'venu', 'hal', 'loctaed', 'lcoated']
};

/**
 * Normalizes plurals by stripping trailing 's' or 'es' for words of length >= 4.
 */
export function normalizePlural(word) {
  if (!word || word.length < 4) return word;
  if (word.endsWith('sses')) {
    return word.slice(0, -2); // classes -> class
  }
  if (word.endsWith('es')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Normalizes user text for parser operations.
 * - Converts to lowercase
 * - Strips common symbols / punctuation
 * - Collapses multiple spaces to a single space
 * - Trims leading and trailing whitespace
 */
export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(new RegExp('[.,/#!$%^&*;:{}=\\-_`~()?]', 'g'), ' ') // replace symbols with spaces to prevent merging words
    .replace(/\s+/g, ' ')                         // replace multiple spaces with a single space
    .trim();
}

/**
 * Computes the standard Levenshtein (edit) distance between two strings.
 */
export function getLevenshteinDistance(a, b) {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Compares a word to a target keyword with small typo tolerance.
 * - Word length must not differ by more than 1 character from keyword.
 * - Target keyword must be at least 3 characters long to prevent matching short noise (e.g. "it", "do", "du").
 * - Returns true if Levenshtein distance <= 1.
 */
export function isSimilar(word, keyword) {
  if (word === keyword) return true;
  if (Math.abs(word.length - keyword.length) > 1) return false;
  if (keyword.length < 3) return false; // require min length of 3 for typo tolerance
  return getLevenshteinDistance(word, keyword) <= 1;
}

/**
 * Matches normalized text against a group of keywords.
 * - First, checks for multi-word phrase matches.
 * - Next, splits input text into words and checks for exact matches.
 * - If no exact match is found and useSimilarity is true, falls back to typo similarity checks.
 */
export function matchKeywordGroup(normalizedText, groupKeywords, useSimilarity = false) {
  if (!normalizedText) return false;

  // 1. Check for multi-word phrases (e.g. "all events", "time line")
  for (const kw of groupKeywords) {
    if (kw.includes(' ')) {
      if (normalizedText.includes(kw)) return true;
    }
  }

  // 2. Word-by-word matching
  const words = normalizedText.split(' ');
  for (const kw of groupKeywords) {
    if (kw.includes(' ')) continue; // already checked

    const normKw = normalizePlural(kw);
    for (const w of words) {
      const normW = normalizePlural(w);
      if (normW === normKw) return true;
      if (useSimilarity && isSimilar(normW, normKw)) return true;
    }
  }

  return false;
}

/**
 * Detects if a message has a "Create Event" intent.
 * - Must contain at least one action keyword (e.g., "add", "create").
 * - Must contain at least one event type keyword (e.g., "exam", "deadline", "lecture", "practical", "tutorial").
 */
export function detectCreateIntent(normalizedText) {
  const hasAction = matchKeywordGroup(normalizedText, KEYWORD_GROUPS.action, true);
  const hasEventType = 
    matchKeywordGroup(normalizedText, KEYWORD_GROUPS.exam, true) ||
    matchKeywordGroup(normalizedText, KEYWORD_GROUPS.deadline, true) ||
    matchKeywordGroup(normalizedText, KEYWORD_GROUPS.lecture, true) ||
    matchKeywordGroup(normalizedText, KEYWORD_GROUPS.practical, true) ||
    matchKeywordGroup(normalizedText, KEYWORD_GROUPS.tutorial, true);

  return hasAction && hasEventType;
}

export function detectUpdateIntent(normalizedText) {
  return matchKeywordGroup(normalizedText, KEYWORD_GROUPS.updateAction, true);
}

export function detectDeleteIntent(normalizedText) {
  return matchKeywordGroup(normalizedText, KEYWORD_GROUPS.deleteAction, true);
}

export function detectConversationalControl(normalizedText) {
  if (matchKeywordGroup(normalizedText, KEYWORD_GROUPS.help, true)) return 'help';
  if (matchKeywordGroup(normalizedText, KEYWORD_GROUPS.confirmYes, true)) return 'yes';
  if (matchKeywordGroup(normalizedText, KEYWORD_GROUPS.confirmNo, true)) return 'no';
  return null;
}

