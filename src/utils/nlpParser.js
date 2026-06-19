import * as chrono from 'chrono-node';
import { EVENT_TYPES } from './constants';

export function parseNaturalLanguageEvent(inputStr, availableCourses, matchCourseFn) {
  // 1. Parse dates using Chrono
  const parsedResults = chrono.parse(inputStr);
  let parsedDate = null;
  
  if (parsedResults && parsedResults.length > 0) {
    // We take the first matched date entity
    parsedDate = parsedResults[0].start.date();
  } else {
    // If no date found, default to tomorrow at 8 AM as a fallback/example
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    parsedDate = tomorrow;
  }

  // 2. Determine Event Type
  const lowerInput = inputStr.toLowerCase();
  let selectedType = EVENT_TYPES[0].value; // Default to first type (usually 'lecture')

  if (lowerInput.includes('exam') || lowerInput.includes('test') || lowerInput.includes('quiz')) {
    selectedType = 'exam';
  } else if (lowerInput.includes('deadline') || lowerInput.includes('due') || lowerInput.includes('assignment')) {
    selectedType = 'deadline';
  } else if (lowerInput.includes('lecture') || lowerInput.includes('class')) {
    selectedType = 'lecture';
  }

  // 3. Match Course
  const courseMatch = matchCourseFn(inputStr, availableCourses);

  // 4. Extract a clean title (remove the date portion if possible)
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
    type: selectedType,
    courseMatch: courseMatch || null,
  };
}
