import { describe, expect, it, vi } from "vitest";
import type { TableData } from "../src/types";
import {
  buildArtifactPath,
  buildBaseFileName,
  createDefaultExportOptions,
  mapArtifactExtension,
  sanitizeFileName,
  summarizeTable
} from "../src/utils";

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

const sampleTable: TableData = {
  id: "folder/note.md::0",
  index: 0,
  notePath: "Folder/My Note.md",
  title: "Search Improvements",
  columnCount: 5,
  rowCount: 7,
  rows: []
};

describe("utils", () => {
  it("sanitizes file names for cross-platform export", () => {
    expect(sanitizeFileName('  bad:/\\\\name*?"<>|  ')).toBe("bad----name------");
  });

  it("builds base file names from the active note and table index", () => {
    const settings = {
      ...defaultSettings,
      pngFilenameTemplate: "{{note}}__{{index}}"
    };

    expect(buildBaseFileName(sampleTable, settings)).toBe("My Note__1");
  });

  it("builds normalized artifact paths inside the configured export folder", () => {
    const settings = {
      ...defaultSettings,
      exportFolder: "Exports//Tables"
    };

    expect(buildArtifactPath(settings, "example.png")).toBe("Exports/Tables/example.png");
  });

  it("creates per-run export defaults from plugin settings", () => {
    const settings = {
      ...defaultSettings,
      imageScale: 4,
      imageBackgroundColor: "#fafafa",
      defaultVisualStyle: "current" as const,
      pdfPageSize: "letter" as const,
      pdfOrientation: "portrait" as const,
      pdfMargin: 12,
      defaultPostExportAction: "open-file" as const,
      defaultCopyPngToClipboard: true
    };

    expect(createDefaultExportOptions("png", settings)).toEqual({
      format: "png",
      visualStyle: "current",
      renderEngine: "auto",
      imageScale: 4,
      backgroundColor: "#fafafa",
      pdfPageSize: "letter",
      pdfOrientation: "portrait",
      pdfMargin: 12,
      postExportAction: "open-file",
      copyPngToClipboard: true
    });
  });

  it("maps supported mime types to extensions", () => {
    expect(mapArtifactExtension("image/png")).toBe("png");
    expect(mapArtifactExtension("text/csv")).toBe("csv");
    expect(mapArtifactExtension("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe("xlsx");
    expect(mapArtifactExtension("application/pdf")).toBe("pdf");
    expect(mapArtifactExtension("application/octet-stream")).toBe("bin");
  });

  it("summarizes table dimensions for picker UI", () => {
    expect(summarizeTable(sampleTable)).toBe("7 rows x 5 columns");
  });
});
