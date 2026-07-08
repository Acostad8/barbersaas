import { describe, expect, it } from "vitest";
import { createTenantSchema, slugify } from "@/features/tenants/schemas";

describe("createTenantSchema", () => {
  it("accepts valid input", () => {
    const result = createTenantSchema.safeParse({
      name: "Barbería El Clásico",
      slug: "barberia-el-clasico",
    });
    expect(result.success).toBe(true);
  });

  it("rejects slug with uppercase", () => {
    expect(
      createTenantSchema.safeParse({ name: "Test", slug: "Mi-Barberia" })
        .success,
    ).toBe(false);
  });

  it("rejects slug with leading/trailing hyphen", () => {
    expect(
      createTenantSchema.safeParse({ name: "Test", slug: "-barberia" }).success,
    ).toBe(false);
    expect(
      createTenantSchema.safeParse({ name: "Test", slug: "barberia-" }).success,
    ).toBe(false);
  });

  it("rejects slug with consecutive hyphens", () => {
    expect(
      createTenantSchema.safeParse({ name: "Test", slug: "mi--barberia" })
        .success,
    ).toBe(false);
  });

  it("rejects too-short name", () => {
    expect(
      createTenantSchema.safeParse({ name: "X", slug: "valido" }).success,
    ).toBe(false);
  });
});

describe("slugify", () => {
  it("converts accents and spaces", () => {
    expect(slugify("Barbería El Clásico")).toBe("barberia-el-clasico");
  });

  it("handles ñ", () => {
    expect(slugify("Peluquería Ñoño")).toBe("peluqueria-nono");
  });

  it("strips symbols", () => {
    expect(slugify("Corte & Estilo!!")).toBe("corte-estilo");
  });

  it("trims hyphens", () => {
    expect(slugify("  --Mi Barbería--  ")).toBe("mi-barberia");
  });

  it("produces schema-valid slugs", () => {
    const samples = ["Barbería Ñandú", "  A&B Cortes  ", "El Mejor Corte 24/7"];
    for (const s of samples) {
      const slug = slugify(s);
      expect(
        createTenantSchema.safeParse({ name: s, slug }).success,
        `slug inválido: ${slug}`,
      ).toBe(true);
    }
  });
});
