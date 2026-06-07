import { App, Modal, Setting } from "obsidian";
import type { ExportFormat, ExportOptions, TableData, TableExportSettings } from "./types";
import { summarizeTable } from "./utils";

export class TableSelectionModal extends Modal {
  private resolved = false;

  constructor(
    app: App,
    private readonly tables: TableData[],
    private readonly onChoose: (table: TableData | null) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;
    titleEl.setText("Choose a table");
    contentEl.addClass("table-exporter-modal");

    const list = contentEl.createDiv({ cls: "table-exporter-list" });
    this.tables.forEach((table) => {
      const item = list.createDiv({ cls: "table-exporter-item" });
      item.createEl("strong", { text: `${table.index + 1}. ${table.title}` });
      item.createDiv({
        cls: "table-exporter-meta",
        text: summarizeTable(table)
      });
      item.addEventListener("click", () => {
        this.resolved = true;
        this.close();
        this.onChoose(table);
      });
    });
  }

  onClose(): void {
    if (!this.resolved) {
      this.onChoose(null);
    }
    this.contentEl.empty();
  }
}

export class FormatSelectionModal extends Modal {
  private resolved = false;

  constructor(app: App, private readonly onChoose: (format: ExportFormat | null) => void) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;
    titleEl.setText("Choose an export format");

    const formats: Array<{ id: ExportFormat; label: string; description: string }> = [
      { id: "png", label: "PNG", description: "Export the rendered table as an image." },
      { id: "csv", label: "CSV", description: "Export table data as plain text for spreadsheets." },
      { id: "xlsx", label: "Excel", description: "Export table data as an .xlsx workbook." },
      { id: "pdf", label: "PDF", description: "Export the rendered table to a paginated PDF." }
    ];

    formats.forEach((format) => {
      new Setting(contentEl)
        .setName(format.label)
        .setDesc(format.description)
        .addButton((button) =>
          button.setButtonText("Export").setCta().onClick(() => {
            this.resolved = true;
            this.close();
            this.onChoose(format.id);
          })
        );
    });
  }

  onClose(): void {
    if (!this.resolved) {
      this.onChoose(null);
    }
    this.contentEl.empty();
  }
}

export class ExportOptionsModal extends Modal {
  private resolved = false;
  private options: ExportOptions;

  constructor(
    app: App,
    private readonly settings: TableExportSettings,
    format: ExportFormat,
    private readonly onChoose: (options: ExportOptions | null) => void
  ) {
    super(app);
    this.options = {
      format,
      visualStyle: settings.defaultVisualStyle,
      renderEngine: settings.defaultRenderEngine,
      imageScale: settings.imageScale,
      backgroundColor: settings.imageBackgroundColor,
      pdfPageSize: settings.pdfPageSize,
      pdfOrientation: settings.pdfOrientation,
      pdfMargin: settings.pdfMargin,
      postExportAction: settings.defaultPostExportAction,
      copyPngToClipboard: settings.defaultCopyPngToClipboard
    };
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;
    titleEl.setText(`Export ${this.options.format.toUpperCase()}`);
    contentEl.addClass("table-exporter-modal");

    if (this.options.format === "png" || this.options.format === "pdf") {
      new Setting(contentEl)
        .setName("Visual style")
        .setDesc("Clean export removes inline code styling and Obsidian-only highlights.")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("clean", "Clean export")
            .addOption("current", "Current rendered style")
            .setValue(this.options.visualStyle)
            .onChange((value) => {
              this.options.visualStyle = value as "clean" | "current";
            })
        );

      new Setting(contentEl)
        .setName("Render engine")
        .setDesc("Auto uses the SVG renderer for clean exports and DOM capture for current-style exports.")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("auto", "Auto (recommended)")
            .addOption("svg", "SVG table renderer")
            .addOption("dom", "DOM capture")
            .setValue(this.options.renderEngine)
            .onChange((value) => {
              this.options.renderEngine = value as "auto" | "svg" | "dom";
            })
        );

      new Setting(contentEl)
        .setName("Scale")
        .setDesc("Higher values produce sharper image-based exports.")
        .addSlider((slider) =>
          slider
            .setLimits(1, 4, 1)
            .setDynamicTooltip()
            .setValue(this.options.imageScale)
            .onChange((value) => {
              this.options.imageScale = value;
            })
        );

      new Setting(contentEl)
        .setName("Background")
        .setDesc("Background color for image-based exports.")
        .addText((text) =>
          text.setValue(this.options.backgroundColor).onChange((value) => {
            this.options.backgroundColor = value.trim() || this.settings.imageBackgroundColor;
          })
        );
    }

    if (this.options.format === "pdf") {
      new Setting(contentEl)
        .setName("Page size")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("a4", "A4")
            .addOption("letter", "Letter")
            .setValue(this.options.pdfPageSize)
            .onChange((value) => {
              this.options.pdfPageSize = value as "a4" | "letter";
            })
        );

      new Setting(contentEl)
        .setName("Orientation")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("landscape", "Landscape")
            .addOption("portrait", "Portrait")
            .setValue(this.options.pdfOrientation)
            .onChange((value) => {
              this.options.pdfOrientation = value as "portrait" | "landscape";
            })
        );

      new Setting(contentEl)
        .setName("Margin")
        .setDesc("Page margin in points.")
        .addSlider((slider) =>
          slider
            .setLimits(0, 48, 2)
            .setDynamicTooltip()
            .setValue(this.options.pdfMargin)
            .onChange((value) => {
              this.options.pdfMargin = value;
            })
        );
    }

    new Setting(contentEl)
      .setName("After export")
      .setDesc("Desktop-only convenience action after the file is saved.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("show-in-finder", "Show in Finder")
          .addOption("open-file", "Open file")
          .addOption("none", "Do nothing")
          .setValue(this.options.postExportAction)
          .onChange((value) => {
            this.options.postExportAction = value as "none" | "show-in-finder" | "open-file";
          })
      );

    if (this.options.format === "png") {
      new Setting(contentEl)
        .setName("Copy PNG to clipboard")
        .setDesc("Copies the exported PNG after saving it.")
        .addToggle((toggle) =>
          toggle.setValue(this.options.copyPngToClipboard).onChange((value) => {
            this.options.copyPngToClipboard = value;
          })
        );
    }

    const actions = contentEl.createDiv({ cls: "table-exporter-actions" });
    const exportButton = actions.createEl("button", { text: "Export" });
    exportButton.addClass("mod-cta");
    exportButton.addEventListener("click", () => {
      this.resolved = true;
      this.close();
      this.onChoose({ ...this.options });
    });
  }

  onClose(): void {
    if (!this.resolved) {
      this.onChoose(null);
    }
    this.contentEl.empty();
  }
}
