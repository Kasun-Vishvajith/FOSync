import * as chrono from 'chrono-node';
import { normalizeText, isSimilar, KEYWORD_GROUPS, matchKeywordGroup } from './chatMatcher';
import { parseCustomTime } from './helpers';

/**
 * Splits a multi-event input string into individual event segments.
 */
export function splitMultiEvents(inputStr) {
  if (!inputStr) return [];
  const splitRegex = /\s+\b(?:and|then|also)\b\s+|,\s*(?=\b(?:add|create|new|schedule|make|exam|deadline|lecture|practical|tutorial|class|lab|test|quiz|tut|then|also|every|daily|weekly)\b)/i;
  const parts = inputStr.split(splitRegex).map(p => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [inputStr];
}

/**
 * Parses recurrence details from the input text.
 */
export function parseRecurrence(inputStr, startDate) {
  const normalized = inputStr.toLowerCase();
  if (!/\b(?:every|daily|weekly|recurring|repeat|evry|evey|dayli|weekl|weekley|recuring|recurrng|repeet|repeatt)\b/i.test(normalized)) {
    return null;
  }

  let freq = 'weekly'; // Default
  let byday = null;
  let until = null;
  let count = null;

  // Determine frequency and day
  if (/\bdaily\b|\bevery\s+day\b/i.test(normalized)) {
    freq = 'daily';
  } else {
    const dayMap = {
      monday: 'MO', mon: 'MO',
      tuesday: 'TU', tue: 'TU', tues: 'TU',
      wednesday: 'WE', wed: 'WE',
      thursday: 'TH', thu: 'TH', thur: 'TH', thurs: 'TH',
      friday: 'FR', fri: 'FR',
      saturday: 'SA', sat: 'SA',
      sunday: 'SU', sun: 'SU'
    };
    for (const [dayName, code] of Object.entries(dayMap)) {
      const dayRegex = new RegExp(`\\bevery\\s+${dayName}\\b|\\b${dayName}s\\b`, 'i');
      if (dayRegex.test(normalized)) {
        freq = 'weekly';
        byday = code;
        break;
      }
    }
  }

  // Parse end conditions
  const weeksMatch = normalized.match(/for\s+(\d+)\s+week/i);
  if (weeksMatch) {
    count = parseInt(weeksMatch[1], 10);
    if (startDate) {
      const endD = new Date(startDate);
      endD.setDate(endD.getDate() + count * 7);
      until = endD;
    }
  }

  const untilRegex = /until\s+([a-z0-9\s,]+)/i;
  const untilMatch = normalized.match(untilRegex);
  if (untilMatch) {
    const parsedResults = chrono.parse(untilMatch[1], new Date());
    if (parsedResults && parsedResults.length > 0) {
      until = parsedResults[0].start.date();
    }
  }

  if (normalized.includes('rest of the semester') || normalized.includes('rest of semester')) {
    const baseDate = startDate || new Date();
    const endD = new Date(baseDate);
    endD.setDate(endD.getDate() + 12 * 7); // Default to 12 weeks
    until = endD;
  }

  if (!until && !count) {
    const baseDate = startDate || new Date();
    const endD = new Date(baseDate);
    endD.setDate(endD.getDate() + 8 * 7); // Default to 8 weeks
    until = endD;
  }

  return { freq, byday, until: until ? until.toISOString() : null, count };
}

/**
 * Parses a single event string.
 */
function parseSingleEvent(inputStr, availableCourses, matchCourseFn) {
  const normalizedInput = normalizeText(inputStr);
  let selectedType = 'lecture'; // Default
  let earliestIndex = Infinity;
  let hasType = false;

  const typeMapping = [
    { type: 'exam', keywords: KEYWORD_GROUPS.exam },
    { type: 'deadline', keywords: KEYWORD_GROUPS.deadline },
    { type: 'practical', keywords: KEYWORD_GROUPS.practical },
    { type: 'tutorial', keywords: KEYWORD_GROUPS.tutorial },
    { type: 'lecture', keywords: KEYWORD_GROUPS.lecture }
  ];

  // Check exact word boundaries first
  for (const mapping of typeMapping) {
    for (const keyword of mapping.keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const match = normalizedInput.match(regex);
      if (match && match.index < earliestIndex) {
        earliestIndex = match.index;
        selectedType = mapping.type;
        hasType = true;
      }
    }
  }

  // Typo fallback
  if (earliestIndex === Infinity) {
    const words = normalizedInput.split(' ');
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const w = words[wordIndex];
      for (const mapping of typeMapping) {
        for (const keyword of mapping.keywords) {
          if (isSimilar(w, keyword) && wordIndex < earliestIndex) {
            earliestIndex = wordIndex;
            selectedType = mapping.type;
            hasType = true;
          }
        }
      }
    }
  }

  // Match Course
  const courseMatch = matchCourseFn(inputStr, availableCourses);

  // Clean string for Chrono parsing
  let stringForDateParsing = inputStr;
  if (courseMatch && courseMatch.matchedText) {
    stringForDateParsing = stringForDateParsing.replace(courseMatch.matchedText, '');
  }

  // Parse dates using Chrono
  const referenceDate = new Date();
  const parsedResults = chrono.parse(stringForDateParsing, referenceDate);
  let parsedDate = null;
  let parsedEndDate = null;
  let hasTime = false;
  let isTimeAmbiguous = false;
  
  if (parsedResults && parsedResults.length > 0) {
    parsedDate = parsedResults[0].start.date();
    hasTime = parsedResults[0].start.isCertain('hour');
    
    if (parsedResults[0].end) {
      parsedEndDate = parsedResults[0].end.date();
      if (!parsedResults[0].end.isCertain('year')) {
        parsedEndDate.setFullYear(referenceDate.getFullYear());
      }
    }
    
    if (!hasTime) {
      parsedDate.setHours(9, 0, 0, 0); // Default to 9:00 AM
    } else if (!parsedResults[0].start.isCertain('meridiem')) {
      // Bare number detection (e.g. "at 9")
      const hour = parsedResults[0].start.get('hour');
      if (hour >= 7 && hour <= 11) {
        parsedDate.setHours(hour, 0, 0, 0);
        if (hour >= 8) isTimeAmbiguous = true; // typical class hours
      } else if (hour >= 12 || hour <= 6) {
        const pmHour = hour < 12 ? hour + 12 : hour;
        parsedDate.setHours(pmHour, 0, 0, 0);
        if (pmHour <= 17) isTimeAmbiguous = true; // typical class hours
      }
    }
    
    if (!parsedResults[0].start.isCertain('year')) {
      parsedDate.setFullYear(referenceDate.getFullYear());
    }
  }

  // Fallback range parsing (e.g. "to 11 am")
  let rangeMatch = null;
  if (!parsedEndDate && parsedDate) {
    const rangeRegex = /(?:to|-|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
    rangeMatch = stringForDateParsing.match(rangeRegex);
    if (rangeMatch) {
      const endStr = rangeMatch[1];
      const parsedEndTime = parseCustomTime(endStr);
      if (parsedEndTime) {
        parsedEndDate = new Date(parsedDate);
        parsedEndDate.setHours(parsedEndTime.hours, parsedEndTime.minutes, 0, 0);
        if (parsedEndDate.getTime() < parsedDate.getTime()) {
          parsedEndDate.setDate(parsedEndDate.getDate() + 1);
        }
      }
    }
  }

  // Range vs Duration ambiguity check (e.g., "9-5")
  let isRangeAmbiguous = false;
  const rangePattern = /\b(\d{1,2})\s*-\s*(\d{1,2})\b/i;
  const rangePatternMatch = stringForDateParsing.match(rangePattern);
  if (rangePatternMatch && !/am|pm/i.test(rangePatternMatch[0]) && parsedDate) {
    const startNum = parseInt(rangePatternMatch[1], 10);
    const endNum = parseInt(rangePatternMatch[2], 10);
    if (startNum >= 1 && startNum <= 12 && endNum >= 1 && endNum <= 12) {
      let startHour = startNum;
      if (startNum >= 7 && startNum < 12) {
        // AM
      } else if (startNum === 12) {
        // 12 PM
      } else {
        startHour += 12; // PM
      }
      
      let endHour = endNum;
      if (endNum < startNum || (startNum >= 7 && startNum <= 11 && endNum >= 1 && endNum <= 6)) {
        endHour += 12; // PM
      }
      
      const durationHours = endHour - startHour;
      if (durationHours > 6) {
        isRangeAmbiguous = true;
      }
      
      parsedDate.setHours(startHour, 0, 0, 0);
      parsedEndDate = new Date(parsedDate);
      parsedEndDate.setHours(endHour, 0, 0, 0);
    }
  }

  // Duration parsing (e.g. "for 2 hours")
  let durMatch = null;
  if (!parsedEndDate && parsedDate) {
    const durRegex = /(?:for|duration)\s*(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/i;
    durMatch = stringForDateParsing.match(durRegex);
    if (durMatch) {
      const val = parseFloat(durMatch[1]);
      const unit = durMatch[2].toLowerCase();
      const addMins = unit.startsWith('h') ? Math.round(val * 60) : Math.round(val);
      parsedEndDate = new Date(parsedDate.getTime() + addMins * 60 * 1000);
    }
  }

  // Location / Venue Extraction
  let location = null;
  let cleanForLocation = inputStr;
  if (parsedResults && parsedResults.length > 0) {
    cleanForLocation = cleanForLocation.replace(parsedResults[0].text, '');
  }
  if (rangeMatch) {
    cleanForLocation = cleanForLocation.replace(rangeMatch[0], '');
  }
  if (durMatch) {
    cleanForLocation = cleanForLocation.replace(durMatch[0], '');
  }
  
  const locRegex = /\b(?:at|in|room|venue|hall|lab\s*no|located|rm|vanue|venu|hal|loctaed|lcoated)\b\s+([a-z0-9]+(?:\s+[a-z0-9]+)?)/i;
  const locMatch = cleanForLocation.match(locRegex);
  if (locMatch) {
    location = locMatch[1].trim();
    location = location.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // Recurrence Parsing
  const recurrenceRule = parseRecurrence(inputStr, parsedDate);

  // Past-dated check
  let isPastDated = false;
  if (parsedDate) {
    const compareParsed = new Date(parsedDate);
    const compareNow = new Date();
    if (compareParsed < compareNow) {
      isPastDated = true;
    }
  }

  // Extract title
  let cleanTitle = inputStr;
  if (parsedResults && parsedResults.length > 0) {
    cleanTitle = cleanTitle.replace(parsedResults[0].text, '');
  }
  if (locMatch) {
    cleanTitle = cleanTitle.replace(locMatch[0], '');
  }
  if (rangeMatch) {
    cleanTitle = cleanTitle.replace(rangeMatch[0], '');
  }
  if (durMatch) {
    cleanTitle = cleanTitle.replace(durMatch[0], '');
  }
  if (courseMatch && courseMatch.matchedText) {
    cleanTitle = cleanTitle.replace(courseMatch.matchedText, '');
  }
  
  // Strip action keywords from title
  const actionRegex = new RegExp(`\\b(?:${KEYWORD_GROUPS.action.join('|')}|${KEYWORD_GROUPS.updateAction.join('|')}|${KEYWORD_GROUPS.deleteAction.join('|')})\\b`, 'gi');
  cleanTitle = cleanTitle.replace(actionRegex, '');

  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  
  if (cleanTitle.length > 0) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  } else {
    cleanTitle = "New Event";
  }

  return {
    title: cleanTitle,
    date: parsedDate,
    end_date: selectedType === 'deadline' ? null : parsedEndDate,
    hasTime: hasTime,
    type: selectedType,
    hasType: hasType,
    courseMatch: courseMatch || null,
    location,
    recurrenceRule,
    isTimeAmbiguous,
    isRangeAmbiguous,
    isPastDated
  };
}

export function parseNaturalLanguageEvent(inputStr, availableCourses, matchCourseFn) {
  const segments = splitMultiEvents(inputStr);
  
  let actionKeyword = null;
  const firstNormalized = normalizeText(segments[0]);
  if (matchKeywordGroup(firstNormalized, KEYWORD_GROUPS.action, true)) {
    actionKeyword = 'add';
  } else if (matchKeywordGroup(firstNormalized, KEYWORD_GROUPS.updateAction, true)) {
    actionKeyword = 'edit';
  } else if (matchKeywordGroup(firstNormalized, KEYWORD_GROUPS.deleteAction, true)) {
    actionKeyword = 'delete';
  }

  const parsedEvents = segments.map((segment, idx) => {
    let cleanSegment = segment;
    if (idx > 0 && actionKeyword) {
      const normSeg = normalizeText(cleanSegment);
      const hasActionOrIntent = 
        matchKeywordGroup(normSeg, KEYWORD_GROUPS.action, true) ||
        matchKeywordGroup(normSeg, KEYWORD_GROUPS.updateAction, true) ||
        matchKeywordGroup(normSeg, KEYWORD_GROUPS.deleteAction, true);
      
      if (!hasActionOrIntent) {
        cleanSegment = `${actionKeyword} ${cleanSegment}`;
      }
    }

    return parseSingleEvent(cleanSegment, availableCourses, matchCourseFn);
  });

  if (parsedEvents.length > 1) {
    return {
      isMultiEvent: true,
      events: parsedEvents
    };
  }
  return parsedEvents[0];
}

