import test from "node:test";
import assert from "node:assert/strict";
import { AUTHORITY_MATRIX } from "@survival/shared-types";

test("authority matrix covers required survival operations", () => {
  const ops = AUTHORITY_MATRIX.map((r) => r.operation);
  assert.ok(ops.includes("movement_prediction"));
  assert.ok(ops.includes("damage_death_loot_final"));
  assert.ok(ops.includes("persistent_inventory_economy"));
  assert.equal(
    AUTHORITY_MATRIX.find((r) => r.operation === "damage_death_loot_final")
      ?.category,
    3
  );
});
