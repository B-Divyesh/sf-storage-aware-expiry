# Visual thesis: the household storage instrument

## Direction and purpose

Storage-Aware Expiry uses a **mid-century instrument panel**. A household date is a reading, not a lifestyle score. The visual system borrows the calm precision of 1950s appliance dials, stamped pantry labels, and cream enamel panels. It makes location and date changes easy to scan without suggesting that a planning date proves food safety.

The interface is deliberately asymmetric. A wide control desk holds the real app while a narrow rail carries status and guidance. Knurled circles, inset rules, clipped corners, and storage-color bands create identity without turning content into decoration.

## Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--paper` | `#F3E9D2` | `#171B1B` | enamel page |
| `--panel` | `#FFF9EA` | `#222827` | raised surfaces |
| `--ink` | `#202A2C` | `#F5EBD5` | primary text |
| `--muted` | `#596465` | `#B8C1BC` | secondary text |
| `--line` | `#7B6C52` | `#8E9A92` | outlines and divisions |
| `--tomato` | `#A83E32` | `#E17362` | primary control and warnings |
| `--brass` | `#B47B26` | `#E4B85D` | focus and selected readings |
| `--freezer` | `#176C78` | `#67CAD2` | freezer location |
| `--fridge` | `#456B40` | `#8DB884` | fridge location |
| `--pantry` | `#75451F` | `#D8A466` | pantry location |
| `--danger` | `#902F28` | `#FF8D7C` | overdue state |

All body-text pairs meet WCAG AA. Color always appears with a word or symbol.

## Type and spacing

- Display: **Georgia**, bold, with compact line height. Its sturdy shapes resemble printed appliance manuals.
- Body and controls: **Arial**, with broad platform support and no network font request.
- Readings and small labels: body face in uppercase with tabular numerals and extra tracking.
- Scale: 14, 16, 18, 24, 36, and responsive 56 px.
- Spacing follows 4/8 px increments: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Text measure stays below 68 characters.

## Shape and interaction grammar

- Primary actions are red enamel levers: rectangular, clipped corners, 2 px ink border, 4 px offset shadow.
- Secondary controls are cream buttons with a 1 px outline.
- Inventory rows are stacked paper tickets. A colored left band and printed location word identify storage.
- Date state is shown as a numbered dial: `Use in 3 days`, `Due today`, or `4 days past`.
- Moving an item between locations recalculates its planned date from the chosen preset and the move date. A clear review sentence appears before save.
- Destructive removal is confirmed. Completing an item is reversible through an Undo action.

## Motion policy

The signature motion is a single **needle settle**: changing a storage place rotates a small dial needle for 220 ms, then stops. New tickets slide upward 8 px over 180 ms. Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and state changes are instant.

## Responsive behavior

At 390 px the status rail moves below the controls, action groups stack, and the item form becomes one column. Inventory facts stay visible; decorative calibration marks disappear. Touch targets remain at least 44 px.

## Original asset plan and provenance

- Hero illustration: an original cutaway still life of pantry jar, green fridge tin, and teal freezer container arranged like instruments on a cream enamel panel. No words appear in the art. It explains the three storage places at a glance.
- Social image: composed locally from the hero illustration and product typography.
- Icons and dial marks: hand-authored SVG/CSS primitives made for this product.

### Image prompt sheet

Subject: three food storage containers arranged on a mid-century kitchen appliance control panel; pantry jar, refrigerator tin, frosted freezer box. World: practical 1950s household utility, not nostalgia advertising. Materials: cream enamel, brushed brass, printed paper labels without text, teal plastic, olive painted metal. Light: soft north-window studio light with short honest shadows. Lens: orthographic product illustration, slightly elevated. Palette words: warm cream, charcoal, oxidized teal, olive, tomato red, aged brass. Negative list: people, hands, brands, logos, readable text, watermark, gradients, neon colors, photoreal food spoilage, clutter.

Generated through `/opt/fleet/lib/gen-image.sh` using the factory image deployment on 2026-09-02. The selected image and prompt sidecar are stored in `assets/src/`. Generated art is original to this product. The distributed WebP is optimized below 300 KB.
