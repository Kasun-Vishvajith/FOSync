/**
 * Deterministic course matching engine.
 * Tiers:
 * 1. Exact Match (course_id)
 * 2. Alias Match (exact)
 */

export function matchCourse(inputStr, availableCourses) {
  if (!inputStr || !availableCourses || availableCourses.length === 0) return null;

  // We use regex word boundaries for strict matching
  
  // Tier 1: Exact course ID match (e.g., "DSC 321" or "DSC321")
  for (const course of availableCourses) {
    const courseId = course.course_id.toLowerCase();
    
    // Try both with and without space (e.g. DSC 321 and DSC321)
    const noSpaceId = courseId.replace(/\s+/g, '');
    
    // Create regex that matches either format at word boundaries
    const regex = new RegExp(`\\b(${courseId}|${noSpaceId})\\b`, 'i');
    
    if (regex.test(inputStr)) {
      return { course, score: 100, matchType: 'exact_id' };
    }
  }

  // Tier 2: Exact Alias match
  for (const course of availableCourses) {
    const aliases = (course.aliases || []).map(a => a.toLowerCase());
    for (const alias of aliases) {
      if (alias.length > 2) {
        // Create regex that matches alias at word boundaries
        // Escape special chars in alias if any exist
        const safeAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${safeAlias}\\b`, 'i');
        
        if (regex.test(inputStr)) {
          return { course, score: 90, matchType: 'exact_alias' };
        }
      }
    }
  }

  return null;
}
