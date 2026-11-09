import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, assertInternalServiceToken } from "@survival/authentication";
import { config } from "../config";

export interface AuthedRequest extends FastifyRequest {
  accountId?: string;
  accountEmail?: string;
}

export async function requireAccessToken(
  request: AuthedRequest,
  reply: FastifyReply
): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Missing bearer token" });
    return;
  }
  try {
    const claims = verifyAccessToken(header.slice(7), config.jwtSecret);
    request.accountId = claims.sub;
    request.accountEmail = claims.email;
  } catch {
    reply.code(401).send({ error: "Invalid access token" });
  }
}

export async function requireInternalToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    assertInternalServiceToken(
      request.headers["x-internal-token"] as string | undefined,
      config.internalServiceToken
    );
  } catch {
    reply.code(401).send({ error: "Unauthorized internal service" });
  }
}
