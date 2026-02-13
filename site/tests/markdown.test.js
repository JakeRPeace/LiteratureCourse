import { describe, expect, it } from "vitest";
import { renderMarkdownSafe } from "../src/lib/markdown.js";

describe("renderMarkdownSafe", () => {
  it("strips scripts and unsafe urls", () => {
    const input = `Hello <script>alert(1)</script> [x](javascript:alert(1)) <img src="javascript:alert(1)">`;
    const html = renderMarkdownSafe(input);

    expect(html).toContain("Hello");
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/javascript:/i);
  });

  it("keeps basic markdown structure", () => {
    const input = "# Title\n\nA **bold** line and a [link](https://example.com).";
    const html = renderMarkdownSafe(input);

    expect(html).toMatch(/<h1[^>]*>Title<\/h1>/i);
    expect(html).toMatch(/<strong>bold<\/strong>/i);
    expect(html).toMatch(/<a[^>]+href=\"https:\/\/example.com\"/i);
  });
});
