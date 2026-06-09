import html2canvas from "html2canvas";
import type { ExportRenderEngine, ExportVisualStyle, TableData } from "../types";
import { tableToMatrix } from "../table-model";

const DEFAULT_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const CELL_PADDING_X = 16;
const CELL_PADDING_Y = 12;
const MIN_COLUMN_WIDTH = 88;
const MAX_COLUMN_WIDTH = 360;
const MAX_TABLE_WIDTH = 1600;
const HEADER_BACKGROUND = "#f6f8fa";
const CELL_BACKGROUND = "#ffffff";
const BORDER_COLOR = "#d0d7de";
const TEXT_COLOR = "#1f2328";
const FONT_SIZE = 16;
const LINE_HEIGHT = 1.4;
const RENDER_WRAPPER_CLASS = "table-exporter-render-wrapper";
const RENDER_TABLE_CLASS = "table-exporter-render-table";
const RENDER_CLEAN_CLASS = "table-exporter-render-clean";

interface RenderOptions {
  scale: number;
  backgroundColor: string;
  visualStyle: ExportVisualStyle;
  renderEngine: ExportRenderEngine;
  tableData: TableData;
}

export interface TableLayoutMetrics {
  rowHeights: number[];
  width: number;
  height: number;
}

export interface TableRenderLayout extends TableLayoutMetrics {
  matrix: string[][];
  columnWidths: number[];
}

export async function renderTableToCanvas(
  tableElement: HTMLTableElement,
  options: RenderOptions
): Promise<HTMLCanvasElement> {
  const engine = resolveRenderEngine(options.renderEngine, options.visualStyle);

  if (engine === "svg") {
    return await renderSvgTableToCanvas(tableElement, options);
  }

  const domCanvas = await renderDomTableToCanvas(tableElement, options);
  if (options.renderEngine === "auto" && isCanvasLikelyBlank(domCanvas, options.backgroundColor)) {
    return await renderSvgTableToCanvas(tableElement, options);
  }

  return domCanvas;
}

function resolveRenderEngine(
  requestedEngine: ExportRenderEngine,
  visualStyle: ExportVisualStyle
): Exclude<ExportRenderEngine, "auto"> {
  if (requestedEngine === "svg" || requestedEngine === "dom") {
    return requestedEngine;
  }

  return visualStyle === "clean" ? "svg" : "dom";
}

async function renderDomTableToCanvas(
  tableElement: HTMLTableElement,
  options: RenderOptions
): Promise<HTMLCanvasElement> {
  const wrapper = document.createElement("div");
  wrapper.className = RENDER_WRAPPER_CLASS;
  wrapper.setCssProps({
    "--table-exporter-render-bg": options.backgroundColor,
    "--table-exporter-render-width": `${Math.ceil(tableElement.getBoundingClientRect().width)}px`
  });
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.appendChild(createRenderStyleElement());

  const clonedTable = tableElement.cloneNode(true) as HTMLTableElement;
  clonedTable.className = `${clonedTable.className} ${RENDER_TABLE_CLASS}`.trim();

  syncComputedStyles(tableElement, clonedTable);
  if (options.visualStyle === "clean") {
    applyCleanDomStyles(clonedTable);
  }

  wrapper.appendChild(clonedTable);
  document.body.appendChild(wrapper);

  try {
    await document.fonts.ready;
    await waitForNextFrame();

    return await html2canvas(wrapper, {
      backgroundColor: options.backgroundColor,
      scale: options.scale,
      useCORS: true,
      logging: false
    });
  } finally {
    wrapper.remove();
  }
}

async function renderSvgTableToCanvas(
  tableElement: HTMLTableElement,
  options: RenderOptions
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const layout = getTableRenderLayout(options.tableData, tableElement);
  return await renderSvgLayoutToCanvas(layout, options.scale, options.backgroundColor);
}

export function getTableLayoutMetrics(table: TableData, tableElement: HTMLTableElement): TableLayoutMetrics {
  const layout = getTableRenderLayout(table, tableElement);
  return {
    rowHeights: [...layout.rowHeights],
    width: layout.width,
    height: layout.height
  };
}

export function getTableRenderLayout(table: TableData, tableElement: HTMLTableElement): TableRenderLayout {
  const layout = buildSvgLayout(table, tableElement);
  return {
    matrix: layout.matrix.map((row) => [...row]),
    columnWidths: [...layout.columnWidths],
    rowHeights: [...layout.rowHeights],
    width: layout.width,
    height: layout.height
  };
}

export async function renderTableLayoutToCanvas(
  layout: TableRenderLayout,
  scale: number,
  backgroundColor: string
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  return await renderSvgLayoutToCanvas(layout, scale, backgroundColor);
}

export function buildPaginatedLayout(
  source: TableRenderLayout,
  startRowIndex: number,
  endRowIndex: number
): TableRenderLayout {
  const headerRow = source.matrix[0] ?? [];
  const pageRows = source.matrix.slice(startRowIndex, endRowIndex).map((row) => [...row]);
  const rowHeights = [
    source.rowHeights[0] ?? 0,
    ...source.rowHeights.slice(startRowIndex, endRowIndex)
  ];

  return {
    matrix: [[...headerRow], ...pageRows],
    columnWidths: [...source.columnWidths],
    rowHeights,
    width: source.width,
    height: rowHeights.reduce((sum, value) => sum + value, 0)
  };
}

function buildSvgLayout(table: TableData, tableElement: HTMLTableElement): SvgLayout {
  const matrix = tableToMatrix(table);
  const preferredWidth = Math.max(Math.ceil(tableElement.getBoundingClientRect().width), table.columnCount * MIN_COLUMN_WIDTH);
  const columnWidths = calculateColumnWidths(matrix, preferredWidth);
  const rowHeights = calculateRowHeights(matrix, columnWidths);
  const width = columnWidths.reduce((sum, value) => sum + value, 0);
  const height = rowHeights.reduce((sum, value) => sum + value, 0);

  return { matrix, columnWidths, rowHeights, width, height };
}

async function renderSvgLayoutToCanvas(
  layout: TableRenderLayout,
  scale: number,
  backgroundColor: string
): Promise<HTMLCanvasElement> {
  const svgMarkup = buildTableSvg(layout, backgroundColor);
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(layout.width * scale);
    canvas.height = Math.ceil(layout.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to create an image rendering canvas.");
    }

    context.scale(scale, scale);
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, layout.width, layout.height);
    context.drawImage(image, 0, 0, layout.width, layout.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function calculateColumnWidths(matrix: string[][], preferredWidth: number): number[] {
  const measurementCanvas = document.createElement("canvas");
  const context = measurementCanvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create a text measurement canvas.");
  }

  context.font = `${FONT_SIZE}px ${DEFAULT_FONT_FAMILY}`;

  const columnCount = Math.max(...matrix.map((row) => row.length), 0);
  const widths = new Array<number>(columnCount).fill(MIN_COLUMN_WIDTH);

  matrix.forEach((row) => {
    row.forEach((value, columnIndex) => {
      const measured = measurePreferredCellWidth(context, value);
      widths[columnIndex] = Math.max(widths[columnIndex] ?? MIN_COLUMN_WIDTH, measured);
    });
  });

  const clamped = widths.map((width) => Math.min(Math.max(width, MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH));
  const currentWidth = clamped.reduce((sum, value) => sum + value, 0);
  if (currentWidth === 0) {
    return clamped;
  }

  if (currentWidth <= preferredWidth) {
    const scale = preferredWidth / currentWidth;
    return clamped.map((width) => Math.round(width * scale));
  }

  if (currentWidth <= preferredWidth * 1.5) {
    return clamped;
  }

  const targetWidth = Math.max(preferredWidth, Math.min(currentWidth, MAX_TABLE_WIDTH));
  const scaled = clamped.map((width) => Math.max(MIN_COLUMN_WIDTH, Math.floor((width / currentWidth) * targetWidth)));
  let remainder = targetWidth - scaled.reduce((sum, value) => sum + value, 0);
  let index = 0;
  while (remainder > 0 && scaled.length > 0) {
    scaled[index % scaled.length] += 1;
    remainder -= 1;
    index += 1;
  }

  return scaled;
}

function calculateRowHeights(matrix: string[][], columnWidths: number[]): number[] {
  const measurementCanvas = document.createElement("canvas");
  const context = measurementCanvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create a row measurement canvas.");
  }

  const rowHeights: number[] = [];
  matrix.forEach((row, rowIndex) => {
    const isHeaderRow = rowIndex === 0;
    context.font = `${isHeaderRow ? 700 : 400} ${FONT_SIZE}px ${DEFAULT_FONT_FAMILY}`;

    const lineCount = row.reduce((max, value, columnIndex) => {
      const lines = wrapText(context, value, Math.max(columnWidths[columnIndex] - CELL_PADDING_X * 2, 1));
      return Math.max(max, lines.length || 1);
    }, 1);

    rowHeights[rowIndex] = Math.ceil(lineCount * FONT_SIZE * LINE_HEIGHT + CELL_PADDING_Y * 2);
  });

  return rowHeights;
}

function measurePreferredCellWidth(context: CanvasRenderingContext2D, value: string): number {
  const candidates = value
    .split(/\n+/)
    .flatMap((line) => line.split(/\s+/))
    .filter(Boolean);

  const target = candidates.length > 0 ? candidates : [value || " "];
  const measuredWidth = target.reduce((max, item) => Math.max(max, context.measureText(item).width), 0);
  return Math.ceil(measuredWidth + CELL_PADDING_X * 2 + 24);
}

function buildTableSvg(layout: SvgLayout, backgroundColor: string): string {
  const rowOffsets = accumulateOffsets(layout.rowHeights);
  const columnOffsets = accumulateOffsets(layout.columnWidths);

  const cellMarkup: string[] = [];
  layout.matrix.forEach((row, rowIndex) => {
    const isHeaderRow = rowIndex === 0;
    row.forEach((value, columnIndex) => {
      const x = columnOffsets[columnIndex];
      const y = rowOffsets[rowIndex];
      const width = layout.columnWidths[columnIndex];
      const height = layout.rowHeights[rowIndex];
      const lines = wrapTextForSvg(value, width - CELL_PADDING_X * 2, isHeaderRow);

      cellMarkup.push(
        `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${isHeaderRow ? HEADER_BACKGROUND : CELL_BACKGROUND}" stroke="${BORDER_COLOR}" stroke-width="1" />`
      );

      const textY = y + CELL_PADDING_Y + FONT_SIZE;
      const textMarkup = lines
        .map((line, lineIndex) => {
          const dy = lineIndex === 0 ? 0 : FONT_SIZE * LINE_HEIGHT;
          return `<tspan x="${x + CELL_PADDING_X}" dy="${dy}">${escapeXml(line)}</tspan>`;
        })
        .join("");

      cellMarkup.push(
        `<text x="${x + CELL_PADDING_X}" y="${textY}" fill="${TEXT_COLOR}" font-family="${escapeXml(
          DEFAULT_FONT_FAMILY
        )}" font-size="${FONT_SIZE}" font-weight="${isHeaderRow ? 700 : 400}" text-anchor="start" xml:space="preserve">${textMarkup}</text>`
      );
    });
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">`,
    `<rect width="100%" height="100%" fill="${backgroundColor}" />`,
    ...cellMarkup,
    `</svg>`
  ].join("");
}

function wrapTextForSvg(value: string, maxWidth: number, isHeaderRow: boolean): string[] {
  const measurementCanvas = document.createElement("canvas");
  const context = measurementCanvas.getContext("2d");
  if (!context) {
    return [value];
  }

  context.font = `${isHeaderRow ? 700 : 400} ${FONT_SIZE}px ${DEFAULT_FONT_FAMILY}`;
  return wrapText(context, value, maxWidth);
}

function wrapText(context: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const normalized = value.replace(/\u00A0/g, " ").trim();
  if (!normalized) {
    return [""];
  }

  const lines: string[] = [];
  const paragraphs = normalized.split("\n");
  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      return;
    }

    let current = "";
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth) {
        current = candidate;
        return;
      }

      if (current) {
        lines.push(current);
      }

      if (context.measureText(word).width <= maxWidth) {
        current = word;
        return;
      }

      const chunks = breakLongToken(context, word, maxWidth);
      if (chunks.length > 1) {
        lines.push(...chunks.slice(0, -1));
      }
      current = chunks[chunks.length - 1] ?? "";
    });

    if (current) {
      lines.push(current);
    }
  });

  return lines.length > 0 ? lines : [normalized];
}

function breakLongToken(context: CanvasRenderingContext2D, token: string, maxWidth: number): string[] {
  const parts: string[] = [];
  let current = "";

  for (const character of Array.from(token)) {
    const candidate = `${current}${character}`;
    if (current && context.measureText(candidate).width > maxWidth) {
      parts.push(current);
      current = character;
      continue;
    }

    current = candidate;
  }

  if (current) {
    parts.push(current);
  }

  return parts.length > 0 ? parts : [token];
}

function syncComputedStyles(source: HTMLElement, target: HTMLElement): void {
  const sourceChildren = Array.from(source.children) as HTMLElement[];
  const targetChildren = Array.from(target.children) as HTMLElement[];

  copyStyles(source, target);

  for (let index = 0; index < sourceChildren.length; index += 1) {
    const sourceChild = sourceChildren[index];
    const targetChild = targetChildren[index];
    if (sourceChild && targetChild) {
      syncComputedStyles(sourceChild, targetChild);
    }
  }
}

function copyStyles(source: HTMLElement, target: HTMLElement): void {
  const computed = window.getComputedStyle(source);
  for (const property of Array.from(computed)) {
    target.style.setProperty(
      property,
      computed.getPropertyValue(property),
      computed.getPropertyPriority(property)
    );
  }
}

function applyCleanDomStyles(table: HTMLTableElement): void {
  table.classList.add(RENDER_CLEAN_CLASS);
}

function createRenderStyleElement(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    .${RENDER_WRAPPER_CLASS} {
      position: absolute;
      left: -100000px;
      top: 0;
      padding: 24px;
      background: var(--table-exporter-render-bg);
      width: max-content;
      max-width: none;
      pointer-events: none;
      z-index: -1;
      overflow: visible;
    }

    .${RENDER_TABLE_CLASS} {
      max-width: none;
      width: var(--table-exporter-render-width);
      margin: 0;
    }

    .${RENDER_CLEAN_CLASS} {
      background: var(--table-exporter-render-bg);
      border-collapse: collapse;
      font-family: ${DEFAULT_FONT_FAMILY};
      color: ${TEXT_COLOR};
    }

    .${RENDER_CLEAN_CLASS} th,
    .${RENDER_CLEAN_CLASS} td {
      font-family: inherit;
      font-size: ${FONT_SIZE}px;
      line-height: ${LINE_HEIGHT};
      vertical-align: top;
      word-break: break-word;
      white-space: pre-wrap;
      text-align: left;
      background: ${CELL_BACKGROUND};
      color: ${TEXT_COLOR};
      border-color: ${BORDER_COLOR};
      box-shadow: none;
    }

    .${RENDER_CLEAN_CLASS} th {
      font-weight: 700;
      background: ${HEADER_BACKGROUND};
    }

    .${RENDER_CLEAN_CLASS} code,
    .${RENDER_CLEAN_CLASS} mark {
      font-family: inherit;
      font-size: inherit;
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      border-radius: 0;
      box-shadow: none;
    }
  `;
  return style;
}

function isCanvasLikelyBlank(canvas: HTMLCanvasElement, backgroundColor: string): boolean {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return false;
  }

  const width = Math.max(1, Math.floor(canvas.width / 10));
  const height = Math.max(1, Math.floor(canvas.height / 10));
  const data = context.getImageData(0, 0, width, height).data;
  const [backgroundR, backgroundG, backgroundB] = parseHexColor(backgroundColor);
  let differingPixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha === 0) {
      continue;
    }

    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const distance =
      Math.abs(red - backgroundR) + Math.abs(green - backgroundG) + Math.abs(blue - backgroundB);
    if (distance > 24) {
      differingPixels += 1;
      if (differingPixels > 12) {
        return false;
      }
    }
  }

  return true;
}

function parseHexColor(value: string): [number, number, number] {
  const normalized = value.trim().replace(/^#/, "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized;

  const number = Number.parseInt(expanded || "ffffff", 16);
  return [(number >> 16) & 0xff, (number >> 8) & 0xff, number & 0xff];
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function accumulateOffsets(values: number[]): number[] {
  const offsets: number[] = [];
  let current = 0;
  values.forEach((value, index) => {
    offsets[index] = current;
    current += value;
  });
  return offsets;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load the generated table image."));
    image.src = source;
  });
}

interface SvgLayout {
  matrix: string[][];
  columnWidths: number[];
  rowHeights: number[];
  width: number;
  height: number;
}
