/**
 * Local restore drill against a running API.
 * Usage: npx ts-node src/scripts/restore-drill.ts
 */
import { config } from "../config";

async function main(): Promise<void> {
  const base = `http://127.0.0.1:${config.apiPort}`;
  const headers = {
    "content-type": "application/json",
    "x-internal-token": config.internalServiceToken,
  };

  const checkpointRes = await fetch(`${base}/internal/world/checkpoint`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      dirtyActorCount: 1,
      dataBase64: Buffer.from("restore-drill-payload").toString("base64"),
    }),
  });
  const checkpoint = await checkpointRes.json();
  if (!checkpointRes.ok) {
    throw new Error(`checkpoint failed: ${JSON.stringify(checkpoint)}`);
  }

  const restoreRes = await fetch(`${base}/internal/world/restore-latest`, {
    method: "GET",
    headers,
  });
  const restore = await restoreRes.json();
  if (!restoreRes.ok || !restore.dataBase64) {
    throw new Error(`restore failed: ${JSON.stringify(restore)}`);
  }

  const decoded = Buffer.from(restore.dataBase64, "base64").toString("utf8");
  if (decoded !== "restore-drill-payload") {
    throw new Error(`payload mismatch: ${decoded}`);
  }

  console.log("Restore drill OK", {
    snapshotId: restore.metadata?.snapshotId,
    version: restore.metadata?.version,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
