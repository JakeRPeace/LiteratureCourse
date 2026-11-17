---
name: Literature Course Library
description: A private shelf for a structured reading canon.
colors:
  paper: "#f4efe4"
  paper-raised: "#fbf7ef"
  ink: "#241e16"
  ink-soft: "#5c5146"
  shelf: "#24352f"
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

**Creative North Star: "The Private Ledger"**

The Literature Course Library is a private ledger of one real canon. The page should feel like a warm reading room, the independent-bookstore shelf a reader walks back into. Density is a column of books on bone paper, not a grid of metrics. A library-green band carries the name across the top and the colophon across the bottom. Iron ink does the reading. Vermilion marks the place.

Spectral carries the library's name, the titles, and the guide. Karla carries navigation, buttons, fields, stamps, and metadata. Course and book rows sit on a wood shelf tray: raised paper leaves over warm oak, with a lip under the stack. Covers carry a page-edge thickness. Hover or focus lifts a leaf, opens the cover fan, and draws one vermilion rule under the title. Selecting a row pulls the volume forward and turns it toward the reader before the next page opens. A guide then sits in a 68ch Spectral measure on the bare paper. Status stays a steady stamp: not started, in progress, or read. A score, when it exists, stays on that book's own sheet.

Color is flat. There is no glass and no second theme. Depth is a soft ink shadow under a raised sheet, a stronger lift when the row is active, and a warmer shadow under a cover because the cover is an object on the shelf. The shelf refuses the dark glass dashboard and the floating pill.

**Key Characteristics:**

- Bone paper page, full-bleed library green on the header and colophon, iron ink for text
- Spectral for the name, titles, and reading; Karla for chrome
- Vermilion for the place-mark and the primary button; brass for focus; moss when a book is read
- Paper grain, a wood shelf tray under the rows, cover thickness, the cover fan, and a pull-and-turn on select
- Status as a steady uppercase stamp
- Guides set in a 68ch Spectral measure on the bare paper

## Colors

Bone paper, library green, and iron ink form the room. Vermilion, brass, and moss are the only chromatic marks, and each one has a job.

### Primary

- **Vermilion** (#9d3428): The place-mark. It fills the progress rule, the primary button, and its border. It colors the back link, links inside a guide, guide actions, error text, and the single rule drawn under a hovered course title. Its wash (#f6e4df) is the ground of the in-progress stamp.

### Secondary

- **Library Green** (#24352f): The full-bleed header and the colophon. The browser theme color matches it. Text on this band is shelf bone (#f4efe4), the same bone as the page, and quiet links are shelf dust (#d9d0c0). Scrollbar thumb is this green against the paper.

### Tertiary

- **Brass** (#8d6a32): Focus, and only focus, plus the active row in a course or book menu. The focus ring is a 2px brass outline, 3px outside the control. The menu's active item and a reader's own chat line sit on brass wash (#f3e6cc). Selection is a deeper brass paper (#e4d2a4).
- **Reading Moss** (#2c5c40): A finished book or course. The read stamp uses moss on moss wash (#e5efe8), the finished row and course sheet use that wash, and a finished course's progress rule switches from vermilion to moss.

### Neutral

- **Bone Paper** (#f4efe4): The page, the field fill, and the dialog.
- **Raised Paper** (#fbf7ef): Cards, course rows at rest, menus, the account sheet, and the course status sheet.
- **Progress Paper** (#fbf3ea): The course row and the course status sheet while reading is in progress.
- **Iron Ink** (#241e16): Text, the scrim, and every hairline. Soft iron (#5c5146) is the lede, the summary, the placeholder, and secondary metadata.
- **Iron Line** (rgba(36, 30, 22, 0.14)): The hairline on sheets, rows, and dividers. The strong line (rgba(36, 30, 22, 0.28)) strokes fields and secondary buttons. The soft line (rgba(36, 30, 22, 0.1)) is the course progress track. The home progress track is iron at 12% opacity.
- **Cover Board** (#e7dcc8): The empty cover. Fan leaves are a lighter board (#efe4d0).
- **Code Paper** (#efe6d4): Inline code and code blocks inside a guide.
- **Idle Clay** (#b7ab9a): The status dot before a book is started.
- **Score Idle** (#cfc4b2): The score thumb and the score figure before a score is set. The score track is (#e4d9c6). A set score recolors the thumb with the palette already named: vermilion under 2.5, brass under 4, moss from 4 to 5.

### Named Rules

**The Place-Mark Rule.** Vermilion is the place: the progress fill, the primary button, reading links, the back link, and the single rule under a hovered title. It is not a page fill or a card fill.

**The Stamp Palette Rule.** Not started is quiet iron on transparent paper. In progress is vermilion on its wash, and the row or course sheet turns to progress paper. Read is moss on its wash, and a finished course rule turns moss.

## Typography

**Display and reading:** Spectral, with Iowan Old Style, Palatino Linotype, and Palatino behind it. Weights in use are 400, 400 italic, 600, and 700.

**Chrome:** Karla, with Avenir Next and Segoe UI behind it. Weights in use are 400, 500, and 700.

**Character:** Spectral is the voice of the shelf and the guide. Karla is the voice of the furniture. They do not trade jobs. Guide blockquotes are Spectral italic. Code inside a guide is ui-monospace.

### Hierarchy

- **Display** (600, clamp(2.6rem, 6vw, 4.6rem), line-height 0.95, tracking -0.03em): The shelf title on the home page. The sign-in title uses the same face and weight, tightened to clamp(2.4rem, 5vw, 3.8rem) and line-height 0.98. Headings wrap balanced.
- **Headline** (600, clamp(1.7rem, 3vw, 2.15rem), line-height 1.15, tracking -0.02em): Section titles such as the course list.
- **Title** (600, 1.35rem, line-height 1.2, tracking -0.02em): Sheet titles, guide links, and account titles. A course-row title is 1.2rem at the same weight and tracking. The course status title is 1.5rem. The wordmark is 1.25rem, tracking -0.03em, line-height 1.15, and 1.15rem below 800px. Inside a guide, the steps are 2rem, 1.55rem, and 1.25rem, all Spectral 600 with tracking -0.02em and line-height 1.2.
- **Body** (400, 16px, line-height 1.5): Karla, the page default. The home lede is 1.125rem soft iron inside 38ch. Summaries under rows are 14px. Sheet excerpts are 15px.
- **Reading** (400, 1.125rem, line-height 1.7): Spectral prose for the guide and the book introduction, ink on paper, max width 68ch, centered as a column with no sheet behind it.
- **Label** (500, 15px, line-height 1.5): Navigation on the green band. Buttons are the same size at weight 700. The status stamp is 12px, weight 700, tracking 0.06em, uppercase. Counts use tabular numerals.

### Named Rules

**The Two Voices Rule.** Spectral carries the library's name, titles, and the guide. Karla carries navigation, buttons, fields, stamps, and metadata. Do not swap them.

**The Reading Measure Rule.** A guide is Spectral at 1.125rem, line-height 1.7, inside 68ch, on the paper with no card behind the prose.

## Layout

The header and the colophon are full-bleed library green. Everything a reader studies sits in a column of 1120px. Page padding is 36px on the top, 24px on the sides, and 72px at the bottom. Below 800px the page becomes 24px, 16px, and 56px, and the header padding becomes 14px by 16px.

The home introduction is two columns, 1.3fr beside minmax(240px, 0.8fr), aligned at the end, with a 36px gap. One progress line is visible until signed-in counts exist; two further lines are in the markup, hidden. The column stacks at 800px. A book page sets a cover of 160px to 220px beside the title, and that pair stacks at the same breakpoint, with the cover capped at 220px. The sign-in page hides the header and the colophon, centers a two-column introduction beside the account sheet, and stacks at 800px.

Course rows are a single column with a 12px gap. The stack of sections uses 22px. A guide list and the reading column stop at 68ch. Course documents, when they are a set of sheets rather than a guide, wrap at minmax(240px, 1fr) with a 16px gap. The course status sheet is the only block that tightens again at 720px, to 16px padding and a 16px gap.

**The Full-Bleed Band Rule.** Library green runs edge to edge in the header and the colophon. The column stops at 1120px, with 24px gutters that become 16px below 800px.

## Elevation & Depth

The system is flat color. Depth is tonal paper plus a soft ink shadow. A raised sheet, a course row, and the course status sheet rest on `0 8px 16px rgba(36, 30, 22, 0.04)`. Hover and focus, an open menu, the dialog, and the toast use the lift shadow, `0 18px 32px rgba(36, 30, 22, 0.12)`. A row and a linked sheet rise 3px. A button rises 1px into `0 8px 16px rgba(36, 30, 22, 0.12)`.

Covers are objects, so their shadow is offset as well as blurred. A small cover uses `3px 6px 12px rgba(36, 30, 22, 0.16)`. A fan leaf uses `2px 4px 8px rgba(36, 30, 22, 0.18)`. The book-page cover uses `8px 16px 28px rgba(36, 30, 22, 0.18)`. The score thumb uses `0 4px 8px rgba(36, 30, 22, 0.2)`. The dialog scrim is iron ink at 46% opacity, `rgba(36, 30, 22, 0.46)`.

Motion sits on one curve, `cubic-bezier(0.16, 1, 0.3, 1)`, with a shelf slide `cubic-bezier(0.3, 0.7, 0.4, 1)` and a cover turn `cubic-bezier(0.22, 1, 0.36, 1)`. Rows and linked sheets take 0.35s. The cover fan and the vermilion title rule take 0.45s. Selecting a shelf row pulls the cover for about 0.46s, then navigates. Buttons take 0.25s. The course progress fill takes 0.6s. The book-page cover settles in 0.7s.

### Named Rules

**The Soft Lift Rule.** Raised sheets rest on a faint ink shadow. Hover and focus lift a row 3px into the stronger shadow. Covers keep their own object shadow. There is no zero-blur hard shadow and no glass blur.

**The Stillness Rule.** When the reader prefers reduced motion, transitions collapse and the row, the linked sheet, and the button do not move.

## Shapes

Corners are small and they name the object. A status stamp and a source tag, when a source tag is shown, are 2px. Fan leaves are 3px. Covers and inline code are 4px. Buttons, fields, and menu rows are 6px. Sheets, rows, menus, and code blocks use the 8px surface radius. The course-creator dialog is the one 12px corner. Progress rules are square-ended: 3px tall on the home shelf, 4px tall on the course sheet. A status dot is an 8px circle. A score track is 6px tall with a 24px round thumb, because it is a slider.

The course row is the signature silhouette: a 58px by 84px fan on the left, title and summary in the middle, count and stamp on the right. At rest the leaves sit at -11deg, -5deg, and 0. Dividers and guide rows are a 1px iron line, not a box. A guide blockquote is a 1px vermilion rule on the left, with 1rem of inset.

**The Corner Scale Rule.** Stamps are 2px, fan leaves are 3px, covers are 4px, controls are 6px, sheets are 8px, and the dialog is 12px. Progress rules are square-ended.

## Components

### Buttons

The primary button is the place-mark made clickable. Sign-in, send, and create use it. Sign-up, guest, and the dialog's quiet actions are the secondary button.

- **Shape:** A 6px corner. Padding 10px by 14px. Karla at 15px, weight 700. A 1px border.
- **Primary:** Vermilion fill, vermilion border, bone paper text.
- **Hover / Focus:** The button rises 1px and takes the button shadow over 0.25s. The fill stays vermilion. Focus adds the brass outline. Disabled drops to opacity 0.55, loses the rise, and loses the shadow.
- **Secondary:** Transparent ground, iron ink text, strong iron line, no resting shadow. The same hover rise applies.

### Cards / Containers

A raised sheet is raised paper, a 1px iron line, an 8px corner, 22px of padding, and the rest shadow. The account sheet uses the same face with 18px of padding. The course status sheet uses 24px of padding and a 20px stack. A course row uses 16px by 18px. In progress, the row and the course sheet switch to progress paper. When the reading is finished, they switch to moss wash.

The shelf row lifts 3px on hover and focus into the lift shadow. Its cover fan opens, and a 1px vermilion rule scales in under the title from the left. A linked document sheet uses the same 3px rise. A guide row does not: it is transparent, with 18px of vertical padding, a bottom hairline, and no shadow. The guide title is the title face, the excerpt is 15px soft iron clamped to four lines, and the action is vermilion at 14px, weight 700.

The book cover is a 2 / 3 board with a 4px corner. An empty cover centers a Spectral monogram in library green.

**The Cover Fan Rule.** Hover or focus on a course row opens the cover fan and draws one vermilion rule under the title.

**The Pull Rule.** Choosing a course or book pulls that volume off the wood shelf and turns its cover toward the reader before the next page opens. Reduced motion skips the flourish.

### Inputs / Fields

Fields are bone paper inside a strong iron line, with a 6px corner, 10px by 12px of padding, and Karla at 15px. The label above a field is 14px soft iron. Placeholder text is soft iron. The account error and a failed chat note are 14px vermilion.

The status sheet's select uses the same paper, line, and Karla, and draws its chevron from two soft-iron borders. The score control is a 6px track on score-track paper and a 24px thumb with a 2px bone border. Empty, the thumb and the figure are score idle. A set score colors them vermilion under 2.5, brass under 4, and moss from 4 to 5. The figure is 12px, weight 700, tracking 0.06em. Disabled fields drop to opacity 0.6.

**The Brass Focus Rule.** Links, buttons, summaries, and fields take a 2px brass outline, 3px outside the edge.

### Navigation

The header is library green. The wordmark is Spectral, bone, weight 600, 1.25rem, tracking -0.03em. Courses, Docs, and Deploy are Karla 15px, weight 500, shelf dust, turning bone on hover, with 18px between them. Login and Sign out sit in that same quiet link style. Below 800px the header wraps, the links take a full row, and their size drops to 14px with a 12px gap.

A course or book menu opens as raised paper, 8px corners, the lift shadow, and a scroll height capped at 320px. Rows are 6px. The active row is brass wash with a 1px brass inset. Hover on a row is brass wash.

The colophon repeats the green band: the name in bone at weight 700, the line "A private shelf for a structured canon." in shelf dust, at 14px.

### Status stamp

Status is a stamp, not a meter. It is uppercase Karla, 12px, weight 700, tracking 0.06em, padding 4px by 8px, a 2px corner, and a 1px border in the current text color. An 8px dot sits 8px to the left of the word.

- **Not started:** Soft iron text, transparent ground, idle-clay dot.
- **In progress:** Vermilion text on vermilion wash, border at rgba(157, 52, 40, 0.35), vermilion dot.
- **Read:** Moss text on moss wash, border at rgba(44, 92, 64, 0.3), moss dot.
- **Error:** Vermilion text on vermilion wash, border at rgba(157, 52, 40, 0.4).

The signed-out course sheet uses the quiet stamp. The word is Locked until a reader signs in.

### Progress line

Progress is one rule. On the home shelf it is 3px tall, iron at 12% opacity, filled with vermilion. On the course sheet it is 4px tall, on the soft iron line, filled with vermilion, and it turns moss when the course is read. The fill eases on the shelf curve over 0.6s. Counts beside the home line are tabular, weight 700.

### Dialog

The course creator is a dialog on bone paper with a strong iron line, a 12px corner, the lift shadow, and a frame padded 20px. Its width is min(680px, 92vw). The log is a raised sheet, max height 320px. A reader's message sits on brass wash. The scrim is iron at 46% opacity.

## Do's and Don'ts

### Do:

- **Do** set the page on bone paper and run library green full-bleed through the header and the colophon.
- **Do** set the wordmark, titles, and guide prose in Spectral, and set navigation, buttons, fields, and stamps in Karla.
- **Do** keep a guide in a 68ch Spectral measure at 1.125rem and line-height 1.7, on the paper, with no sheet behind the prose.
- **Do** mark the place with vermilion: the progress fill, the primary button, reading links, and the single rule under a hovered course title.
- **Do** mark keyboard focus with a 2px brass outline, 3px outside the control.
- **Do** stamp status in uppercase Karla at 12px, weight 700, tracking 0.06em, with a 2px corner.
- **Do** lift a course row on hover and focus, open the cover fan, and draw the vermilion rule. On select, pull the volume forward. Drop that motion when the reader prefers reduced motion.
- **Do** seat the shelf rows on wood and give covers a page edge, without turning the reading measure into a poster.
- **Do** keep body text at or above 4.5:1 against its paper.

### Don't:

- **Don't** build a dark glass dashboard. There is no dark theme, no backdrop blur, and no translucent panel over the paper.
- **Don't** use a floating pill for navigation, buttons, or status. A status dot and a score thumb stay circular because they are points on a control.
- **Don't** fill a page or a card with vermilion. The wash belongs to the in-progress stamp.
- **Don't** set the guide in Karla, and don't set buttons or stamps in Spectral.
- **Don't** use a zero-blur hard offset shadow.
- **Don't** replace the progress rule with a ring, a sparkline, or a scoreboard. A score stays on the book's own sheet.
