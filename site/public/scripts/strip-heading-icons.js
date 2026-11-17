const pictograph = /\p{Extended_Pictographic}|\uFE0F/gu;

export function stripHeadingIcons(root = document) {
  root.querySelectorAll(".guide-content :is(h1, h2, h3, h4, h5, h6)").forEach((heading) => {
    const walk = (node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const next = child.textContent.replace(pictograph, "");
          if (next !== child.textContent) child.textContent = next;
        } else {
          walk(child);
        }
      });
    };
    walk(heading);
  });
}

stripHeadingIcons();
