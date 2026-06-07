import Papa from "papaparse";
import { tableToMatrix } from "../table-model";
import type { ExportArtifact, ExportRequest } from "../types";
import { arrayBufferFromString, buildBaseFileName, createArtifact } from "../utils";

export async function exportTableAsCsv(request: ExportRequest): Promise<ExportArtifact> {
  const matrix = tableToMatrix(request.table);
  const csv = Papa.unparse(matrix, {
    delimiter: request.settings.csvDelimiter,
    newline: "\n"
  });
  const withBom = `\uFEFF${csv}`;
  const fileName = `${buildBaseFileName(request.table, request.settings)}.csv`;
  return createArtifact(fileName, "text/csv", arrayBufferFromString(withBom));
}
