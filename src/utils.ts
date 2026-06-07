import { FileSystemAdapter, normalizePath, TFile } from "obsidian";
import type { ExportArtifact, ExportOptions, TableData, TableExportSettings } from "./types";

export function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, " ").trim();
}

export function buildBaseFileName(table: TableData, settings: TableExportSettings): string {
  const noteName = table.notePath.split("/").pop()?.replace(/\.md$/i, "") ?? "note";
  const template = settings.pngFilenameTemplate || "{{note}}-table-{{index}}";
  return sanitizeFileName(
    template
      .split("{{note}}").join(noteName)
      .split("{{index}}").join(String(table.index + 1))
  );
}

export function buildArtifactPath(settings: TableExportSettings, fileName: string): string {
  const baseFolder = settings.exportFolder.trim() || "Table Exports";
  return normalizePath(`${baseFolder}/${fileName}`);
}

export function arrayBufferFromString(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer;
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const [, base64] = dataUrl.split(",");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function ensureMarkdownFile(file: TFile | null): asserts file is TFile {
  if (!file || file.extension !== "md") {
    throw new Error("The active file is not a Markdown note.");
  }
}

export function dirname(path: string): string {
  const parts = normalizePath(path).split("/");
  parts.pop();
  return parts.join("/");
}

export function summarizeTable(table: TableData): string {
  return `${table.rowCount} rows x ${table.columnCount} columns`;
}

export function isHTMLElement(value: Element | null): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function mapArtifactExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "text/csv":
      return "csv";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export function createArtifact(fileName: string, mimeType: string, data: ArrayBuffer): ExportArtifact {
  return { fileName, mimeType, data };
}

export function createDefaultExportOptions(
  format: ExportOptions["format"],
  settings: TableExportSettings
): ExportOptions {
  return {
    format,
    visualStyle: settings.defaultVisualStyle,
    renderEngine: settings.defaultRenderEngine,
    imageScale: settings.imageScale,
    backgroundColor: settings.imageBackgroundColor,
    pdfPageSize: settings.pdfPageSize,
    pdfOrientation: settings.pdfOrientation,
    pdfMargin: settings.pdfMargin,
    postExportAction: settings.defaultPostExportAction,
    copyPngToClipboard: settings.defaultCopyPngToClipboard
  };
}

export function resolveAbsoluteVaultPath(adapter: unknown, vaultPath: string): string | null {
  if (adapter instanceof FileSystemAdapter) {
    return normalizePath(`${adapter.getBasePath()}/${vaultPath}`);
  }

  return null;
}
