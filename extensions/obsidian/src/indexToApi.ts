import { debounce } from "obsidian";
import type { RevectSettings } from "./SettingsTab";

export type Props = {
  settings: RevectSettings;
  text: string;
  external_id: string;
};
export const indexToApi = async ({ settings, text, external_id }: Props) => {
  const res = await fetch(`${settings.apiUrl}/index`, {
    method: "POST",
    body: JSON.stringify({
      text,
      external_id,
      metadata: {
        source: "obsidian",
      },
    }),
    headers: {
      Authorization: settings.apiSecret, // Include the token in the 'Authorization' header
      "Content-Type": "application/json",
    },
  });
  const json = await res.json();
  console.log(json);
  return json;
};
