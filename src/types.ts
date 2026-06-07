export type ExportFormat = "png" | "csv" | "xlsx" | "pdf";
export type ExportVisualStyle = "clean" | "current";
export type PostExportAction = "none" | "show-in-finder" | "open-file";
export type ExportRenderEngine = "auto" | "svg" | "dom";

export interface TableCellData {
  text: string;
  html: string;
  colspan: number;
  rowspan: number;
  isHeader: boolean;
}

export interface TableRowData {
  cells: TableCellData[];
}

export interface TableData {
  id: string;
  index: number;
  notePath: string;
  title: string;
  rows: TableRowData[];
  columnCount: number;
  rowCount: number;
}

export interface TableExportSettings {
  exportFolder: string;
  imageScale: number;
  imageBackgroundColor: string;
  pdfPageSize: "a4" | "letter";
  pdfOrientation: "portrait" | "landscape";
  pdfMargin: number;
  pngFilenameTemplate: string;
  csvDelimiter: "," | ";" | "\t";
  defaultVisualStyle: ExportVisualStyle;
  defaultRenderEngine: ExportRenderEngine;
  defaultPostExportAction: PostExportAction;
  defaultCopyPngToClipboard: boolean;
}

export interface ExportOptions {
  format: ExportFormat;
  visualStyle: ExportVisualStyle;
  renderEngine: ExportRenderEngine;
  imageScale: number;
  backgroundColor: string;
  pdfPageSize: "a4" | "letter";
  pdfOrientation: "portrait" | "landscape";
  pdfMargin: number;
  postExportAction: PostExportAction;
  copyPngToClipboard: boolean;
}

export interface ExportArtifact {
  fileName: string;
  mimeType: string;
  data: ArrayBuffer;
}

export interface ExportRequest {
  format: ExportFormat;
  table: TableData;
  tableElement: HTMLTableElement;
  settings: TableExportSettings;
  options: ExportOptions;
}
