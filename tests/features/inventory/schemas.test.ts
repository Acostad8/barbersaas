import { describe, expect, it } from "vitest";
import {
  movementFormSchema,
  productFormSchema,
} from "@/features/inventory/schemas";

const productBase = {
  name: "Cera para cabello",
  sku: "",
  brand: "",
  description: "",
  unit: "unidad",
  categoryId: "",
  supplierId: "",
  cost: "",
  price: "",
  minStock: "",
};

describe("productFormSchema", () => {
  it("accepts minimal product", () => {
    expect(productFormSchema.safeParse(productBase).success).toBe(true);
  });

  it("accepts numeric fields", () => {
    expect(
      productFormSchema.safeParse({
        ...productBase,
        cost: "8000",
        price: "15000.50",
        minStock: "5",
      }).success,
    ).toBe(true);
  });

  it("rejects negative cost", () => {
    expect(
      productFormSchema.safeParse({ ...productBase, cost: "-1" }).success,
    ).toBe(false);
  });

  it("rejects empty unit", () => {
    expect(
      productFormSchema.safeParse({ ...productBase, unit: "" }).success,
    ).toBe(false);
  });
});

const movementBase = {
  productId: "p1",
  branchId: "",
  movementType: "purchase",
  quantity: "10",
  unitCost: "",
  note: "",
};

describe("movementFormSchema", () => {
  it("accepts valid movement", () => {
    expect(movementFormSchema.safeParse(movementBase).success).toBe(true);
  });

  it("rejects zero or negative quantity", () => {
    expect(
      movementFormSchema.safeParse({ ...movementBase, quantity: "0" }).success,
    ).toBe(false);
    expect(
      movementFormSchema.safeParse({ ...movementBase, quantity: "-2" })
        .success,
    ).toBe(false);
  });

  it("rejects unknown movement type", () => {
    expect(
      movementFormSchema.safeParse({ ...movementBase, movementType: "steal" })
        .success,
    ).toBe(false);
  });

  it("rejects missing product", () => {
    expect(
      movementFormSchema.safeParse({ ...movementBase, productId: "" })
        .success,
    ).toBe(false);
  });
});
