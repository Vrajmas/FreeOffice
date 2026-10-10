# Personal Office roadmap

## Current release: 0.3.7

Two separate macOS apps share one codebase: Personal Documents for `.docx` and Personal Spreadsheets for `.xlsx`. See README.md for current features and known compatibility limits.

## Next release: reliability

- Automatic recovery copies and a clear restore flow after an unexpected quit.
- Save state that accurately distinguishes edited and saved files.
- Warnings before overwriting or exporting documents with unsupported content.
- Round-trip checks using representative DOCX and XLSX samples.

## Documents: Google Docs capability target

The current release supports local editing, A4 pagination, PDF export, basic text and table formatting, and inline images with upload, clipboard paste, drag positioning, and resizing. It does not yet match the full Google Docs feature set.

1. Complete document structure: page setup, margins, headers, footers, sections, page breaks, styles, outline, and tables of contents.
2. Complete editing tools: precise font sizing, line spacing, checklists, format paint, spellcheck controls, image wrap and placement modes, drawings, and accessibility text for images.
3. Review workflows: comments, suggestions, tracked changes, version history, and recovery copies.
4. File fidelity: representative DOCX round trips for text, images, tables, and layout, with warnings for unsupported content.
5. Local workflows: comments, suggestions, and version history stored on this device. Cloud sharing and live collaboration are outside the local-only scope.

## Spreadsheets

1. Sort and filter, frozen headings, CSV import and export.
2. Charts, conditional formatting, data validation.
3. Pivot-style summaries and larger workbooks.

## Release checks

- TypeScript and production builds pass for both apps.
- Open, edit, save, close, and reopen sample DOCX and XLSX files.
- Verify macOS app signatures and file associations after installation.
- Inspect both editor interfaces and keyboard workflows in a real browser.
