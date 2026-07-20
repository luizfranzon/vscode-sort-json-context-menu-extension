export function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    const length = value.length;
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = sortObject(value[i]);
    }
    return result;
  }

  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const keys = Object.keys(source).sort();
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      result[key] = sortObject(source[key]);
    }
    return result;
  }

  return value;
}
