import * as assert from "node:assert";
import { sortObject } from "../jsonSorter";

suite("sortObject", () => {
  test("sorts the keys of a flat object alphabetically", () => {
    const result = sortObject({ b: 1, a: 2, c: 3 });
    assert.deepStrictEqual(Object.keys(result as object), ["a", "b", "c"]);
  });

  test("sorts nested objects recursively", () => {
    const result = sortObject({ b: { d: 1, c: 2 }, a: 1 }) as Record<string, unknown>;
    assert.deepStrictEqual(Object.keys(result), ["a", "b"]);
    assert.deepStrictEqual(Object.keys(result.b as object), ["c", "d"]);
  });

  test("sorts objects nested inside arrays without reordering the array itself", () => {
    const result = sortObject([{ b: 1, a: 2 }, { z: 1, y: 2 }]) as Record<string, unknown>[];
    assert.deepStrictEqual(Object.keys(result[0]), ["a", "b"]);
    assert.deepStrictEqual(Object.keys(result[1]), ["y", "z"]);
  });

  test("leaves primitive values untouched", () => {
    assert.strictEqual(sortObject("hello"), "hello");
    assert.strictEqual(sortObject(42), 42);
    assert.strictEqual(sortObject(true), true);
    assert.strictEqual(sortObject(null), null);
  });

  test("handles empty objects and arrays", () => {
    assert.deepStrictEqual(sortObject({}), {});
    assert.deepStrictEqual(sortObject([]), []);
  });

  test("does not mutate the input", () => {
    const input = { b: 1, a: 2 };
    sortObject(input);
    assert.deepStrictEqual(Object.keys(input), ["b", "a"]);
  });
});
