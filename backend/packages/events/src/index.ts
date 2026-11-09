import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import type { GameEventEnvelope, GameEventType } from "@survival/shared-types";

export const GAME_EVENTS_STREAM = "survival:game-events";
export const JOIN_TOKEN_PREFIX = "join:";
export const SESSION_PREFIX = "session:";
export const WORLD_HEALTH_KEY = "world:health";
export const ACTIVE_CHARACTER_PREFIX = "active-character:";

export function createRedis(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });
}

export function createGameEvent<T extends object>(input: {
  type: GameEventType;
  worldId: string;
  instanceId: string;
  payload: T;
  idempotencyKey: string;
  characterId?: string;
  accountId?: string;
}): GameEventEnvelope<T> {
  return {
    eventId: uuidv4(),
    type: input.type,
    worldId: input.worldId,
    instanceId: input.instanceId,
    occurredAt: new Date().toISOString(),
    characterId: input.characterId,
    accountId: input.accountId,
    payload: input.payload,
    idempotencyKey: input.idempotencyKey,
  };
}

export async function publishGameEvent(
  redis: Redis,
  event: GameEventEnvelope
): Promise<string> {
  const id = await redis.xadd(
    GAME_EVENTS_STREAM,
    "*",
    "eventId",
    event.eventId,
    "type",
    event.type,
    "body",
    JSON.stringify(event)
  );
  if (!id) {
    throw new Error("Failed to publish game event to Redis stream");
  }
  return id;
}

export async function storeJoinToken(
  redis: Redis,
  tokenId: string,
  payloadJson: string,
  ttlSeconds: number
): Promise<void> {
  await redis.set(`${JOIN_TOKEN_PREFIX}${tokenId}`, payloadJson, "EX", ttlSeconds);
}

export async function consumeJoinToken(
  redis: Redis,
  tokenId: string
): Promise<string | null> {
  const key = `${JOIN_TOKEN_PREFIX}${tokenId}`;
  const value = await redis.get(key);
  if (!value) {
    return null;
  }
  await redis.del(key);
  return value;
}

export async function setActiveCharacterSession(
  redis: Redis,
  characterId: string,
  sessionId: string,
  ttlSeconds: number
): Promise<string | null> {
  const key = `${ACTIVE_CHARACTER_PREFIX}${characterId}`;
  const previous = await redis.get(key);
  await redis.set(key, sessionId, "EX", ttlSeconds);
  return previous;
}

export async function clearActiveCharacterSession(
  redis: Redis,
  characterId: string,
  sessionId: string
): Promise<void> {
  const key = `${ACTIVE_CHARACTER_PREFIX}${characterId}`;
  const current = await redis.get(key);
  if (current === sessionId) {
    await redis.del(key);
  }
}

export async function setWorldHealth(
  redis: Redis,
  health: {
    worldId: string;
    instanceId: string;
    status: string;
    playerCount: number;
    maxPlayers: number;
    updatedAt: string;
  }
): Promise<void> {
  await redis.set(WORLD_HEALTH_KEY, JSON.stringify(health), "EX", 30);
}

export async function getWorldHealth(redis: Redis): Promise<{
  worldId: string;
  instanceId: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
  updatedAt: string;
} | null> {
  const raw = await redis.get(WORLD_HEALTH_KEY);
  return raw ? (JSON.parse(raw) as {
    worldId: string;
    instanceId: string;
    status: string;
    playerCount: number;
    maxPlayers: number;
    updatedAt: string;
  }) : null;
}
