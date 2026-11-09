import type Redis from "ioredis";
import type { Database } from "@survival/database";
import { LocalSnapshotStore, type AppConfig } from "@survival/infrastructure";
import {
  createGameEvent,
  publishGameEvent,
  setWorldHealth,
  getWorldHealth,
} from "@survival/events";
import type {
  WorldCheckpointPayload,
  WorldSnapshotMetadata,
  WorldStatus,
} from "@survival/shared-types";

export class WorldManager {
  private readonly snapshots: LocalSnapshotStore;
  private latestVersion = 0;

  constructor(
    private readonly redis: Redis,
    private readonly db: Database,
    private readonly config: AppConfig
  ) {
    this.snapshots = new LocalSnapshotStore(config.snapshotDir);
  }

  async bootstrap(): Promise<void> {
    await this.snapshots.ensureRoot();
    const latest = await this.db.collections.snapshots
      .find({ worldId: this.config.worldId })
      .sort({ version: -1 })
      .limit(1)
      .next();
    this.latestVersion = latest?.version ?? 0;

    await setWorldHealth(this.redis, {
      worldId: this.config.worldId,
      instanceId: this.config.worldInstanceId,
      status: "online",
      playerCount: 0,
      maxPlayers: this.config.maxPlayers,
      updatedAt: new Date().toISOString(),
    });
  }

  async heartbeat(input: {
    playerCount: number;
    status?: WorldStatus;
  }): Promise<void> {
    await setWorldHealth(this.redis, {
      worldId: this.config.worldId,
      instanceId: this.config.worldInstanceId,
      status: input.status ?? "online",
      playerCount: input.playerCount,
      maxPlayers: this.config.maxPlayers,
      updatedAt: new Date().toISOString(),
    });
  }

  async getStatus() {
    return (
      (await getWorldHealth(this.redis)) ?? {
        worldId: this.config.worldId,
        instanceId: this.config.worldInstanceId,
        status: "offline",
        playerCount: 0,
        maxPlayers: this.config.maxPlayers,
        updatedAt: new Date().toISOString(),
      }
    );
  }

  async createCheckpoint(input: {
    data: Buffer;
    dirtyActorCount: number;
    parentSnapshotId?: string;
  }): Promise<WorldSnapshotMetadata> {
    this.latestVersion += 1;
    const meta = await this.snapshots.writeSnapshot({
      worldId: this.config.worldId,
      instanceId: this.config.worldInstanceId,
      version: this.latestVersion,
      data: input.data,
      parentSnapshotId: input.parentSnapshotId,
    });

    await this.db.collections.snapshots.insertOne({
      _id: meta.snapshotId,
      ...meta,
    });

    const payload: WorldCheckpointPayload = {
      snapshotId: meta.snapshotId,
      version: meta.version,
      storageUri: meta.storageUri,
      byteSize: meta.byteSize,
      dirtyActorCount: input.dirtyActorCount,
    };

    const event = createGameEvent({
      type: "world.checkpoint",
      worldId: this.config.worldId,
      instanceId: this.config.worldInstanceId,
      payload,
      idempotencyKey: `checkpoint:${meta.snapshotId}`,
    });

    await publishGameEvent(this.redis, event);
    await this.db.collections.eventLog.insertOne({
      _id: event.eventId,
      type: event.type,
      worldId: event.worldId,
      instanceId: event.instanceId,
      occurredAt: event.occurredAt,
      payload: event.payload,
      idempotencyKey: event.idempotencyKey,
      createdAt: new Date().toISOString(),
    });

    return meta;
  }

  async restoreLatest(): Promise<{
    metadata: WorldSnapshotMetadata | null;
    data: Buffer | null;
  }> {
    const latest = await this.db.collections.snapshots
      .find({ worldId: this.config.worldId })
      .sort({ version: -1 })
      .limit(1)
      .next();

    if (!latest) {
      return { metadata: null, data: null };
    }

    const { _id, ...metadata } = latest;
    const data = await this.snapshots.readSnapshot(metadata.snapshotId);
    return { metadata, data };
  }

  async listSnapshots(limit = 20): Promise<WorldSnapshotMetadata[]> {
    const docs = await this.db.collections.snapshots
      .find({ worldId: this.config.worldId })
      .sort({ version: -1 })
      .limit(limit)
      .toArray();
    return docs.map(({ _id, ...rest }) => rest);
  }
}
