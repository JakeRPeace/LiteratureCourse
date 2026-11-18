// How a book looks on the shelf when there is no cover art to lean on.
// One source for the server (Astro pages) and the browser (user-made courses),
// so the same title is always bound in the same cloth.

const CLOTHS = [
  { cloth: "#a84f34", deep: "#7d3a26", foil: "#fff7e6" }, // terracotta
  { cloth: "#8a9a78", deep: "#6c7b5c", foil: "#1e2618" }, // sage
  { cloth: "#d1a243", deep: "#a98030", foil: "#2a1d10" }, // ochre
  { cloth: "#2f4156", deep: "#202e3e", foil: "#f6eeda" }, // ink blue
  { cloth: "#efe4cc", deep: "#cdbf9f", foil: "#6a2620" }, // linen
  { cloth: "#5f6b3f", deep: "#47502e", foil: "#fbf4df" }, // olive
  { cloth: "#c98b76", deep: "#a36b58", foil: "#2a1710" }, // clay rose
  { cloth: "#36513f", deep: "#263a2d", foil: "#f6eeda" }, // forest
  { cloth: "#6a4257", deep: "#4c2e3e", foil: "#fbeede" }, // plum
  { cloth: "#7d97a8", deep: "#5f7786", foil: "#16222b" }, // dusty blue
  { cloth: "#3f3b37", deep: "#2a2724", foil: "#f1e7d2" }, // charcoal
  { cloth: "#8a5a3a", deep: "#684228", foil: "#fdf1d8" } // chestnut
];

function hash(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function surname(author = "") {
  const parts = String(author)
    .split(",")[0]
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

export function bookLook(title = "", author = "", avoidCloth = -1) {
  const h = hash(`${title}|${author}`);
  let clothIndex = h % CLOTHS.length;
  if (clothIndex === avoidCloth) clothIndex = (clothIndex + 5) % CLOTHS.length;
  const { cloth, deep, foil } = CLOTHS[clothIndex];
  // A spine is as thick as its title needs: about ten characters fit down
  // the spine, so longer titles wrap onto more lines and get a wider book.
  const lines = Math.min(4, Math.max(1, Math.ceil(String(title).length / 10)));
  const long = lines >= 3;
  const width = 24 + lines * (long ? 17 : 19) + ((h >>> 5) % 7);
  const height = 82 + ((h >>> 11) % 15);
  const band = (h >>> 17) % 4;
  return {
    clothIndex,
    long,
    band,
    style: `--cloth:${cloth};--cloth-deep:${deep};--foil:${foil};--w:${width}px;--h:${height}%`
  };
}

// Looks for a run of books, nudging neighbours apart so two volumes in the
// same cloth never sit side by side.
export function shelfLooks(books = []) {
  let previous = -1;
  return books.map((book) => {
    const look = bookLook(book?.title, book?.author, previous);
    previous = look.clothIndex;
    return look;
  });
}
