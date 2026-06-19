/**
 * Deterministic course matching engine.
 * Tiers:
 * 1. Exact Match (course_id)
 * 2. Alias Match (exact)
 * 3. Substring/Keyword Match (course title/alias includes term)
 */

export function matchCourse(inputStr, availableCourses) {
  if (!inputStr || !availableCourses || availableCourses.length === 0) return null;

  const normalizedInput = inputStr.toLowerCase().trim();
  const words = normalizedInput.split(/\s+/);

  let bestMatch = null;
  let highestScore = 0;

  for (const course of availableCourses) {
    const courseId = course.course_id.toLowerCase();
    const aliases = (course.aliases || []).map(a => a.toLowerCase());

    // Tier 1: Exact course ID match (e.g., "DSC 321")
    if (normalizedInput.includes(courseId)) {
      return { course, score: 100, matchType: 'exact_id' };
    }

    // Tier 2: Exact Alias match
    for (const alias of aliases) {
      if (normalizedInput.includes(alias)) {
        return { course, score: 90, matchType: 'exact_alias' };
      }
    }

    // Tier 3: Keyword/Substring match
    let keywordScore = 0;
    for (const word of words) {
      if (word.length > 2) {
        if (courseId.includes(word)) keywordScore += 10;
        for (const alias of aliases) {
          if (alias.includes(word)) keywordScore += 5;
        }
      }
    }

    if (keywordScore > highestScore) {
      highestScore = keywordScore;
      bestMatch = { course, score: keywordScore, matchType: 'keyword' };
    }
  }

  // Only return if we have a reasonable confidence
  if (highestScore > 0) {
    return bestMatch;
  }

  return null;
}
