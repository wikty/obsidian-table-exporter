import {
  MarkdownView,
  Notice,
  Plugin,
  TFile
} from "obsidian";
import { exportTable } from "./exporters";
import { ExportOptionsModal, FormatSelectionModal, TableSelectionModal } from "./modals";
import { DEFAULT_SETTINGS, TableExporterSettingTab } from "./settings";
import { getRenderedTables, TABLE_SELECTOR, type TableTarget } from "./table-dom";
import type { ExportFormat, ExportOptions, ExportRequest, TableExportSettings } from "./types";
import { buildArtifactPath, createDefaultExportOptions, ensureMarkdownFile, resolveAbsoluteVaultPath } from "./utils";

export default class TableExporterPlugin extends Plugin {
  settings: TableExportSettings = DEFAULT_SETTINGS;
  private lastInteractedTable: HTMLTableElement | null = null;
  private lastInteractedAt = 0;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new TableExporterSettingTab(this.app, this));
    this.registerTableTracking();
    this.registerCommands();
  }

  onunload(): void {
    this.lastInteractedTable = null;
    this.lastInteractedAt = 0;
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData())
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private registerTableTracking(): void {
    const updateLastInteractedTable = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const table = target.closest(TABLE_SELECTOR);
      if (table instanceof HTMLTableElement) {
        this.lastInteractedTable = table;
        this.lastInteractedAt = Date.now();
      }
    };

    this.registerDomEvent(document, "mouseover", updateLastInteractedTable);
    this.registerDomEvent(document, "click", updateLastInteractedTable);
  }

  private registerCommands(): void {
    this.addCommand({
      id: "export-table",
      name: "Export Markdown table",
      callback: async () => {
        const format = await this.chooseFormat();
        if (format) {
          await this.runExportFlow(format);
        }
      }
    });

    const formats: Array<{ id: ExportFormat; name: string }> = [
      { id: "png", name: "Export Markdown table as PNG" },
      { id: "csv", name: "Export Markdown table as CSV" },
      { id: "xlsx", name: "Export Markdown table as Excel" },
      { id: "pdf", name: "Export Markdown table as PDF" }
    ];

    formats.forEach((format) => {
      this.addCommand({
        id: `export-table-as-${format.id}`,
        name: format.name,
        callback: async () => {
          await this.runExportFlow(format.id);
        }
      });
    });

    this.addCommand({
      id: "export-table-as-png-and-copy",
      name: "Export Markdown table as PNG and copy to clipboard",
      callback: async () => {
        const options = createDefaultExportOptions("png", this.settings);
        options.copyPngToClipboard = true;
        await this.runExportFlow("png", options);
      }
    });
  }

  private async chooseFormat(): Promise<ExportFormat | null> {
    return await new Promise<ExportFormat | null>((resolve) => {
      new FormatSelectionModal(this.app, (format) => resolve(format)).open();
    });
  }

  private async runExportFlow(format: ExportFormat, presetOptions?: ExportOptions): Promise<void> {
    const target = await this.resolveTableTarget();
    if (!target) {
      return;
    }

    const options = presetOptions ?? (await this.chooseExportOptions(format));
    if (!options) {
      return;
    }

    await this.runExport(target, options);
  }

  private async chooseExportOptions(format: ExportFormat): Promise<ExportOptions | null> {
    return await new Promise<ExportOptions | null>((resolve) => {
      new ExportOptionsModal(this.app, this.settings, format, (options) => resolve(options)).open();
    });
  }

  private async runExport(target: TableTarget, options: ExportOptions): Promise<void> {
    try {
      const request: ExportRequest = {
        format: options.format,
        table: target.data,
        tableElement: target.element,
        settings: this.settings,
        options
      };

      new Notice(`Exporting table as ${options.format.toUpperCase()}...`);
      const artifact = await exportTable(request);
      const targetPath = buildArtifactPath(this.settings, artifact.fileName);
      await this.ensureFolderForFile(targetPath);
      await this.app.vault.adapter.writeBinary(targetPath, artifact.data);
      const absolutePath = resolveAbsoluteVaultPath(this.app.vault.adapter, targetPath);
      if (options.format === "png" && options.copyPngToClipboard) {
        await this.copyPngToClipboard(artifact.data);
      }
      await this.runPostExportAction(options, absolutePath);
      const copiedSuffix = options.format === "png" && options.copyPngToClipboard ? " and copied it to the clipboard" : "";
      new Notice(`Exported ${artifact.fileName} to ${targetPath}${copiedSuffix}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Table export failed: ${message}`);
      console.error("Table Exporter", error);
    }
  }

  private async resolveTableTarget(): Promise<TableTarget | null> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("Open a Markdown note first.");
      return null;
    }

    ensureMarkdownFile(view.file);
    const file = view.file as TFile;
    const tables = getRenderedTables(view, file);

    if (tables.length === 0) {
      new Notice("No rendered Markdown tables were found in the active note.");
      return null;
    }

    const preferred = this.findPreferredTable(tables);
    if (preferred) {
      return preferred;
    }

    if (tables.length === 1) {
      return tables[0];
    }

    return await new Promise<TableTarget | null>((resolve) => {
      new TableSelectionModal(
        this.app,
        tables.map((table) => table.data),
        (selected) => {
          if (!selected) {
            resolve(null);
            return;
          }
          resolve(tables.find((table) => table.data.id === selected.id) ?? null);
        }
      ).open();
    });
  }

  private findPreferredTable(tables: TableTarget[]): TableTarget | null {
    const interactedMatch = this.lastInteractedTable
      ? (
      tables.find((table) => table.element === this.lastInteractedTable) ??
      tables.find((table) => this.lastInteractedTable?.contains(table.element) || table.element.contains(this.lastInteractedTable as Node)) ??
      null
        )
      : null;

    const mostVisible = this.findMostVisibleTable(tables);
    const interactedFresh = Date.now() - this.lastInteractedAt < 2000;
    if (!interactedMatch) {
      return mostVisible;
    }

    if (!interactedFresh) {
      return mostVisible ?? interactedMatch;
    }

    if (!mostVisible || mostVisible.element === interactedMatch.element) {
      return interactedMatch;
    }

    const interactedScore = this.getVisibilityScore(interactedMatch.element);
    const visibleScore = this.getVisibilityScore(mostVisible.element);
    if (visibleScore > interactedScore * 1.5) {
      return mostVisible;
    }

    return interactedMatch;
  }

  private findMostVisibleTable(tables: TableTarget[]): TableTarget | null {
    let best: TableTarget | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    tables.forEach((table) => {
      const score = this.getVisibilityScore(table.element);
      if (score > bestScore) {
        best = table;
        bestScore = score;
      }
    });

    return best;
  }

  private getVisibilityScore(element: HTMLTableElement): number {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return 0;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const visibleArea = visibleWidth * visibleHeight;
    if (visibleArea <= 0) {
      return 0;
    }

    const areaRatio = visibleArea / (rect.width * rect.height);
    const visibleHeightRatio = visibleHeight / rect.height;
    const visibleWidthRatio = visibleWidth / rect.width;
    const topInViewport = rect.top >= 0 && rect.top <= viewportHeight;
    const topCloseness = topInViewport
      ? 1 - Math.min(rect.top / viewportHeight, 1)
      : 0;
    const viewportCenterY = viewportHeight / 2;
    const elementCenterY = rect.top + rect.height / 2;
    const centerDistance = Math.abs(elementCenterY - viewportCenterY);
    const centerScore = 1 - Math.min(centerDistance / viewportHeight, 1);
    const overscrollPenalty = rect.top < 0 ? Math.min(Math.abs(rect.top) / viewportHeight, 1) : 0;

    return (
      (topInViewport ? 10_000 : 0) +
      topCloseness * 2_000 +
      visibleHeightRatio * 1_500 +
      visibleWidthRatio * 750 +
      areaRatio * 500 +
      centerScore * 100 -
      overscrollPenalty * 2_500
    );
  }

  private async ensureFolderForFile(path: string): Promise<void> {
    const parts = path.split("/");
    parts.pop();
    let current = "";

    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await this.app.vault.adapter.exists(current))) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  private async runPostExportAction(options: ExportOptions, absolutePath: string | null): Promise<void> {
    if (!absolutePath || options.postExportAction === "none") {
      return;
    }

    if (typeof require !== "function") {
      return;
    }

    const electron = require("electron") as typeof import("electron");
    if (options.postExportAction === "show-in-finder") {
      electron.shell.showItemInFolder(absolutePath);
      return;
    }

    if (options.postExportAction === "open-file") {
      await electron.shell.openPath(absolutePath);
    }
  }

  private async copyPngToClipboard(data: ArrayBuffer): Promise<void> {
    if (typeof require !== "function") {
      throw new Error("Clipboard export is only available on desktop.");
    }

    const electron = require("electron") as typeof import("electron");
    const buffer = Buffer.from(new Uint8Array(data));
    const image = electron.nativeImage.createFromBuffer(buffer);
    electron.clipboard.writeImage(image);
  }
}
