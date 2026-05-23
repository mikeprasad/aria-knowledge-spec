import { describe, it, expect } from "vitest";
import { validateCore } from "../src/validate.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  resolve(__dirname, "..", "fixtures", name);

describe("validateCore", () => {
  it("accepts a minimal valid Core", async () => {
    const result = await validateCore(fixture("valid-minimal-core"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a manifest missing required fields", async () => {
    const result = await validateCore(fixture("invalid-bad-manifest"));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes("license"))).toBe(true);
  });
});
