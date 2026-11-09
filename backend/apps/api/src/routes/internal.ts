import type { FastifyInstance } from "fastify";
import type Redis from "ioredis";
import { z } from "zod";
import { getCharacter, toLoadout } from "@survival/database";
import type { Database } from "@survival/database";
import { createGameEvent, publishGameEvent } from "@survival/events";
import { requireInternalToken } from "../middleware/auth";
import type { SessionManager } from "../services/session-manager";
import type { WorldManager } from "../services/world-manager";
import type { PersistenceService } from "../services/persistence";
import { RateLimiter } from "../services/rate-limit";

const validateJoinSchema = z.object({
  joinToken: z.string().min(10),
  dedicatedServerInstanceId: z.string().min(1),
});

const heartbeatSchema = z.object({
  playerCount: z.number().int().min(0),
  status: z.enum(["online", "degraded", "offline", "maintenance"]).optional(),
});

const inventoryCommitSchema = z.object({
  accountId: z.string().uuid(),
  characterId: z.string().uuid(),
  inventory: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().int().min(0),
      durability: z.number().optional(),
      meta: z.record(z.unknown()).optional(),
    })
  ),
  currency: z.number().optional(),
  reason: z.enum(["loot", "craft", "trade", "death", "admin", "reconnect"]),
  idempotencyKey: z.string().min(8),
  worldId: z.string(),
  instanceId: z.string(),
});

const checkpointSchema = z.object({
  dirtyActorCount: z.number().int().min(0),
  parentSnapshotId: z.string().optional(),
  dataBase64: z.string().min(1),
});

const playerEventSchema = z.object({
  type: z.enum(["player.entered", "player.left", "player.died"]),
  accountId: z.string().uuid(),
  characterId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  worldId: z.string(),
  instanceId: z.string(),
  idempotencyKey: z.string().min(8),
  payload: z.record(z.unknown()).default({}),
});

export async function internalRoutes(
  app: FastifyInstance,
  deps: {
    db: Database;
    redis: Redis;
    sessions: SessionManager;
    worlds: WorldManager;
    persistence: PersistenceService;
    rateLimiter: RateLimiter;
  }
): Promise<void> {
  app.addHook("preHandler", requireInternalToken);

  app.post("/internal/validate-join", async (request, reply) => {
    const body = validateJoinSchema.parse(request.body);
    try {
      const { payload, sessionId, previousSessionId } =
        await deps.sessions.validateAndConsumeJoinToken(
          body.joinToken,
          body.dedicatedServerInstanceId
        );

      const character = await getCharacter(deps.db, payload.characterId);
      if (!character) {
        return reply.code(404).send({ ok: false, reason: "invalid" });
      }

      return {
        ok: true,
        accountId: payload.accountId,
        characterId: payload.characterId,
        loadout: toLoadout(character),
        sessionId,
        kickedPreviousSession: Boolean(previousSessionId),
        previousSessionId,
      };
    } catch (error: unknown) {
      const reason = (error as { reason?: string }).reason ?? "unauthorized";
      return reply.code(401).send({ ok: false, reason });
    }
  });

  app.post("/internal/heartbeat", async (request) => {
    const body = heartbeatSchema.parse(request.body);
    await deps.worlds.heartbeat(body);
    return { ok: true };
  });

  app.post("/internal/inventory/commit", async (request, reply) => {
    const body = inventoryCommitSchema.parse(request.body);
    const limited = await deps.rateLimiter.consume(
      "inventory-commit",
      body.characterId,
      60,
      60
    );
    if (!limited.allowed) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    return deps.persistence.commitInventory(body);
  });

  app.post("/internal/events/player", async (request) => {
    const body = playerEventSchema.parse(request.body);
    const event = createGameEvent({
      type: body.type,
      worldId: body.worldId,
      instanceId: body.instanceId,
      accountId: body.accountId,
      characterId: body.characterId,
      idempotencyKey: body.idempotencyKey,
      payload: body.payload,
    });
    await deps.persistence.persistEvent(event);
    await publishGameEvent(deps.redis, event);

    if (body.type === "player.left" && body.sessionId) {
      await deps.sessions.endSession(body.characterId, body.sessionId);
    }

    return { ok: true, eventId: event.eventId };
  });

  app.post("/internal/world/checkpoint", async (request) => {
    const body = checkpointSchema.parse(request.body);
    const data = Buffer.from(body.dataBase64, "base64");
    const meta = await deps.worlds.createCheckpoint({
      data,
      dirtyActorCount: body.dirtyActorCount,
      parentSnapshotId: body.parentSnapshotId,
    });
    return { ok: true, snapshot: meta };
  });

  app.get("/internal/world/restore-latest", async () => {
    const restored = await deps.worlds.restoreLatest();
    return {
      ok: true,
      metadata: restored.metadata,
      dataBase64: restored.data ? restored.data.toString("base64") : null,
    };
  });

  app.get("/internal/world/snapshots", async () => {
    return { snapshots: await deps.worlds.listSnapshots() };
  });
}
