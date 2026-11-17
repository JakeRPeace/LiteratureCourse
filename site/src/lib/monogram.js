const SKIPPED = new Set(["a", "an", "the"]);

export function monogram(title = "", author = "") {
  const surname = String(author)
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .at(-1);
  const source =
    surname ||
    String(title)
      .split(/\s+/)
      .find((word) => word && !SKIPPED.has(word.toLowerCase())) ||
    title;
  const letter = String(source).trim().charAt(0);
  return letter ? letter.toUpperCase() : "";
}
