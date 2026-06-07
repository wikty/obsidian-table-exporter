import { describe, expect, it, vi } from "vitest";
import { exportTableAsCsv } from "../src/exporters/csv";
import type { ExportRequest, TableData } from "../src/types";

vi.mock("obsidian", () => ({
  FileSystemAdapter: class FileSystemAdapter {},
  TFile: class TFile {},
  normalizePath: (value: string) => value.replace(/\\/g, "/").replace(/\/+/g, "/")
}));

const defaultSettings = {
  exportFolder: "Table Exports",
  imageScale: 2,
  imageBackgroundColor: "#ffffff",
  pdfPageSize: "a4" as const,
  pdfOrientation: "landscape" as const,
  pdfMargin: 20,
  pngFilenameTemplate: "{{note}}-table-{{index}}",
  csvDelimiter: "," as const,
  defaultVisualStyle: "clean" as const,
  defaultRenderEngine: "auto" as const,
  defaultPostExportAction: "show-in-finder" as const,
  defaultCopyPngToClipboard: false
};

const table: TableData = {
  id: "tables/example.md::0",
  index: 0,
  notePath: "tables/example.md",
  title: "Example",
  columnCount: 3,
  rowCount: 3,
  rows: [
    {
      cells: [
        { text: "Optimization", html: "Optimization", colspan: 1, rowspan: 1, isHeader: true },
        { text: "Why / Goal", html: "Why / Goal", colspan: 1, rowspan: 1, isHeader: true },
        { text: "Expected Outcome", html: "Expected Outcome", colspan: 1, rowspan: 1, isHeader: true }
      ]
    },
    {
      cells: [
        { text: "Preserve phrase intent", html: "Preserve phrase intent", colspan: 1, rowspan: 2, isHeader: false },
        { text: "weak token matches", html: "weak token matches", colspan: 1, rowspan: 1, isHeader: false },
        { text: "derby hat over generic hat", html: "derby hat over generic hat", colspan: 1, rowspan: 1, isHeader: false }
      ]
    },
    {
      cells: [
        { text: "structured follow pages", html: "structured follow pages", colspan: 1, rowspan: 1, isHeader: false },
        { text: "retain more query meaning", html: "retain more query meaning", colspan: 1, rowspan: 1, isHeader: false }
      ]
    }
  ]
};

function createRequest(delimiter: "," | ";" | "\t"): ExportRequest {
  return {
    format: "csv",
    table,
    tableElement: {} as HTMLTableElement,
    settings: {
      ...defaultSettings,
      csvDelimiter: delimiter
    },
    options: {
      format: "csv",
      visualStyle: "clean",
      renderEngine: "auto",
      imageScale: 2,
      backgroundColor: "#ffffff",
      pdfPageSize: "a4",
      pdfOrientation: "landscape",
      pdfMargin: 20,
      postExportAction: "none",
      copyPngToClipboard: false
    }
  };
}

describe("exportTableAsCsv", () => {
  it("exports utf-8 csv with a bom for spreadsheet compatibility", async () => {
    const artifact = await exportTableAsCsv(createRequest(","));
    const bytes = new Uint8Array(artifact.data);
    const text = new TextDecoder().decode(artifact.data);

    expect(artifact.fileName).toBe("example-table-1.csv");
    expect(artifact.mimeType).toBe("text/csv");
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(text).toContain("Optimization,Why / Goal,Expected Outcome");
  });

  it("expands rowspans into a rectangular matrix before serializing", async () => {
    const artifact = await exportTableAsCsv(createRequest(";"));
    const text = new TextDecoder().decode(artifact.data);
    const normalized = text.replace(/^\uFEFF/, "");
    const lines = normalized.split("\n");

    expect(lines[1]).toBe("Preserve phrase intent;weak token matches;derby hat over generic hat");
    expect(lines[2]).toBe(";structured follow pages;retain more query meaning");
  });
});
