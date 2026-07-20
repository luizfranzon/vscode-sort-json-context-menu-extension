import * as vscode from "vscode";
import { sortObject } from "./jsonSorter";

const FOLDER_CONCURRENCY_LIMIT = 8;

export interface FolderSortResult {
  sortedCount: number;
  failedFiles: string[];
}

export async function sortJsonFile(uri: vscode.Uri): Promise<void> {
  const bytes = await vscode.workspace.fs.readFile(uri);
  const text = Buffer.from(bytes).toString("utf8");

  const json = JSON.parse(text);
  const sorted = sortObject(json);

  const formatted = JSON.stringify(sorted, null, 2) + "\n";
  await vscode.workspace.fs.writeFile(uri, Buffer.from(formatted, "utf8"));
}

export async function sortJsonFilesInFolder(
  folderUri: vscode.Uri,
  fileNames: string[],
): Promise<FolderSortResult> {
  const failedFiles: string[] = [];
  let sortedCount = 0;
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < fileNames.length) {
      const name = fileNames[nextIndex++];
      try {
        await sortJsonFile(vscode.Uri.joinPath(folderUri, name));
        sortedCount += 1;
      } catch {
        failedFiles.push(name);
      }
    }
  }

  const workerCount = Math.min(FOLDER_CONCURRENCY_LIMIT, fileNames.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return { sortedCount, failedFiles };
}
