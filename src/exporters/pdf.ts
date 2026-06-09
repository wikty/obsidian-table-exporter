import { PDFDocument } from "pdf-lib";
import type { ExportArtifact, ExportRequest } from "../types";
import { buildBaseFileName, createArtifact } from "../utils";
import {
  buildPaginatedLayout,
  getTableRenderLayout,
  renderTableLayoutToCanvas
} from "./render";

const PAGE_SIZES: Record<"a4" | "letter", { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 }
};

export async function exportTableAsPdf(request: ExportRequest): Promise<ExportArtifact> {
  const pageSize = PAGE_SIZES[request.options.pdfPageSize];
  const landscape = request.options.pdfOrientation === "landscape";
  const pageWidth = landscape ? pageSize.height : pageSize.width;
  const pageHeight = landscape ? pageSize.width : pageSize.height;
  const margin = request.options.pdfMargin;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const pdf = await PDFDocument.create();

  const pageSlices = await buildRowAwareSlices(request, usableWidth, usableHeight);

  for (const slice of pageSlices) {
    const imageData = slice.toDataURL("image/png");
    const embeddedImage = await pdf.embedPng(imageData);
    const renderedHeight = (slice.height * usableWidth) / slice.width;
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: margin,
      y: pageHeight - margin - renderedHeight,
      width: usableWidth,
      height: renderedHeight
    });
  }

  const pdfBytes = await pdf.save();
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;
  const fileName = `${buildBaseFileName(request.table, request.settings)}.pdf`;
  return createArtifact(fileName, "application/pdf", arrayBuffer);
}

async function buildRowAwareSlices(
  request: ExportRequest,
  usableWidth: number,
  usableHeight: number
): Promise<HTMLCanvasElement[]> {
  const layout = getTableRenderLayout(request.table, request.tableElement);
  const headerHeight = layout.rowHeights[0] ?? 0;
  const usableHeightLogical = usableHeight * (layout.width / usableWidth);
  const maxBodyHeight = Math.max(1, usableHeightLogical - headerHeight);
  const slices: HTMLCanvasElement[] = [];

  let startRow = 1;
  while (startRow < layout.rowHeights.length) {
    let currentHeight = 0;
    let endRow = startRow;

    while (endRow < layout.rowHeights.length) {
      const nextHeight = currentHeight + layout.rowHeights[endRow];
      if (currentHeight > 0 && nextHeight > maxBodyHeight) {
        break;
      }

      currentHeight = nextHeight;
      endRow += 1;

      if (currentHeight >= maxBodyHeight) {
        break;
      }
    }

    const pageLayout = buildPaginatedLayout(layout, startRow, endRow);
    const pageCanvas = await renderTableLayoutToCanvas(
      pageLayout,
      request.options.imageScale,
      request.options.backgroundColor
    );
    slices.push(...sliceCanvasToFitPage(pageCanvas, usableWidth, usableHeight, request.options.backgroundColor));
    startRow = endRow;
  }

  return slices;
}

function sliceCanvasToFitPage(
  canvas: HTMLCanvasElement,
  usableWidth: number,
  usableHeight: number,
  backgroundColor: string
): HTMLCanvasElement[] {
  const maxSliceHeight = Math.max(1, Math.floor((usableHeight * canvas.width) / usableWidth));
  if (canvas.height <= maxSliceHeight) {
    return [canvas];
  }

  const slices: HTMLCanvasElement[] = [];
  let offsetY = 0;
  while (offsetY < canvas.height) {
    const currentHeight = Math.min(maxSliceHeight, canvas.height - offsetY);
    slices.push(createCanvasSlice(canvas, offsetY, offsetY + currentHeight, backgroundColor));
    offsetY += currentHeight;
  }

  return slices;
}

function createCanvasSlice(
  canvas: HTMLCanvasElement,
  rawStartY: number,
  rawEndY: number,
  backgroundColor: string
): HTMLCanvasElement {
  const startY = Math.max(0, Math.floor(rawStartY));
  const endY = Math.min(canvas.height, Math.ceil(rawEndY));
  const currentHeight = Math.max(1, endY - startY);
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = canvas.width;
  pageCanvas.height = currentHeight;

  const context = pageCanvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create a PDF rendering canvas.");
  }

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  context.drawImage(
    canvas,
    0,
    startY,
    canvas.width,
    currentHeight,
    0,
    0,
    pageCanvas.width,
    pageCanvas.height
  );

  return pageCanvas;
}
