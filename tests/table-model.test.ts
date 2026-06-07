import { describe, expect, it } from "vitest";
import { tableToMatrix } from "../src/table-model";
import type { TableData } from "../src/types";

describe("tableToMatrix", () => {
  it("expands colspans into a rectangular matrix", () => {
    const table: TableData = {
      id: "note::0",
      index: 0,
      notePath: "Note.md",
      title: "Example",
      columnCount: 3,
      rowCount: 2,
      rows: [
        {
          cells: [
            { text: "A", html: "A", colspan: 2, rowspan: 1, isHeader: true },
            { text: "B", html: "B", colspan: 1, rowspan: 1, isHeader: true }
          ]
        },
        {
          cells: [
            { text: "1", html: "1", colspan: 1, rowspan: 1, isHeader: false },
            { text: "2", html: "2", colspan: 1, rowspan: 1, isHeader: false },
            { text: "3", html: "3", colspan: 1, rowspan: 1, isHeader: false }
          ]
        }
      ]
    };

    expect(tableToMatrix(table)).toEqual([
      ["A", "", "B"],
      ["1", "2", "3"]
    ]);
  });
});
