import * as vscode from "vscode";
import { sortJsonFile, sortJsonFilesInFolder } from "./fileSorter";

async function sortJsonFolder(uri: vscode.Uri): Promise<void> {
  const entries = await vscode.workspace.fs.readDirectory(uri);
  const jsonFileNames = entries
    .filter(([name, type]) => type === vscode.FileType.File && name.toLowerCase().endsWith(".json"))
    .map(([name]) => name);

  if (jsonFileNames.length === 0) {
    vscode.window.showInformationMessage("No JSON files found in the selected folder.");
    return;
  }

  const { sortedCount, failedFiles } = await sortJsonFilesInFolder(uri, jsonFileNames);

  if (failedFiles.length === 0) {
    vscode.window.showInformationMessage(`${sortedCount} JSON file(s) sorted successfully.`);
    return;
  }

  vscode.window.showWarningMessage(
    `Sorted ${sortedCount} JSON file(s). Failed: ${failedFiles.join(", ")}`,
  );
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "sort-json-context-menu.sortJson",
    async (uri: vscode.Uri) => {
      try {
        const stat = await vscode.workspace.fs.stat(uri);

        if ((stat.type & vscode.FileType.Directory) === vscode.FileType.Directory) {
          await sortJsonFolder(uri);
          return;
        }

        await sortJsonFile(uri);
        vscode.window.showInformationMessage("JSON sorted successfully.");
      } catch {
        vscode.window.showErrorMessage("Failed to sort JSON file.");
      }
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
