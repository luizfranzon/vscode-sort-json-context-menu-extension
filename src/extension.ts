import * as vscode from "vscode";

function sortObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }

  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc: any, key) => {
        acc[key] = sortObject(obj[key]);
        return acc;
      }, {});
  }

  return obj;
}

async function sortJsonFile(uri: vscode.Uri): Promise<void> {
  const bytes = await vscode.workspace.fs.readFile(uri);
  const text = Buffer.from(bytes).toString("utf8");

  const json = JSON.parse(text);
  const sorted = sortObject(json);

  const formatted = JSON.stringify(sorted, null, 2) + "\n";
  await vscode.workspace.fs.writeFile(uri, Buffer.from(formatted, "utf8"));
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "sort-json-context-menu.sortJson",
    async (uri: vscode.Uri) => {
      try {
        const stat = await vscode.workspace.fs.stat(uri);

        if ((stat.type & vscode.FileType.Directory) === vscode.FileType.Directory) {
          const entries = await vscode.workspace.fs.readDirectory(uri);
          const jsonFiles = entries.filter(
            ([name, type]) =>
              type === vscode.FileType.File && name.toLowerCase().endsWith(".json"),
          );

          if (jsonFiles.length === 0) {
            vscode.window.showInformationMessage(
              "No JSON files found in the selected folder.",
            );
            return;
          }

          let sortedCount = 0;
          const failedFiles: string[] = [];

          for (const [name] of jsonFiles) {
            const fileUri = vscode.Uri.joinPath(uri, name);
            try {
              await sortJsonFile(fileUri);
              sortedCount += 1;
            } catch {
              failedFiles.push(name);
            }
          }

          if (failedFiles.length === 0) {
            vscode.window.showInformationMessage(
              `${sortedCount} JSON file(s) sorted successfully.`,
            );
            return;
          }

          vscode.window.showWarningMessage(
            `Sorted ${sortedCount} JSON file(s). Failed: ${failedFiles.join(", ")}`,
          );
          return;
        }

        await sortJsonFile(uri);
        vscode.window.showInformationMessage("JSON sorted successfully.");
      } catch (err) {
        vscode.window.showErrorMessage("Failed to sort JSON file.");
      }
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
