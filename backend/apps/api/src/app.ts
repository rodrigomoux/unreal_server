import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Database } from "@survival/database";
import type Redis from "ioredis";
import { ZodError } from "zod";
import { AUTHORITY_MATRIX, PROTOCOL_VERSION } from "@survival/shared-types";
import { authRoutes } from "./routes/auth";
import { worldRoutes } from "./routes/world";
import { internalRoutes } from "./routes/internal";
import { SessionManager } from "./services/session-manager";
import { WorldManager } from "./services/world-manager";
import { PersistenceService } from "./services/persistence";
import { RateLimiter } from "./services/rate-limit";
import { config } from "./config";

export async function buildApp(deps: { db: Database; redis: Redis }) {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });

  const sessions = new SessionManager(deps.redis, config);
  const worlds = new WorldManager(deps.redis, deps.db, config);
  const persistence = new PersistenceService(deps.db, deps.redis);
  const rateLimiter = new RateLimiter(deps.redis);

  await worlds.bootstrap();

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "Validation failed",
        details: error.flatten(),
      });
    }
    app.log.error(error);
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    return reply.code(statusCode).send({
      error: error.message || "Internal Server Error",
    });
  });

  app.get("/health", async () => ({
    ok: true,
    protocolVersion: PROTOCOL_VERSION,
    worldId: config.worldId,
    instanceId: config.worldInstanceId,
  }));

  app.get("/authority-matrix", async () => ({ rules: AUTHORITY_MATRIX }));

  await authRoutes(app, { db: deps.db, rateLimiter });
  await worldRoutes(app, {
    db: deps.db,
    sessions,
    worlds,
    rateLimiter,
  });

  // Encapsulate internal auth hook so it does not affect public routes.
  await app.register(async (internal) => {
    await internalRoutes(internal, {
      db: deps.db,
      redis: deps.redis,
      sessions,
      worlds,
      persistence,
      rateLimiter,
    });
  });

  return { app, worlds, sessions, persistence };
}
