import type { ExportArtifact, ExportRequest } from "../types";
import { blobToArrayBuffer, buildBaseFileName, createArtifact } from "../utils";
import { renderTableToCanvas } from "./render";

export async function exportTableAsPng(request: ExportRequest): Promise<ExportArtifact> {
  const canvas = await renderTableToCanvas(request.tableElement, {
    scale: request.options.imageScale,
    backgroundColor: request.options.backgroundColor,
    visualStyle: request.options.visualStyle,
    renderEngine: request.options.renderEngine,
    tableData: request.table
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value);
      } else {
        reject(new Error("Failed to generate PNG blob."));
      }
    }, "image/png");
  });

  const arrayBuffer = await blobToArrayBuffer(blob);
  const fileName = `${buildBaseFileName(request.table, request.settings)}.png`;
  return createArtifact(fileName, "image/png", arrayBuffer);
}
