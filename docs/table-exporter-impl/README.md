# Table Exporter Implementation Notes

This folder captures the implementation details we want to preserve from `Obsidian Table Exporter`, both for maintaining this plugin and for informing a more general Obsidian export framework later.

## What is here

- [implementation-flow.md](implementation-flow.md)
  End-to-end export flow, from command invocation to artifact writeback.
- [framework-evolution-draft.md](framework-evolution-draft.md)
  A design draft for evolving `Table Exporter` into a broader `knowledge-to-deliverable` export layer for Obsidian.

## Why these notes exist

Even though `Table Exporter` looks like a small utility, the real work sits in the boundary between:

- rendered Obsidian content
- browser/Electron rendering behavior
- export fidelity expectations
- multiple artifact formats with different constraints

The implementation details here are intentionally written as reusable engineering notes, not just plugin-specific release notes.

## Core lessons worth carrying forward

- Rendered-content export is a UI/runtime problem, not only a Markdown parsing problem.
- Stable export quality usually needs multiple render strategies instead of a single universal pipeline.
- Export target selection is a first-class product and architecture problem when a note contains multiple renderable blocks.
- Long-content export is fundamentally a pagination problem, not only a screenshot problem.
- “Looks fine on one note” is not enough. Regression coverage across width, length, language, and layout shape is required.
