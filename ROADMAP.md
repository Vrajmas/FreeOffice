# Personal Office roadmap

## Current release: 0.3.0

Two separate macOS apps share one codebase: Personal Documents for `.docx` and Personal Spreadsheets for `.xlsx`. See README.md for current features and known compatibility limits.

## Next release: reliability

- Automatic recovery copies and a clear restore flow after an unexpected quit.
- Save state that accurately distinguishes edited and saved files.
- Warnings before overwriting or exporting documents with unsupported content.
- Round-trip checks using representative DOCX and XLSX samples.

## Documents

1. Images, page size and margins, headers and footers.
2. Reusable paragraph styles and heading navigation.
3. Comments and tracked changes.

## Spreadsheets

1. Sort and filter, frozen headings, CSV import and export.
2. Charts, conditional formatting, data validation.
3. Pivot-style summaries and larger workbooks.

## Release checks

- TypeScript and production builds pass for both apps.
- Open, edit, save, close, and reopen sample DOCX and XLSX files.
- Verify macOS app signatures and file associations after installation.
- Inspect both editor interfaces and keyboard workflows in a real browser.
