import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listCharactersForAccount, toLoadout } from "@survival/database";
import type { Database } from "@survival/database";
import { requireAccessToken, type AuthedRequest } from "../middleware/auth";
import type { SessionManager } from "../services/session-manager";
import type { WorldManager } from "../services/world-manager";
import { RateLimiter } from "../services/rate-limit";

const joinSchema = z.object({
  characterId: z.string().uuid(),
  worldId: z.string().optional(),
});

export async function worldRoutes(
  app: FastifyInstance,
  deps: {
    db: Database;
    sessions: SessionManager;
    worlds: WorldManager;
    rateLimiter: RateLimiter;
  }
): Promise<void> {
  app.get(
    "/world/status",
    { preHandler: requireAccessToken },
    async () => deps.worlds.getStatus()
  );

  app.get(
    "/characters",
    { preHandler: requireAccessToken },
    async (request: AuthedRequest) => {
      const characters = await listCharactersForAccount(
        deps.db,
        request.accountId!
      );
      return { characters: characters.map(toLoadout) };
    }
  );

  app.post(
    "/world/join",
    { preHandler: requireAccessToken },
    async (request: AuthedRequest, reply) => {
      const body = joinSchema.parse(request.body);
      const limited = await deps.rateLimiter.consume(
        "world-join",
        request.accountId!,
        10,
        60
      );
      if (!limited.allowed) {
        return reply.code(429).send({ error: "Rate limit exceeded" });
      }

      const character = await deps.db.collections.characters.findOne({
        _id: body.characterId,
        accountId: request.accountId,
      });
      if (!character) {
        return reply.code(404).send({ error: "Character not found" });
      }

      try {
        return await deps.sessions.issueJoinToken({
          accountId: request.accountId!,
          characterId: body.characterId,
        });
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
        return reply.code(statusCode).send({
          error: (error as Error).message,
        });
      }
    }
  );
}
