import test from "node:test";
import assert from "node:assert/strict";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { LocalSnapshotStore } from "@survival/infrastructure";

test("local snapshot store writes and restores bytes", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "survival-snap-"));
  const store = new LocalSnapshotStore(dir);
  const payload = Buffer.from("world-state-v1");
  const meta = await store.writeSnapshot({
    worldId: "world-persistent-01",
    instanceId: "local-ds-01",
    version: 1,
    data: payload,
  });

  assert.equal(meta.version, 1);
  assert.ok(meta.checksum.length === 64);

  const restored = await store.readSnapshot(meta.snapshotId);
  assert.equal(restored.toString("utf8"), "world-state-v1");
});
