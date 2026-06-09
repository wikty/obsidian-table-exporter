# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.4] - 2026-06-09

### Fixed

- Moved temporary render-surface CSS into the plugin `styles.css` file to avoid Community Directory review errors about dynamically creating and attaching `style` elements.
- Renamed the settings section heading to a generic label instead of repeating the plugin name.

### Notes

- This release is focused on source review compliance and does not change the plugin's feature set.

## [0.1.3] - 2026-06-09

### Fixed

- Reworked DOM render styling to avoid direct static style assignment patterns flagged by Obsidian Community Directory review.
- Updated the settings tab heading to use `Setting(...).setHeading()` instead of creating heading elements directly.

### Notes

- This release is focused on source review compliance and does not change the user-facing feature set.

## [0.1.2] - 2026-06-09

### Changed

- Switched PDF generation from `jsPDF` to `pdf-lib` to avoid Community Directory review warnings about dynamic script element creation in bundled code.

### Notes

- This release keeps the same user-facing PDF export behavior while reducing review friction for Community Directory submission.

## [0.1.1] - 2026-06-09

### Fixed

- Updated the plugin description metadata to comply with Obsidian Community Directory review rules by removing the word `Obsidian` from the manifest description.

### Notes

- This release exists to satisfy Community Directory submission requirements without changing the plugin's runtime behavior.

## [0.1.0] - 2026-06-05

### Added

- Initial Obsidian plugin release for exporting rendered Markdown tables.
- Export formats: `PNG`, `CSV`, `Excel (.xlsx)`, and `PDF`.
- Automatic table discovery in the active Markdown note.
- Preference for the table most recently hovered or clicked.
- Per-export options dialog for `PNG` and `PDF`.
- Clean visual export style to reduce code-font and highlight artifacts.
- Post-export desktop actions: reveal in Finder or open the exported file.
- `PNG` clipboard export support and a dedicated command for it.
- Configurable export folder, image scale, image background, CSV delimiter, PDF page size, PDF orientation, and PDF margin.

### Fixed

- Prevented blank `PNG` and `PDF` exports caused by rendering cloned tables outside the visible render region.
- Improved PDF pagination flow for long rendered tables.

### Notes

- `PDF` export is currently image-based, so text in the resulting file is not selectable yet.
