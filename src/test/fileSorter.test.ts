import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";
import { sortJsonFile, sortJsonFilesInFolder } from "../fileSorter";

async function makeTmpDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

suite("sortJsonFile", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await makeTmpDir("sort-json-file-test-");
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("rewrites the file with sorted keys and a trailing newline", async () => {
    const filePath = path.join(tmpDir, "sample.json");
    await fs.writeFile(filePath, JSON.stringify({ b: 1, a: { d: 2, c: 3 } }));

    await sortJsonFile(vscode.Uri.file(filePath));

    const written = await fs.readFile(filePath, "utf8");
    assert.strictEqual(written, JSON.stringify({ a: { c: 3, d: 2 }, b: 1 }, null, 2) + "\n");
  });

  test("rejects when the file is not valid JSON", async () => {
    const filePath = path.join(tmpDir, "broken.json");
    await fs.writeFile(filePath, "{ not valid json");

    await assert.rejects(() => sortJsonFile(vscode.Uri.file(filePath)));
  });
});

suite("sortJsonFilesInFolder", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await makeTmpDir("sort-json-folder-test-");
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("sorts every valid file and reports failures without stopping", async () => {
    const validNames = Array.from({ length: 5 }, (_, i) => `file-${i}.json`);
    for (const name of validNames) {
      await fs.writeFile(path.join(tmpDir, name), JSON.stringify({ z: 1, a: 2 }));
    }
    await fs.writeFile(path.join(tmpDir, "broken.json"), "not json");

    const result = await sortJsonFilesInFolder(vscode.Uri.file(tmpDir), [
      ...validNames,
      "broken.json",
    ]);

    assert.strictEqual(result.sortedCount, 5);
    assert.deepStrictEqual(result.failedFiles, ["broken.json"]);

    for (const name of validNames) {
      const written = await fs.readFile(path.join(tmpDir, name), "utf8");
      assert.strictEqual(written, JSON.stringify({ a: 2, z: 1 }, null, 2) + "\n");
    }
  });

  test("processes every file even when there are more files than concurrent workers", async () => {
    const fileNames = Array.from({ length: 20 }, (_, i) => `bulk-${i}.json`);
    for (const name of fileNames) {
      await fs.writeFile(path.join(tmpDir, name), JSON.stringify({ z: 1, a: 2 }));
    }

    const result = await sortJsonFilesInFolder(vscode.Uri.file(tmpDir), fileNames);

    assert.strictEqual(result.sortedCount, 20);
    assert.deepStrictEqual(result.failedFiles, []);
  });
});
