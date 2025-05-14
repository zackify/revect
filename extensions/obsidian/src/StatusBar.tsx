import type { App } from "obsidian";
import { indexToApi } from "./indexToApi";
import type { RevectSettings } from "./SettingsTab";
import { useState } from "react";

export const StatusBar = ({
  app,
  settings,
}: {
  app: App;
  settings: RevectSettings;
}) => {
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  return (
    <div>
      <input type="search" placeholder="Semantic search..."></input>
      <button
        onClick={async () => {
          setIsIndexing(true);
          const { vault } = app;
          const allFiles = vault.getMarkdownFiles();
          setTotal(allFiles.length);
          try {
            for (const [index, file] of Object.entries(allFiles)) {
              setProgress(parseInt(index) + 1);
              const text = await vault.read(file);

              await indexToApi({
                text,
                settings,
                external_id: file.path,
              });
            }
          } catch (e) {}
          setIsIndexing(false);
        }}
      >
        {isIndexing ? `Indexing ${progress}/${total}` : "Reindex Vault"}
      </button>
    </div>
  );
};
