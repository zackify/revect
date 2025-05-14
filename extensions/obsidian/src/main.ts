import { debounce, Plugin, setIcon } from "obsidian";
import {
  DEFAULT_SETTINGS,
  SettingsTab,
  type RevectSettings,
} from "./SettingsTab";
import { StatusBarModal } from "./StatusBarModal";
import { indexToApi } from "./indexToApi";
import type { Props } from "./indexToApi";

const debouncedIndexToApi = debounce(
  async (props: Props, icon: HTMLElement) => {
    setIcon(icon, "loader");
    icon.setCssStyles({
      animation: "spin 2s linear infinite",
    });

    try {
      await indexToApi(props);
      setIcon(icon, "circle-check");
      setTimeout(() => icon.setText(""), 2000);
    } catch (e) {
      //TODO persist to show in modal
      console.error(e);
      setIcon(icon, "mail-warning");
    }
    icon.setCssStyles({
      animation: null,
    });
  },
  5000
);

export default class RevectPlugin extends Plugin {
  //@ts-ignore
  settings: RevectSettings;

  async onload() {
    await this.loadSettings();

    // --- Setup Status Bar Item ---
    const status = this.addStatusBarItem();
    const statusText = status.createSpan(); // Create a span for the icon
    const icon = status.createSpan(); // Create a span for the icon

    statusText.setCssStyles({ marginRight: "2px" });
    statusText.setText("revect.io"); // Append text next to the icon (note the leading space)

    // Update the click event to open the modal
    status.onClickEvent(() => {
      new StatusBarModal(this.app, this.settings).open();
    });

    // embed on change
    this.app.workspace.on("editor-change", async (editor, view) => {
      const text = editor.getValue();

      if (!view.file) return;

      await debouncedIndexToApi(
        {
          text,
          settings: this.settings,
          external_id: view.file?.path,
        },
        icon
      );
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SettingsTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
