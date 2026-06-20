/**
 * Deterministic course matching engine.
 * Tiers:
 * 1. Exact/Flexible Course ID Match (e.g. "DSC 321", "DSC-321", "dsc321")
 * 2. Exact Alias Match (min length >= 3)
 */

export function matchCourse(inputStr, availableCourses) {
  if (!inputStr || !availableCourses || availableCourses.length === 0) return null;

  // Tier 1: Exact / Flexible course ID match
  for (const course of availableCourses) {
    const courseId = course.course_id.toLowerCase();
    
    // Create a flexible regex that allows optional spaces or dashes between all characters
    const chars = courseId.replace(/[\s\-]/g, '').split('');
    if (chars.length > 0) {
      const regexParts = chars.map((char, index) => {
        const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return index < chars.length - 1 ? `${escaped}[\\s\\-]*` : escaped;
      });
      
      const flexibleRegex = new RegExp(`\\b(${regexParts.join('')})\\b`, 'i');
      const match = inputStr.match(flexibleRegex);
      
      if (match) {
        return { course, score: 100, matchType: 'exact_id', matchedText: match[0] };
      }
    }
  }

  // Tier 2: Exact Alias match (only allow if alias length >= 3)
  for (const course of availableCourses) {
    const aliases = (course.aliases || []).map(a => a.toLowerCase());
    for (const alias of aliases) {
      if (alias.length >= 3) {
        const safeAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${safeAlias}\\b`, 'i');
        const match = inputStr.match(regex);
        
        if (match) {
          return { course, score: 90, matchType: 'exact_alias', matchedText: match[0] };
        }
      }
    }
  }

  return null;
}
