// How a book looks on the shelf when there is no cover art to lean on.
// One source for the server (Astro pages) and the browser (user-made courses),
// so the same title is always bound in the same cloth.

// A grown-up shelf: mostly cream, black, navy, oxblood, green, grey-blue and
// kraft, with a few brighter cloths now and then. `weight` is how often a
// cloth turns up; every `foil` holds at least 4.5:1 on its cloth.
const CLOTHS = [
  { cloth: "#ece3cf", deep: "#c9bc9c", foil: "#33261c", weight: 6 }, // cream
  { cloth: "#f2ede0", deep: "#d3cab4", foil: "#5e2622", weight: 3 }, // ivory
  { cloth: "#25231f", deep: "#14130f", foil: "#e9dec3", weight: 6 }, // black
  { cloth: "#3c3e40", deep: "#27292b", foil: "#ece5d4", weight: 4 }, // charcoal
  { cloth: "#27364b", deep: "#182335", foil: "#efe7d2", weight: 6 }, // navy
  { cloth: "#6b2b2b", deep: "#4a1c1e", foil: "#f3e6ce", weight: 5 }, // oxblood
  { cloth: "#2f4a3b", deep: "#203429", foil: "#eee6cf", weight: 5 }, // deep green
  { cloth: "#8498a8", deep: "#667a8a", foil: "#111c25", weight: 4 }, // grey-blue
  { cloth: "#b99c74", deep: "#957a52", foil: "#241a0e", weight: 5 }, // kraft
  { cloth: "#a7a59d", deep: "#85837b", foil: "#1b1a17", weight: 2 }, // stone
  { cloth: "#cf9f3c", deep: "#a67e28", foil: "#2a1d10", weight: 1 }, // mustard
  { cloth: "#a84f34", deep: "#7d3a26", foil: "#fff7e6", weight: 1 }, // terracotta
  { cloth: "#2f6a68", deep: "#204b4a", foil: "#f4ecd8", weight: 1 }, // teal
  { cloth: "#c68a7c", deep: "#a06b5d", foil: "#2a1710", weight: 1 } // dusty rose
];
const CLOTH_WEIGHT = CLOTHS.reduce((sum, c) => sum + c.weight, 0);

function pickCloth(n) {
  let r = n % CLOTH_WEIGHT;
  for (let i = 0; i < CLOTHS.length; i += 1) {
    if (r < CLOTHS[i].weight) return i;
    r -= CLOTHS[i].weight;
  }
  return 0;
}

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
  let clothIndex = pickCloth(hash(`${author}|${title}|cloth`));
  // Two volumes in the same cloth never sit side by side.
  if (clothIndex === avoidCloth) clothIndex = (clothIndex + 1 + (h % 4)) % CLOTHS.length;
  const { cloth, deep, foil } = CLOTHS[clothIndex];

  // Bindings are weighted so most books are plain, as on a real shelf:
  // 0 stamped rules, 1 title label, 2 two-tone, 3 paperback, 4 raised bands, 5 plain.
  const b = (h >>> 17) % 20;
  const band = b < 4 ? 0 : b < 6 ? 1 : b < 8 ? 2 : b < 10 ? 3 : b < 13 ? 4 : 5;
  // Lettering: mostly roman, some italic; spaced capitals only on short titles.
  const short = String(title).length <= 9;
  const t = (h >>> 23) % 10;
  const type = t < 6 ? 0 : t < 8 || !short ? 1 : 2;

  // A spine is as thick as its title needs: about seventeen characters fit
  // down it, so longer titles wrap onto more lines and get a wider book.
  const lines = Math.min(4, Math.max(1, Math.ceil(String(title).length / 17)));
  const long = lines >= 3;
  const width = 17 + lines * 14 + (band === 1 ? 9 : 0) + ((h >>> 5) % 7);
  const height = 80 + ((h >>> 11) % 17);
  // How far forward it sits: most flush, a few set back a touch.
  const back = (h >>> 3) % 8;
  const depth = back < 5 ? 0 : back < 7 ? 0.5 : 1;
  return {
    clothIndex,
    long,
    band,
    type,
    lean: 0,
    gap: false,
    style: `--cloth:${cloth};--cloth-deep:${deep};--foil:${foil};--w:${width}px;--h:${height}%;--d:${depth}`
  };
}

// Which book of a course stands face-out on its shelf. Stable for a course.
export function faceOutIndex(books = [], seed = "") {
  if (books.length < 4) return -1;
  return hash(`${seed}|${books.map((b) => b?.title).join("|")}|face`) % books.length;
}

// Looks for a run of books, nudging neighbours apart so two volumes in the
// same cloth never sit side by side. With `scatter`, the run also gets one
// gently leaning book and, on some shelves, a small gap, from a hash of the
// titles so the shelf is the same on every render.
export function shelfLooks(books = [], { scatter = false } = {}) {
  let previous = -1;
  const looks = books.map((book) => {
    const look = bookLook(book?.title, book?.author, previous);
    previous = look.clothIndex;
    return look;
  });
  const n = looks.length;
  if (scatter && n >= 5) {
    const seed = hash(`${books.map((b) => b?.title).join("|")}|scatter`);
    const leaning = 2 + (seed % (n - 3));
    if (seed % 5 !== 0) {
      const angle = 3 + ((seed >>> 4) % 3) * 0.7;
      looks[leaning].lean = (seed >>> 9) % 2 ? 1 : -1;
      looks[leaning].style += `;--lean:${looks[leaning].lean * angle}deg`;
    }
    if (n >= 6 && (seed >>> 12) % 3 !== 0) {
      let gapAt = 2 + ((seed >>> 14) % (n - 2));
      if (gapAt === leaning) gapAt = gapAt + 1 < n ? gapAt + 1 : gapAt - 1;
      if (gapAt !== leaning && Math.abs(gapAt - leaning) > 0) looks[gapAt].gap = true;
    }
  }
  return looks;
}
