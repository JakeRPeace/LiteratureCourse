export function extractCourseId(bookId) {
  if (!bookId) return "";
  const [head] = String(bookId).split(/[\\/]/);
  return head || "";
}

export function resolveCourseId(bookId, courseMap, fallbackMap) {
  const derived = extractCourseId(bookId);
  if (derived && courseMap.has(derived)) return derived;
  if (!fallbackMap) return "";
  const fallback = fallbackMap.get(bookId);
  if (fallback && courseMap.has(fallback)) return fallback;
  return "";
}

export function applyStatusCounts(courseMap, statusRows, fallbackMap) {
  const unmatched = [];
  (statusRows || []).forEach((row) => {
    const courseId = resolveCourseId(row?.book_id, courseMap, fallbackMap);
    if (!courseId) {
      unmatched.push(row);
      return;
    }
    const entry = courseMap.get(courseId);
    if (!entry) {
      unmatched.push(row);
      return;
    }
    if (row.status === "read") entry.readCount += 1;
    if (row.status === "in_progress") entry.inProgressCount += 1;
  });
  return unmatched;
}
