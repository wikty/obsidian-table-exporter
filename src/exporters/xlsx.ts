import writeXlsxFile from "write-excel-file/browser";
import { tableToMatrix } from "../table-model";
import type { ExportArtifact, ExportRequest } from "../types";
import { buildBaseFileName, createArtifact } from "../utils";

export async function exportTableAsXlsx(request: ExportRequest): Promise<ExportArtifact> {
  const matrix = tableToMatrix(request.table);
  const rows = matrix.map((row, rowIndex) =>
    row.map((value) => ({
      value,
      fontWeight: (rowIndex === 0 ? "bold" : undefined) as "bold" | undefined,
      alignVertical: "top" as const,
      wrap: true
    }))
  );

  const blob = await writeXlsxFile(rows, {
    sheet: "Table"
  }).toBlob();
  const arrayBuffer = await blob.arrayBuffer();

  const fileName = `${buildBaseFileName(request.table, request.settings)}.xlsx`;
  return createArtifact(
    fileName,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    arrayBuffer
  );
}
