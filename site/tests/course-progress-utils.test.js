import { describe, expect, it } from "vitest";
import {
  applyStatusCounts,
  extractCourseId,
  resolveCourseId
} from "../public/scripts/course-progress-utils.js";

describe("course progress utils", () => {
  it("extractCourseId handles slash and backslash separators", () => {
    expect(extractCourseId("course-1/book-01")).toBe("course-1");
    expect(extractCourseId("course-2\\book-01")).toBe("course-2");
    expect(extractCourseId("")).toBe("");
  });

  it("resolveCourseId prefers derived ids and falls back to map", () => {
    const courseMap = new Map([
      ["course-1", {}],
      ["course-2", {}]
    ]);
    const fallbackMap = new Map([["book-02", "course-2"]]);

    expect(resolveCourseId("course-1/book-99", courseMap)).toBe("course-1");
    expect(resolveCourseId("book-02", courseMap, fallbackMap)).toBe("course-2");
    expect(resolveCourseId("book-03", courseMap, fallbackMap)).toBe("");
  });

  it("applyStatusCounts uses fallback mapping for unmatched book ids", () => {
    const courses = [
      { id: "course-1", readCount: 0, inProgressCount: 0 },
      { id: "course-2", readCount: 0, inProgressCount: 0 }
    ];
    const courseMap = new Map(courses.map((course) => [course.id, course]));
    const statusRows = [
      { book_id: "course-1/book-01", status: "read" },
      { book_id: "book-02", status: "in_progress" },
      { book_id: "book-03", status: "read" }
    ];

    const pending = applyStatusCounts(courseMap, statusRows);
    expect(pending).toHaveLength(2);

    const fallbackMap = new Map([["book-02", "course-2"]]);
    const unresolved = applyStatusCounts(courseMap, pending, fallbackMap);
    expect(unresolved).toHaveLength(1);

    expect(courseMap.get("course-1").readCount).toBe(1);
    expect(courseMap.get("course-2").inProgressCount).toBe(1);
  });
});
