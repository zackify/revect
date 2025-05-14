import { App, PluginSettingTab, Setting } from "obsidian";
import RevectPlugin from "./main";

export interface RevectSettings {
  apiUrl: string;
  apiSecret: string;
}

export const DEFAULT_SETTINGS: RevectSettings = {
  apiUrl: "",
  apiSecret: "",
};

export class SettingsTab extends PluginSettingTab {
  plugin: RevectPlugin;

  constructor(app: App, plugin: RevectPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    const span = containerEl.createSpan();
    const span2 = containerEl.createSpan();

    new Setting(span)
      .setName("revect.io URL")
      .setDesc("defaults to our cloud endpoint")
      .addText((text) =>
        text
          .setPlaceholder("Enter your api url")
          .setValue(this.plugin.settings.apiUrl)
          .onChange(async (value) => {
            this.plugin.settings.apiUrl = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(span2)
      .setName("Access token")
      .setDesc("your access token from revect.io")
      .addText((text) =>
        text
          .setPlaceholder("Enter your access token")
          .setValue(this.plugin.settings.apiSecret)
          .onChange(async (value) => {
            this.plugin.settings.apiSecret = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
