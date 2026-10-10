# Repository work rules

## Branches and pull requests

- Create change branches as `<type>/<short-description>`, using lowercase words separated by hyphens. Examples: `feat/android-build`, `fix/document-save`, `ci/release-artifacts`.
- Use a Conventional Commit subject for every commit and pull request title: `<type>(optional-scope): description`. Add `!` before the colon for a breaking change.
- Allowed types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`.
- Do not use `codex` in branch names, commit subjects, pull request titles, or other names created for this project.
- Fill in the pull request template with a summary, validation performed, and release impact.

## Validation and releases

- Run `npm run naming:test` when changing the naming validator. Pull request CI checks the branch name, pull request title, and every non-merge commit subject before installer builds.
- Run `npm run build` for application changes. Keep the checked-in package version at `0.0.0`. GitHub Actions calculates the next release version from Conventional Commit subjects, builds all six installers with that version, and publishes the tag and release only after every build passes. Run `npm run release:test` when changing the version calculator.
