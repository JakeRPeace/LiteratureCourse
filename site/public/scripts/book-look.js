// How a book looks on the shelf when there is no cover art to lean on.
// One source for the server (Astro pages) and the browser (user-made courses),
// so the same title is always bound in the same cloth.

const CLOTHS = [
  { cloth: "#6f2a25", deep: "#4c1b17", foil: "#ecd49a" }, // oxblood
  { cloth: "#2f4a3b", deep: "#1e3227", foil: "#ecd49a" }, // bottle green
  { cloth: "#27384f", deep: "#172436", foil: "#ecd49a" }, // navy
  { cloth: "#c2953c", deep: "#987226", foil: "#2a1d10" }, // mustard
  { cloth: "#e4d8bd", deep: "#c4b594", foil: "#6a2620" }, // linen
  { cloth: "#3b3733", deep: "#24211e", foil: "#eadfc8" }, // charcoal
  { cloth: "#2a5558", deep: "#1a3c3f", foil: "#f1e6cf" }, // teal
  { cloth: "#55324b", deep: "#392032", foil: "#ecd49a" }, // plum
  { cloth: "#974a31", deep: "#733522", foil: "#fbf1dc" }, // terracotta
  { cloth: "#84926f", deep: "#657353", foil: "#1c2617" }, // sage
  { cloth: "#4c6481", deep: "#384c64", foil: "#f6eeda" }, // slate blue
  { cloth: "#79532f", deep: "#593b1f", foil: "#f3dfae" } // saddle tan
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
