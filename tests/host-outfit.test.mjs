import assert from "node:assert/strict";
import test from "node:test";
import { hostOutfit } from "../src/lib/hostAvatar.js";

test("Kiyosa wears her summer outfit only from June through August", () => {
  for (const [month, day, expected] of [[4, 31, "default"], [5, 1, "summer"], [6, 2, "summer"], [7, 31, "summer"], [8, 1, "default"], [11, 25, "default"]]) {
    assert.equal(hostOutfit("kiyosa", { date: new Date(2026, month, day, 12) }), expected);
  }
  assert.equal(hostOutfit("komoe", { date: new Date(2026, 6, 1) }), "default");
});
