import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("joins headers and rows with semicolons", () => {
    const csv = toCsv(["a", "b"], [["1", "2"]]);
    expect(csv).toBe("a;b\r\n1;2");
  });

  it("escapes quotes, separators and newlines", () => {
    const csv = toCsv(["name"], [['Corte "premium"; especial']]);
    expect(csv).toBe('name\r\n"Corte ""premium""; especial"');
  });

  it("handles null/undefined as empty", () => {
    const csv = toCsv(["a", "b"], [[null, undefined]]);
    expect(csv).toBe("a;b\r\n;");
  });
});
