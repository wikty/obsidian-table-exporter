import type { TableCellData, TableData } from "./types";

export function tableToMatrix(table: TableData): string[][] {
  const grid: string[][] = [];
  const occupied = new Map<string, boolean>();

  table.rows.forEach((row, rowIndex) => {
    grid[rowIndex] ??= [];
    let columnIndex = 0;

    row.cells.forEach((cell) => {
      while (occupied.get(`${rowIndex}:${columnIndex}`)) {
        columnIndex += 1;
      }

      placeCell(grid, occupied, rowIndex, columnIndex, cell);
      columnIndex += cell.colspan;
    });
  });

  return grid.map((row) => {
    const normalized = [...row];
    while (normalized.length < table.columnCount) {
      normalized.push("");
    }
    return normalized;
  });
}

function placeCell(
  grid: string[][],
  occupied: Map<string, boolean>,
  rowIndex: number,
  columnIndex: number,
  cell: TableCellData
): void {
  for (let rowOffset = 0; rowOffset < cell.rowspan; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < cell.colspan; columnOffset += 1) {
      const targetRow = rowIndex + rowOffset;
      const targetColumn = columnIndex + columnOffset;

      grid[targetRow] ??= [];
      occupied.set(`${targetRow}:${targetColumn}`, true);

      grid[targetRow][targetColumn] = rowOffset === 0 && columnOffset === 0 ? cell.text : "";
    }
  }
}

export function estimateColumnWidths(matrix: string[][]): number[] {
  const widths: number[] = [];
  matrix.forEach((row) => {
    row.forEach((value, columnIndex) => {
      const length = Math.min(Math.max(value.length, 8), 40);
      widths[columnIndex] = Math.max(widths[columnIndex] ?? 0, length);
    });
  });
  return widths;
}
