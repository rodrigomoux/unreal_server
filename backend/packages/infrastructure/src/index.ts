import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { WorldSnapshotMetadata } from "@survival/shared-types";

export interface AppConfig {
  nodeEnv: string;
  apiHost: string;
  apiPort: number;
  mongodbUri: string;
  redisUrl: string;
  jwtSecret: string;
  internalServiceToken: string;
  joinTokenTtlSeconds: number;
  accessTokenTtlSeconds: number;
  worldId: string;
  worldInstanceId: string;
  dedicatedServerHost: string;
  dedicatedServerPort: number;
  maxPlayers: number;
  snapshotDir: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const required = (key: string, fallback?: string): string => {
    const value = env[key] ?? fallback;
    if (!value) {
      throw new Error(`Missing required env var: ${key}`);
    }
    return value;
  };

  return {
    nodeEnv: env.NODE_ENV ?? "development",
    apiHost: env.API_HOST ?? "0.0.0.0",
    apiPort: Number(env.API_PORT ?? 3000),
    mongodbUri: required("MONGODB_URI", "mongodb://survival:survival@localhost:27017/survival?authSource=admin"),
    redisUrl: required("REDIS_URL", "redis://localhost:6379"),
    jwtSecret: required("JWT_SECRET", "dev-change-me-jwt-secret-min-32-chars"),
    internalServiceToken: required(
      "INTERNAL_SERVICE_TOKEN",
      "dev-change-me-internal-service-token"
    ),
    joinTokenTtlSeconds: Number(env.JOIN_TOKEN_TTL_SECONDS ?? 60),
    accessTokenTtlSeconds: Number(env.ACCESS_TOKEN_TTL_SECONDS ?? 3600),
    worldId: env.WORLD_ID ?? "world-persistent-01",
    worldInstanceId: env.WORLD_INSTANCE_ID ?? "local-ds-01",
    dedicatedServerHost: env.DEDICATED_SERVER_HOST ?? "127.0.0.1",
    dedicatedServerPort: Number(env.DEDICATED_SERVER_PORT ?? 7777),
    maxPlayers: Number(env.MAX_PLAYERS ?? 100),
    snapshotDir: env.SNAPSHOT_DIR ?? "./data/snapshots",
  };
}

export class LocalSnapshotStore {
  constructor(private readonly rootDir: string) {}

  async ensureRoot(): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
  }

  snapshotPath(snapshotId: string): string {
    return path.join(this.rootDir, `${snapshotId}.bin`);
  }

  async writeSnapshot(input: {
    worldId: string;
    instanceId: string;
    version: number;
    data: Buffer;
    parentSnapshotId?: string;
  }): Promise<WorldSnapshotMetadata> {
    await this.ensureRoot();
    const snapshotId = `${input.worldId}-v${input.version}-${Date.now()}`;
    const filePath = this.snapshotPath(snapshotId);
    await fs.writeFile(filePath, input.data);
    const checksum = createHash("sha256").update(input.data).digest("hex");

    return {
      snapshotId,
      worldId: input.worldId,
      instanceId: input.instanceId,
      version: input.version,
      createdAt: new Date().toISOString(),
      storageUri: `file://${path.resolve(filePath)}`,
      byteSize: input.data.byteLength,
      checksum,
      parentSnapshotId: input.parentSnapshotId,
    };
  }

  async readSnapshot(snapshotId: string): Promise<Buffer> {
    return fs.readFile(this.snapshotPath(snapshotId));
  }

  async listSnapshotFiles(): Promise<string[]> {
    await this.ensureRoot();
    const entries = await fs.readdir(this.rootDir);
    return entries.filter((name) => name.endsWith(".bin"));
  }
}

export function rateLimitKey(scope: string, id: string): string {
  return `ratelimit:${scope}:${id}`;
}
