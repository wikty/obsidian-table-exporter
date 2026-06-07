# Release Checklist

Use this checklist before publishing a new `Obsidian Table Exporter` release.

## Versioning

- Update `manifest.json` version.
- Update `package.json` version.
- Update `versions.json` with the new plugin version and minimum supported Obsidian version.
- Add a new entry to `CHANGELOG.md`.

## Validation

- Run `npm run release:check`.
- Run `npm run check`.
- Run `npm test`.
- Run `npm run build`.
- Confirm generated `main.js`, `manifest.json`, and `styles.css` are up to date.

## Manual smoke test in Obsidian

- Enable the plugin in a real vault.
- Export a single rendered table as `PNG`.
- Export the same table as `PDF`.
- Export the same table as `CSV`.
- Export the same table as `XLSX`.
- Verify multi-table notes still trigger the table picker when needed.
- Verify `Clean export` and `Current rendered style` both work.
- Verify `Show in Finder` and `Open file` post-export actions.
- Verify `Export Markdown table as PNG and copy to clipboard`.

## Release packaging

- Run `npm run package`.
- Confirm `dist/<plugin-id>-<version>/` exists.
- Confirm `dist/<plugin-id>-<version>.zip` exists.
- Double-check `README.md` installation instructions and screenshots if any are added later.
- Tag the release in git.
- Publish release notes based on `CHANGELOG.md`.
- Verify the GitHub repo metadata points to the correct issue tracker and homepage.
