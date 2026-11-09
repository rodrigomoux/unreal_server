import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  hashPassword,
  signAccessToken,
  verifyPassword,
} from "@survival/authentication";
import { v4 as uuidv4 } from "uuid";
import type { Database } from "@survival/database";
import { config } from "../config";
import { RateLimiter } from "../services/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  displayName: z.string().min(2).max(32),
});

export async function authRoutes(
  app: FastifyInstance,
  deps: { db: Database; rateLimiter: RateLimiter }
): Promise<void> {
  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const limited = await deps.rateLimiter.consume(
      "auth-register",
      request.ip,
      10,
      60
    );
    if (!limited.allowed) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const existing = await deps.db.collections.accounts.findOne({
      email: body.email.toLowerCase(),
    });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const now = new Date().toISOString();
    const accountId = uuidv4();
    await deps.db.collections.accounts.insertOne({
      _id: accountId,
      email: body.email.toLowerCase(),
      displayName: body.displayName,
      passwordHash: await hashPassword(body.password),
      createdAt: now,
      updatedAt: now,
    });

    const characterId = uuidv4();
    await deps.db.collections.characters.insertOne({
      _id: characterId,
      characterId,
      accountId,
      name: body.displayName,
      level: 1,
      inventory: [],
      currency: 0,
      updatedAt: now,
    });

    const accessToken = signAccessToken(
      { sub: accountId, email: body.email.toLowerCase() },
      config.jwtSecret,
      config.accessTokenTtlSeconds
    );

    return {
      accessToken,
      expiresIn: config.accessTokenTtlSeconds,
      account: {
        id: accountId,
        email: body.email.toLowerCase(),
        displayName: body.displayName,
      },
      characterId,
    };
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const limited = await deps.rateLimiter.consume(
      "auth-login",
      request.ip,
      20,
      60
    );
    if (!limited.allowed) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const account = await deps.db.collections.accounts.findOne({
      email: body.email.toLowerCase(),
    });
    if (!account || !(await verifyPassword(body.password, account.passwordHash))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const accessToken = signAccessToken(
      { sub: account._id, email: account.email },
      config.jwtSecret,
      config.accessTokenTtlSeconds
    );

    return {
      accessToken,
      expiresIn: config.accessTokenTtlSeconds,
      account: {
        id: account._id,
        email: account.email,
        displayName: account.displayName,
      },
    };
  });
}
