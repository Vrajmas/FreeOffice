# Personal Documents and Personal Spreadsheets

Two local apps for personal Word documents and Excel workbooks, packaged for macOS, Windows, and Android.

## Personal Documents

Open, edit, and save `.docx` files. The editor includes headings, text styling and color, alignment, numbered and bulleted lists, links, tables, find and replace, print, undo and redo, word count, and drag and drop opening.

## Personal Spreadsheets

Open, edit, and save `.xlsx` workbooks. Use multiple sheets, rename sheets, enter formulas (including references between sheets), select ranges, copy and paste tabular data, format cells, apply number and percent formats, and undo or redo changes. The visible grid grows to 500 rows and has 26 columns.

The desktop apps edit local files. Android builds use the system file picker to open a file and the Android share sheet to save or share an exported copy.

## Rebuild

Run `npm install`, then `npm run build:apps` on an Apple Silicon Mac. The two zip archives are written to `releases/`. Build intermediates stay in `.build/`. For local development, use `npm run dev:documents` or `npm run dev:spreadsheets`.

## CI and releases

Create work on a branch named `<type>/<short-description>`, such as `feat/android-build`, `fix/document-save`, or `ci/release-artifacts`. Use the same Conventional Commit form for each commit subject and the PR title: `<type>(optional-scope): description`. Allowed types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`; add `!` before the colon for a breaking change. The PR template asks for a summary, validation, and release impact. PR builds first validate the branch, title, and commit subjects. Run `npm run naming:test` locally to check the validator.

GitHub Actions builds both editors on macOS, Windows, and Android for pushes and pull requests. Download the six build artifacts from the workflow run. macOS produces `.dmg` installers, Windows produces `.exe` installers, and Android produces debug signed `.apk` files. These builds are for direct testing and installation; macOS and Windows installers are unsigned, and Android APKs use a debug key. Public distribution requires production signing and, on macOS, notarization.

To publish a release, update the package version and lockfile with `npm version patch`, `npm version minor`, or `npm version major`, then run `git push origin main --follow-tags`. The tag must match `package.json`; CI checks this before publishing. A successful tagged run creates a GitHub Release with the six artifacts. For local builds, set `OFFICE_KIND=doc` or `OFFICE_KIND=sheet` and run `npm run build:desktop` on macOS or Windows, or `npm run build:android` with Java and the Android SDK installed.

## Current limits

These are personal editors, not full Microsoft Office replacements. Complex Word layout, images, comments, track changes, macros, charts, some Excel functions, and unsupported formatting may not survive import and export. Saving is manual, so keep original copies of important files.
