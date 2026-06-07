import type { ExportArtifact, ExportFormat, ExportRequest } from "../types";
import { exportTableAsCsv } from "./csv";
import { exportTableAsPdf } from "./pdf";
import { exportTableAsPng } from "./png";
import { exportTableAsXlsx } from "./xlsx";

export async function exportTable(request: ExportRequest): Promise<ExportArtifact> {
  switch (request.format) {
    case "png":
      return exportTableAsPng(request);
    case "csv":
      return exportTableAsCsv(request);
    case "xlsx":
      return exportTableAsXlsx(request);
    case "pdf":
      return exportTableAsPdf(request);
    default:
      return assertNever(request.format);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported export format: ${String(value)}`);
}
