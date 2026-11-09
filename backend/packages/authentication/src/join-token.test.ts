import test from "node:test";
import assert from "node:assert/strict";
import {
  createJoinTokenPayload,
  encodeJoinToken,
  decodeJoinToken,
} from "./index";

test("join token roundtrip", () => {
  const secret = "test-secret-min-32-characters-long";
  const payload = createJoinTokenPayload({
    accountId: "11111111-1111-1111-1111-111111111111",
    characterId: "22222222-2222-2222-2222-222222222222",
    worldId: "world-persistent-01",
    instanceId: "local-ds-01",
    ttlSeconds: 60,
  });
  const token = encodeJoinToken(payload, secret);
  const decoded = decodeJoinToken(token, secret);
  assert.equal(decoded.tokenId, payload.tokenId);
  assert.equal(decoded.characterId, payload.characterId);
  assert.equal(decoded.instanceId, "local-ds-01");
});
