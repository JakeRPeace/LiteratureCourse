import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span"
]);

const allowedAttributes = {
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title"],
  code: ["class"],
  span: ["class"],
  p: ["class"],
  li: ["class"],
  ul: ["class"],
  ol: ["class"]
};

const allowedSchemes = ["http", "https", "mailto"];

function stripFrontmatter(contents) {
  if (!contents.startsWith("---\n")) return contents;
  const end = contents.indexOf("\n---\n", 4);
  if (end === -1) return contents;
  return contents.slice(end + 5);
}

export function renderMarkdownSafe(markdown = "") {
  const html = marked.parse(stripFrontmatter(markdown || ""));
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedSchemes,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" })
    }
  });
}
