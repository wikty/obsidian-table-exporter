# Contributing

Thanks for helping improve `Obsidian Table Exporter`.

## Development setup

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run check
npm test
npm run build
```

## Project expectations

- Keep changes aligned with rendered-table export workflows in Obsidian.
- Prefer small, focused changes over broad refactors.
- Add or update tests when changing export logic, file naming, or table normalization behavior.
- Preserve compatibility with the current `manifest.json` and `versions.json` contract.

## Pull requests

- Open a PR with a focused scope and a clear summary.
- Include manual validation notes when export behavior or UI changes.
- Attach screenshots or sample exported artifacts when visual output changes.
- Keep `README.md`, `CHANGELOG.md`, and release docs in sync when they are affected.

## Release workflow

Before cutting a release:

```bash
npm run release:check
npm run package
```

The packaging step creates:

- `dist/<plugin-id>-<version>/`
- `dist/<plugin-id>-<version>.zip`

See `RELEASE_CHECKLIST.md` for the full publish checklist.

## Community norms

Please also read `CODE_OF_CONDUCT.md` before opening issues or pull requests.
