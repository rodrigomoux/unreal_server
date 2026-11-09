/** Shared domain contracts between API, DS bridge, and future UE bindings. */

export type AuthorityCategory = 1 | 2 | 3;

export type WorldStatus = "online" | "degraded" | "offline" | "maintenance";

export interface Account {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  durability?: number;
  meta?: Record<string, unknown>;
}

export interface CharacterLoadout {
  characterId: string;
  accountId: string;
  name: string;
  level: number;
  inventory: InventoryItem[];
  currency: number;
  lastWorldId?: string;
  updatedAt: string;
}

export interface JoinTokenPayload {
  tokenId: string;
  accountId: string;
  characterId: string;
  worldId: string;
  instanceId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface WorldInstanceInfo {
  worldId: string;
  instanceId: string;
  host: string;
  port: number;
  status: WorldStatus;
  playerCount: number;
  maxPlayers: number;
  protocolVersion: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  expiresIn: number;
  account: Pick<Account, "id" | "email" | "displayName">;
}

export interface WorldJoinRequest {
  characterId: string;
  worldId?: string;
}

export interface WorldJoinResponse {
  host: string;
  port: number;
  joinToken: string;
  expiresIn: number;
  worldId: string;
  instanceId: string;
  protocolVersion: string;
}

export interface ValidateJoinRequest {
  joinToken: string;
  dedicatedServerInstanceId: string;
}

export interface ValidateJoinResponse {
  ok: true;
  accountId: string;
  characterId: string;
  loadout: CharacterLoadout;
  sessionId: string;
}

export interface ValidateJoinFailure {
  ok: false;
  reason: "expired" | "invalid" | "already_used" | "capacity" | "unauthorized";
}

export type GameEventType =
  | "player.entered"
  | "player.left"
  | "player.died"
  | "inventory.commit"
  | "build.commit"
  | "economy.transaction"
  | "world.checkpoint"
  | "world.heartbeat"
  | "security.anomaly";

export interface GameEventEnvelope<T = object> {
  eventId: string;
  type: GameEventType;
  worldId: string;
  instanceId: string;
  occurredAt: string;
  characterId?: string;
  accountId?: string;
  payload: T;
  /** Idempotency key for safe retries from the Dedicated Server. */
  idempotencyKey: string;
}

export interface InventoryCommitPayload {
  inventory: InventoryItem[];
  currency?: number;
  reason: "loot" | "craft" | "trade" | "death" | "admin" | "reconnect";
}

export interface BuildCommitPayload {
  structureId: string;
  blueprintId: string;
  ownerCharacterId: string;
  transform: { x: number; y: number; z: number; yaw: number };
  health: number;
}

export interface WorldCheckpointPayload {
  snapshotId: string;
  version: number;
  storageUri: string;
  byteSize: number;
  dirtyActorCount: number;
}

export interface WorldSnapshotMetadata {
  snapshotId: string;
  worldId: string;
  instanceId: string;
  version: number;
  createdAt: string;
  storageUri: string;
  byteSize: number;
  checksum: string;
  parentSnapshotId?: string;
}

export interface AuthorityRule {
  operation: string;
  category: AuthorityCategory;
  client: string;
  dedicatedServer: string;
  backend: string;
}

export const AUTHORITY_MATRIX: AuthorityRule[] = [
  {
    operation: "hud_ui_audio_vfx_camera",
    category: 1,
    client: "exclusive",
    dedicatedServer: "none",
    backend: "none",
  },
  {
    operation: "movement_prediction",
    category: 2,
    client: "predict",
    dedicatedServer: "reconcile",
    backend: "none",
  },
  {
    operation: "gather_use_item_reach",
    category: 2,
    client: "optimistic_ux",
    dedicatedServer: "validate_commit",
    backend: "persist_on_event",
  },
  {
    operation: "build_placement_preview",
    category: 2,
    client: "preview",
    dedicatedServer: "accept_or_reject",
    backend: "snapshot_or_event",
  },
  {
    operation: "damage_death_loot_final",
    category: 3,
    client: "fx_only",
    dedicatedServer: "exclusive",
    backend: "log_persist",
  },
  {
    operation: "persistent_inventory_economy",
    category: 3,
    client: "ui_only",
    dedicatedServer: "runtime_apply",
    backend: "source_of_truth",
  },
  {
    operation: "progression_rewards",
    category: 3,
    client: "none",
    dedicatedServer: "trigger",
    backend: "persist",
  },
];

export const PROTOCOL_VERSION = "1.0.0";
