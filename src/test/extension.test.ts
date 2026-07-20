import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

suite("extension", () => {
  test("registers the sortJson command", async () => {
    const extension = vscode.extensions.all.find(
      (candidate) => candidate.packageJSON.name === "sort-json-context-menu",
    );
    assert.ok(extension, "extension under test was not found");
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("sort-json-context-menu.sortJson"));
  });

  test("sorts a JSON file end-to-end via the command", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sort-json-e2e-"));
    try {
      const filePath = path.join(tmpDir, "sample.json");
      await fs.writeFile(filePath, JSON.stringify({ b: 1, a: 2 }));

      await vscode.commands.executeCommand(
        "sort-json-context-menu.sortJson",
        vscode.Uri.file(filePath),
      );

      const written = await fs.readFile(filePath, "utf8");
      assert.strictEqual(written, JSON.stringify({ a: 2, b: 1 }, null, 2) + "\n");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("sorts every JSON file in a folder end-to-end via the command", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sort-json-folder-e2e-"));
    try {
      await fs.writeFile(path.join(tmpDir, "one.json"), JSON.stringify({ b: 1, a: 2 }));
      await fs.writeFile(path.join(tmpDir, "two.json"), JSON.stringify({ y: 1, x: 2 }));
      await fs.writeFile(path.join(tmpDir, "not-json.txt"), "ignore me");

      await vscode.commands.executeCommand(
        "sort-json-context-menu.sortJson",
        vscode.Uri.file(tmpDir),
      );

      const one = await fs.readFile(path.join(tmpDir, "one.json"), "utf8");
      const two = await fs.readFile(path.join(tmpDir, "two.json"), "utf8");
      assert.strictEqual(one, JSON.stringify({ a: 2, b: 1 }, null, 2) + "\n");
      assert.strictEqual(two, JSON.stringify({ x: 2, y: 1 }, null, 2) + "\n");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
