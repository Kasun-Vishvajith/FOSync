import * as chrono from 'chrono-node';
import { EVENT_TYPES } from './constants';
import { normalizeText, isSimilar, KEYWORD_GROUPS } from './chatMatcher';

export function parseNaturalLanguageEvent(inputStr, availableCourses, matchCourseFn) {
  // 1. Determine Event Type FIRST to help cleaning
  const normalizedInput = normalizeText(inputStr);
  let selectedType = 'lecture'; // Default
  let earliestIndex = Infinity;

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
      }
    }
  }

  // Typo fallback if no exact matches found
  if (earliestIndex === Infinity) {
    const words = normalizedInput.split(' ');
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const w = words[wordIndex];
      for (const mapping of typeMapping) {
        for (const keyword of mapping.keywords) {
          if (isSimilar(w, keyword) && wordIndex < earliestIndex) {
            earliestIndex = wordIndex;
            selectedType = mapping.type;
          }
        }
      }
    }
  }

  // 2. Match Course
  const courseMatch = matchCourseFn(inputStr, availableCourses);

  // 3. Clean string for Chrono parsing (remove matched course string so it isn't parsed as a year)
  let stringForDateParsing = inputStr;
  if (courseMatch && courseMatch.matchedText) {
    stringForDateParsing = stringForDateParsing.replace(courseMatch.matchedText, '');
  }

  // 4. Parse dates using Chrono (use current date as reference)
  const referenceDate = new Date();
  const parsedResults = chrono.parse(stringForDateParsing, referenceDate);
  let parsedDate = null;
  let hasTime = false;
  
  if (parsedResults && parsedResults.length > 0) {
    parsedDate = parsedResults[0].start.date();
    hasTime = parsedResults[0].start.isCertain('hour');
    
    if (!hasTime) {
      parsedDate.setHours(9, 0, 0, 0); // Default to 9:00 AM if no time specified
    }
    
    // If the year was not explicitly stated in the input, enforce the current real-world year
    if (!parsedResults[0].start.isCertain('year')) {
      parsedDate.setFullYear(referenceDate.getFullYear());
    }
  }

  // 5. Extract a clean title (remove the date portion if possible)
  let cleanTitle = inputStr;
  if (parsedResults && parsedResults.length > 0) {
    const textToReplace = parsedResults[0].text;
    cleanTitle = cleanTitle.replace(textToReplace, '').replace(/\s+/g, ' ').trim();
  }
  
  // Capitalize first letter
  if (cleanTitle.length > 0) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  } else {
    cleanTitle = "New Event";
  }

  return {
    title: cleanTitle,
    date: parsedDate,
    hasTime: hasTime,
    type: selectedType,
    courseMatch: courseMatch || null,
  };
}
