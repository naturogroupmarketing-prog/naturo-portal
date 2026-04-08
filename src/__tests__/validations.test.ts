import { describe, it, expect } from "vitest";
import {
  createAssetSchema,
  assignAssetSchema,
  createConsumableSchema,
  addStockSchema,
  createUserSchema,
  reportDamageSchema,
  requestConsumableSchema,
  approvePOSchema,
} from "@/lib/validations";

describe("Asset Validations", () => {
  it("rejects empty asset name", () => {
    const result = createAssetSchema.safeParse({ name: "", category: "Vacuum", regionId: "cm2a7y7rk7k4yy1zfez76vczfm" });
    expect(result.success).toBe(false);
  });

  it("accepts valid asset", () => {
    const result = createAssetSchema.safeParse({
      name: "PacVac Superpro 700",
      category: "Vacuum",
      regionId: "cm2a7y7rk7k4yy1zfez76vczfm",
      isHighValue: "false",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid region ID", () => {
    const result = createAssetSchema.safeParse({ name: "Test", category: "Cat", regionId: "bad" });
    expect(result.success).toBe(false);
  });

  it("handles optional purchaseCost", () => {
    const withCost = createAssetSchema.safeParse({
      name: "Mop",
      category: "Cleaning",
      regionId: "cm2a7y7rk7k4yy1zfez76vczfm",
      isHighValue: "false",
      purchaseCost: "49.95",
    });
    expect(withCost.success).toBe(true);

    const withoutCost = createAssetSchema.safeParse({
      name: "Mop",
      category: "Cleaning",
      regionId: "cm2a7y7rk7k4yy1zfez76vczfm",
      isHighValue: "false",
    });
    expect(withoutCost.success).toBe(true);
  });
});

describe("Assign Asset Validations", () => {
  it("rejects missing userId", () => {
    const result = assignAssetSchema.safeParse({
      assetId: "cm2a7y7rk7k4yy1zfez76vczfm",
      assignmentType: "PERMANENT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid assignment type", () => {
    const result = assignAssetSchema.safeParse({
      assetId: "cm2a7y7rk7k4yy1zfez76vczfm",
      userId: "cm2a7y7rk7k4yy1zfez76vczfm",
      assignmentType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid assignment", () => {
    const result = assignAssetSchema.safeParse({
      assetId: "cm2a7y7rk7k4yy1zfez76vczfm",
      userId: "cm2a7y7rk7k4yy1zfez76vczfm",
      assignmentType: "TEMPORARY",
    });
    expect(result.success).toBe(true);
  });
});

describe("Consumable Validations", () => {
  it("rejects negative quantity", () => {
    const result = createConsumableSchema.safeParse({
      name: "Mop Heads",
      category: "Cleaning",
      unitType: "Pack",
      quantityOnHand: -5,
      regionId: "cm2a7y7rk7k4yy1zfez76vczfm",
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero stock", () => {
    const result = createConsumableSchema.safeParse({
      name: "Mop Heads",
      category: "Cleaning",
      unitType: "Pack",
      quantityOnHand: 0,
      minimumThreshold: 5,
      reorderLevel: 10,
      regionId: "cm2a7y7rk7k4yy1zfez76vczfm",
    });
    expect(result.success).toBe(true);
  });

  it("validates add stock requires positive quantity", () => {
    expect(addStockSchema.safeParse({ consumableId: "cm2a7y7rk7k4yy1zfez76vczfm", quantity: 0 }).success).toBe(false);
    expect(addStockSchema.safeParse({ consumableId: "cm2a7y7rk7k4yy1zfez76vczfm", quantity: -1 }).success).toBe(false);
    expect(addStockSchema.safeParse({ consumableId: "cm2a7y7rk7k4yy1zfez76vczfm", quantity: 5 }).success).toBe(true);
  });
});

describe("User Validations", () => {
  it("rejects short password", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "Test User",
      role: "STAFF",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createUserSchema.safeParse({
      email: "notanemail",
      name: "Test",
      role: "STAFF",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "Test",
      role: "ADMIN",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid user", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "Test User",
      role: "STAFF",
      password: "Password123",
    });
    expect(result.success).toBe(true);
  });
});

describe("Damage Report Validations", () => {
  it("rejects invalid type", () => {
    const result = reportDamageSchema.safeParse({
      assetId: "cm2a7y7rk7k4yy1zfez76vczfm",
      type: "BROKEN",
      description: "Screen cracked",
    });
    expect(result.success).toBe(false);
  });

  it("accepts DAMAGE type", () => {
    const result = reportDamageSchema.safeParse({
      assetId: "cm2a7y7rk7k4yy1zfez76vczfm",
      type: "DAMAGE",
      description: "Screen cracked",
    });
    expect(result.success).toBe(true);
  });

  it("accepts LOSS type", () => {
    const result = reportDamageSchema.safeParse({
      assetId: "cm2a7y7rk7k4yy1zfez76vczfm",
      type: "LOSS",
      description: "Left at client site",
    });
    expect(result.success).toBe(true);
  });
});

describe("Request & PO Validations", () => {
  it("validates consumable request", () => {
    expect(requestConsumableSchema.safeParse({ consumableId: "cm2a7y7rk7k4yy1zfez76vczfm", quantity: 0 }).success).toBe(false);
    expect(requestConsumableSchema.safeParse({ consumableId: "cm2a7y7rk7k4yy1zfez76vczfm", quantity: 5 }).success).toBe(true);
  });

  it("validates PO approval action", () => {
    expect(approvePOSchema.safeParse({ purchaseOrderId: "cm2a7y7rk7k4yy1zfez76vczfm", action: "approve" }).success).toBe(true);
    expect(approvePOSchema.safeParse({ purchaseOrderId: "cm2a7y7rk7k4yy1zfez76vczfm", action: "reject" }).success).toBe(true);
    expect(approvePOSchema.safeParse({ purchaseOrderId: "cm2a7y7rk7k4yy1zfez76vczfm", action: "delete" }).success).toBe(false);
  });
});
