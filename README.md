# Personal Documents and Personal Spreadsheets

Two local macOS apps for personal Word documents and Excel workbooks.

## Personal Documents

Open, edit, and save `.docx` files. The editor includes headings, text styling and color, alignment, numbered and bulleted lists, links, tables, find and replace, print, undo and redo, word count, and drag and drop opening.

## Personal Spreadsheets

Open, edit, and save `.xlsx` workbooks. Use multiple sheets, rename sheets, enter formulas (including references between sheets), select ranges, copy and paste tabular data, format cells, apply number and percent formats, and undo or redo changes. The visible grid grows to 500 rows and has 26 columns.

Version 0.3.0 was installed in `~/Applications` and registered for `.docx` and `.xlsx` on this Mac. Rebuilds create signed app bundles in `releases/` for reinstalling. Signing is ad hoc for local use.

## Rebuild

Run `npm install`, then `npm run build:apps` on an Apple Silicon Mac. The two zip archives are written to `releases/`. Build intermediates stay in `.build/`. For local development, use `npm run dev:documents` or `npm run dev:spreadsheets`.

## Current limits

These are personal editors, not full Microsoft Office replacements. Complex Word layout, images, comments, track changes, macros, charts, some Excel functions, and unsupported formatting may not survive import and export. Saving is manual, so keep original copies of important files.
