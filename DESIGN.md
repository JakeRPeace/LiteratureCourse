---
name: Literature Course Library
description: A private shelf for a structured reading canon.
colors:
  wall: "#faf5ec"
  paper: "#f4efe4"
  paper-raised: "#fbf7ef"
  ink: "#241e16"
  ink-soft: "#5c5146"
  card-stock: "#fffaf0"
  shelf: "#2c4437"
  timber: "#ecd9b8"
  case-back: "#f3ebdc"
  oak: "#d9b98b"
  shelf-ink: "#f4efe4"
  shelf-muted: "#d9d0c0"
  vermilion: "#9d3428"
  vermilion-wash: "#f6e4df"
  moss: "#2c5c40"
  moss-wash: "#e5efe8"
  brass: "#8d6a32"
  brass-wash: "#f3e6cc"
  line: "rgba(36, 30, 22, 0.14)"
  line-soft: "rgba(36, 30, 22, 0.1)"
  line-strong: "rgba(36, 30, 22, 0.28)"
  progress-paper: "#fbf3ea"
  cover-board: "#e7dcc8"
  cover-leaf: "#efe4d0"
  selection: "#e4d2a4"
  code-paper: "#efe6d4"
  score-idle: "#cfc4b2"
  score-track: "#e4d9c6"
  idle-clay: "#b7ab9a"
typography:
  display:
    fontFamily: "Spectral, \"Iowan Old Style\", \"Palatino Linotype\", Palatino, serif"
    fontSize: "clamp(2.6rem, 6vw, 4.6rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Spectral, \"Iowan Old Style\", \"Palatino Linotype\", Palatino, serif"
    fontSize: "clamp(1.7rem, 3vw, 2.15rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Spectral, \"Iowan Old Style\", \"Palatino Linotype\", Palatino, serif"
    fontSize: "1.35rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Karla, \"Avenir Next\", \"Segoe UI\", sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  reading:
    fontFamily: "Spectral, \"Iowan Old Style\", \"Palatino Linotype\", Palatino, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Karla, \"Avenir Next\", \"Segoe UI\", sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  stamp: "2px"
  leaf: "3px"
  cover: "4px"
  control: "6px"
  surface: "8px"
  dialog: "12px"
spacing:
  tight: "6px"
  row: "12px"
  inline: "16px"
  mast: "18px"
  card: "22px"
  gutter: "24px"
  section: "36px"
  page-end: "72px"
components:
  button-primary:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  text-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  raised-sheet:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "22px"
  shelf-row:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px 18px"
  shelf-row-progress:
    backgroundColor: "{colors.progress-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px 18px"
  shelf-row-read:
    backgroundColor: "{colors.moss-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px 18px"
  status-stamp:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.stamp}"
    padding: "4px 8px"
  status-stamp-progress:
    backgroundColor: "{colors.vermilion-wash}"
    textColor: "{colors.vermilion}"
    rounded: "{rounded.stamp}"
    padding: "4px 8px"
  status-stamp-read:
    backgroundColor: "{colors.moss-wash}"
    textColor: "{colors.moss}"
    rounded: "{rounded.stamp}"
    padding: "4px 8px"
  mast:
    backgroundColor: "{colors.shelf}"
    textColor: "{colors.shelf-ink}"
    padding: "18px 24px"
  course-status:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
  guide-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "18px 0"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "20px"
---

# Design System: Literature Course Library

## Overview

**Creative North Star: "The Shop on the Corner"**

The Literature Course Library is a light, lived-in independent bookshop that happens to hold one canon: warm white walls, pale oak shelves, books in plain cloth colours, paper cards. Think Rough Draft in Kingston or McNally Jackson in SoHo. The shop is represented, not rendered. Wood is a flat warm colour, paper is a flat off-white, and depth is a soft shadow. There is no wood grain, no noise, no bevels, and no brass hardware.

**The rule that organizes everything: picking a book takes it off the shelf.** A book is one object that is either standing on a shelf (spine out), facing out on a ledge, or lying on a table. Opening a book moves it from one to the other, and the place it left stays empty.

**Key Characteristics**

- Warm white wall, a flat green sign band, pale oak boards, off-white paper cards
- Spectral for names, titles, and reading; Karla for furniture (labels, buttons, stamps)
- Every book is bound in a flat cloth colour chosen from its title, whether or not cover art exists
- Vermilion marks the place, moss marks a finished book, brass is focus and small labels
- Flat colour and soft shadow only. No textures, no glass, no dark theme

## The Book Object

`site/public/scripts/book-look.js` is the single source for how a book looks. It hashes title and author into one of twelve cloths (cloth, a deeper edge, and a title ink that holds 4.5:1 on that cloth), a spine height, and a spine width that grows with the title so the title always fits. Neighbours on a shelf never share a cloth. The server (`Spine.astro`, `BookCover.astro`) and the browser (`book-dom.js`, for reader-made courses) both call it, so a title is bound the same way everywhere.

- **Spine** (`.spine`): vertical Spectral title, surname in small Karla caps, thin rules at head and tail, flat colour. Stands in a slot of fixed row height.
- **Cover** (`.book-cover`): 2:3 board with a hinge line, one page edge, and a thin frame. Cover art, when present, sits on top of the cloth cover and is removed if it fails to load, so there is never an empty cover.

## Picking a Book

- **Hover or focus** a spine: it rises 12px out of the row, and a paper tag names it in full (title, author, status).
- **Click**: the book leaves the shelf. In browsers with cross-document view transitions the spine or cover itself travels to the table on the book page while its slot stays empty. Elsewhere the book tips, lifts out, and fades over about 0.4s before the page changes (`shelf.js`).
- **On the book page** the book lies on a timber table. Below, "The shelf it came from" shows the rest of the course with a gap and a slip where this book lives.
- **"Put it back on the shelf"** returns to the course with the book as the link target, so it travels back and settles into its place.
- **In progress means out.** A book marked In progress is on the reader's table: on the home bookcase its slot holds a vermilion-topped "Out" slip (still a link), and the book appears face-up on "On your reading table". Marking it Read puts it back with a moss sticker on the spine.
- With reduced motion, none of this animates; links simply navigate.

## Colors

- **Wall** (#faf5ec): the page. **Paper** (#fffdf8) and **Card Stock** (#fffaf0): cards and the reading sheet.
- **Iron Ink** (#241e16) and **Soft Iron** (#5c5146): text.
- **Shop Green** (#2c4437): the header and colophon, flat, with wall-white lettering.
- **Oak** (#d9b98b, light edge #e8d1aa): shelf boards and ledges. **Timber** (#ecd9b8): the reading table, the book table, and the counter. **Shelf Back** (#f3ebdc): the tint behind a row of spines.
- **Vermilion** (#9d3428): the place-mark. Primary button, links, ribbons, the Out slip, progress fill.
- **Reading Moss** (#2c5c40): a finished book or course.
- **Brass** (#7d6030): focus ring, eyebrows, course numbers.
- **Cloths**: twelve earthy book colours (terracotta, sage, ochre, ink blue, linen, olive, clay rose, forest, plum, dusty blue, charcoal, chestnut), each with a title ink that holds 4.5:1.

**The Place-Mark Rule.** Vermilion is where the reader is. It is never a page or card fill.

## Typography

Spectral (400, 400 italic, 600, 700) is the voice of the shop and the books. Karla (400, 500, 700) is the voice of the furniture. They do not trade jobs.

- **Display**: Spectral 600, clamp(2.6rem, 6vw, 4.4rem), tracking -0.03em. Page titles are clamp(2.1rem, 4.6vw, 3.2rem).
- **Section title**: Spectral 600, clamp(1.5rem, 2.6vw, 1.9rem).
- **Reading**: Spectral 400, 1.125rem, line-height 1.7, 68ch measure.
- **Eyebrow and stamp**: Karla 700, 11.5 to 12px, uppercase, tracking 0.08 to 0.14em.
- **Body and controls**: Karla, 15 to 16px.

## Surfaces

- **Header and colophon**: flat shop green, serif wordmark. The header is sticky. Course and book menus are outlined pills on the green.
- **Shelves** (home): one open oak shelf per course on the wall. Above it sit the course number, name (links to the course), one-line summary, count, and status. Books stand spine out on a pale shelf back. A small card at the end of each shelf opens the course. On phones each shelf is a single row that scrolls sideways.
- **Reading table** (home): a timber panel holding the books in progress, face up.
- **Ledges** (course): books face out on oak ledges in reading order, with title, author, and status below each. In progress shows a ribbon; read shows a moss seal.
- **Cards**: "Your place in this course", the Reader's card (status and score), the Library card (sign in), course materials, and the three numbered study guides are plain paper cards with a hairline border and a soft shadow.
- **Reading sheet**: a guide is one paper card with the prose at a 68ch measure.

Rows of spines and rows of covers have a fixed height, so shelf boards and ledges are drawn once as a repeating background and always land under each row when the layout wraps.

## Elevation and Motion

- Two shadows: a resting shadow and a lift shadow. Timber panels add a solid lower edge in oak. Books cast a soft offset shadow and show one page edge.
- Spines are flat colour with a one-pixel edge so neighbours separate. Covers are flat colour with a single hinge line and a thin frame.
- Buttons are flat pills: vermilion for the primary action, outlined for the rest.
- One curve, `cubic-bezier(0.16, 1, 0.3, 1)`. Hover lifts take 0.35s, the pick takes about 0.5s.
- Under `prefers-reduced-motion`, transitions and transforms are dropped.

## Do's and Don'ts

**Do**

- Keep every book the same object in all three positions: spine, cover, desk.
- Leave the gap. If a book is open or in progress, its slot stays empty.
- Keep body text at or above 4.5:1, and keep the brass focus ring visible on every control.
- Let the shop stop at the reading sheet. A guide is paper and type.

**Don't**

- Don't add props that do nothing (plants, mugs, cats). Every object on the page is a control or content.
- Don't draw materials literally: no wood grain, noise, bevels, engraved plates, or stitched edges.
- Don't use glass, backdrop blur, neon, or a dark theme.
- Don't fill surfaces with vermilion, and don't set buttons or stamps in Spectral.
- Don't replace the stamp or the progress rule with rings, sparklines, or scores on the shelf.
