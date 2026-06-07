import { MarkdownView, TFile } from "obsidian";
import type { TableCellData, TableData } from "./types";

export interface TableTarget {
  data: TableData;
  element: HTMLTableElement;
}

export const TABLE_SELECTOR = [
  ".markdown-preview-view table",
  ".markdown-reading-view table",
  ".markdown-source-view.mod-cm6.is-live-preview table",
  ".markdown-source-view.mod-cm6 .cm-preview-code-block table",
  ".markdown-source-view.mod-cm6 .cm-embed-block table",
  ".markdown-source-view.mod-cm6 .cm-callout table",
  ".markdown-source-view.mod-cm6 .cm-table-widget table",
  ".markdown-source-view.mod-cm6 table"
].join(", ");

export function getRenderedTables(view: MarkdownView, file: TFile): TableTarget[] {
  const root = view.containerEl;
  const tableElements = Array.from(
    root.querySelectorAll<HTMLTableElement>(TABLE_SELECTOR)
  ).filter((element) => isVisibleTable(element));

  return tableElements.map((element, index) => ({
    data: extractTableData(element, index, file.path),
    element
  }));
}

export function extractTableData(element: HTMLTableElement, index: number, notePath: string): TableData {
  const rowElements = Array.from(element.querySelectorAll("tr"));
  const rows = rowElements.map((rowElement) => ({
    cells: Array.from(rowElement.children)
      .filter((cell): cell is HTMLTableCellElement => cell instanceof HTMLTableCellElement)
      .map((cell): TableCellData => ({
        text: extractCellText(cell),
        html: cell.innerHTML,
        colspan: cell.colSpan || 1,
        rowspan: cell.rowSpan || 1,
        isHeader: cell.tagName.toLowerCase() === "th"
      }))
  }));

  const rowCount = rows.length;
  const columnCount = rows.reduce((max, row) => {
    const width = row.cells.reduce((sum, cell) => sum + (cell.colspan || 1), 0);
    return Math.max(max, width);
  }, 0);

  const firstRow = rows[0]?.cells ?? [];
  const title = firstRow
    .slice(0, Math.min(firstRow.length, 3))
    .map((cell) => cell.text)
    .filter(Boolean)
    .join(" | ") || `Table ${index + 1}`;

  return {
    id: `${notePath}::${index}`,
    index,
    notePath,
    title,
    rows,
    columnCount,
    rowCount
  };
}

function extractCellText(cell: HTMLTableCellElement): string {
  return cell.innerText.replace(/\u00A0/g, " ").replace(/\r\n/g, "\n").trim();
}

function isVisibleTable(element: HTMLTableElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  return true;
}
