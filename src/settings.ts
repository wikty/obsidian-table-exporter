import { App, PluginSettingTab, Setting } from "obsidian";
import type TableExporterPlugin from "./main";
import type { TableExportSettings } from "./types";

export const DEFAULT_SETTINGS: TableExportSettings = {
  exportFolder: "Table Exports",
  imageScale: 2,
  imageBackgroundColor: "#ffffff",
  pdfPageSize: "a4",
  pdfOrientation: "landscape",
  pdfMargin: 20,
  pngFilenameTemplate: "{{note}}-table-{{index}}",
  csvDelimiter: ",",
  defaultVisualStyle: "clean",
  defaultRenderEngine: "auto",
  defaultPostExportAction: "show-in-finder",
  defaultCopyPngToClipboard: false
};

export class TableExporterSettingTab extends PluginSettingTab {
  plugin: TableExporterPlugin;

  constructor(app: App, plugin: TableExporterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Table Exporter" });

    new Setting(containerEl)
      .setName("Export folder")
      .setDesc("Vault folder where exported files are saved.")
      .addText((text) =>
        text
          .setPlaceholder("Table Exports")
          .setValue(this.plugin.settings.exportFolder)
          .onChange(async (value) => {
            this.plugin.settings.exportFolder = value.trim() || DEFAULT_SETTINGS.exportFolder;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Image scale")
      .setDesc("Higher values produce sharper PNG and PDF exports.")
      .addSlider((slider) =>
        slider
          .setLimits(1, 4, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.imageScale)
          .onChange(async (value) => {
            this.plugin.settings.imageScale = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Image background")
      .setDesc("Background color used for PNG and PDF exports.")
      .addText((text) =>
        text.setValue(this.plugin.settings.imageBackgroundColor).onChange(async (value) => {
          this.plugin.settings.imageBackgroundColor = value.trim() || DEFAULT_SETTINGS.imageBackgroundColor;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("PNG filename template")
      .setDesc("Supports {{note}} and {{index}} placeholders.")
      .addText((text) =>
        text.setValue(this.plugin.settings.pngFilenameTemplate).onChange(async (value) => {
          this.plugin.settings.pngFilenameTemplate = value.trim() || DEFAULT_SETTINGS.pngFilenameTemplate;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Default visual style")
      .setDesc("Clean export removes inline code styling and Obsidian-only highlights.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("clean", "Clean export")
          .addOption("current", "Current rendered style")
          .setValue(this.plugin.settings.defaultVisualStyle)
          .onChange(async (value) => {
            this.plugin.settings.defaultVisualStyle = value as "clean" | "current";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default render engine")
      .setDesc("Auto uses the SVG renderer for clean exports and DOM capture for current-style exports.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", "Auto (recommended)")
          .addOption("svg", "SVG table renderer")
          .addOption("dom", "DOM capture")
          .setValue(this.plugin.settings.defaultRenderEngine)
          .onChange(async (value) => {
            this.plugin.settings.defaultRenderEngine = value as "auto" | "svg" | "dom";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("After export")
      .setDesc("Choose what happens after a file is saved on desktop.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("show-in-finder", "Show in Finder")
          .addOption("open-file", "Open file")
          .addOption("none", "Do nothing")
          .setValue(this.plugin.settings.defaultPostExportAction)
          .onChange(async (value) => {
            this.plugin.settings.defaultPostExportAction = value as "none" | "show-in-finder" | "open-file";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Copy PNG to clipboard by default")
      .setDesc("Applies to PNG exports when you keep the default in the export dialog.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.defaultCopyPngToClipboard).onChange(async (value) => {
          this.plugin.settings.defaultCopyPngToClipboard = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("CSV delimiter")
      .setDesc("Choose the separator used for CSV export.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption(",", "Comma")
          .addOption(";", "Semicolon")
          .addOption("\t", "Tab")
          .setValue(this.plugin.settings.csvDelimiter)
          .onChange(async (value) => {
            this.plugin.settings.csvDelimiter = value as "," | ";" | "\t";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("PDF page size")
      .setDesc("Used when splitting long tables across pages.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("a4", "A4")
          .addOption("letter", "Letter")
          .setValue(this.plugin.settings.pdfPageSize)
          .onChange(async (value) => {
            this.plugin.settings.pdfPageSize = value as "a4" | "letter";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("PDF orientation")
      .setDesc("Landscape is usually better for wide tables.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("landscape", "Landscape")
          .addOption("portrait", "Portrait")
          .setValue(this.plugin.settings.pdfOrientation)
          .onChange(async (value) => {
            this.plugin.settings.pdfOrientation = value as "portrait" | "landscape";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("PDF margin")
      .setDesc("Default page margin in points for PDF export.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 48, 2)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.pdfMargin)
          .onChange(async (value) => {
            this.plugin.settings.pdfMargin = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
