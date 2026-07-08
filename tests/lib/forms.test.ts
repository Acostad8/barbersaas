import { describe, expect, it } from "vitest";
import { emptyToNull } from "@/lib/forms";

describe("emptyToNull", () => {
  it("returns null for empty and whitespace", () => {
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull("   ")).toBeNull();
  });

  it("trims and returns value", () => {
    expect(emptyToNull("  hola  ")).toBe("hola");
  });
});
