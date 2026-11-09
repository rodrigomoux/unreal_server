import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type { JoinTokenPayload } from "@survival/shared-types";

export interface AccessTokenClaims {
  sub: string;
  email: string;
  typ: "access";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(
  claims: Omit<AccessTokenClaims, "typ">,
  secret: string,
  expiresInSeconds: number
): string {
  return jwt.sign({ ...claims, typ: "access" }, secret, {
    expiresIn: expiresInSeconds,
  });
}

export function verifyAccessToken(token: string, secret: string): AccessTokenClaims {
  const decoded = jwt.verify(token, secret) as AccessTokenClaims;
  if (decoded.typ !== "access") {
    throw new Error("Invalid token type");
  }
  return decoded;
}

export function createJoinTokenPayload(input: {
  accountId: string;
  characterId: string;
  worldId: string;
  instanceId: string;
  ttlSeconds: number;
}): JoinTokenPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    tokenId: uuidv4(),
    accountId: input.accountId,
    characterId: input.characterId,
    worldId: input.worldId,
    instanceId: input.instanceId,
    issuedAt: now,
    expiresAt: now + input.ttlSeconds,
  };
}

export function encodeJoinToken(payload: JoinTokenPayload, secret: string): string {
  return jwt.sign({ ...payload, typ: "join" }, secret, {
    expiresIn: Math.max(1, payload.expiresAt - Math.floor(Date.now() / 1000)),
  });
}

export function decodeJoinToken(token: string, secret: string): JoinTokenPayload {
  const decoded = jwt.verify(token, secret) as JoinTokenPayload & { typ?: string };
  if (decoded.typ !== "join") {
    throw new Error("Invalid join token type");
  }
  return {
    tokenId: decoded.tokenId,
    accountId: decoded.accountId,
    characterId: decoded.characterId,
    worldId: decoded.worldId,
    instanceId: decoded.instanceId,
    issuedAt: decoded.issuedAt,
    expiresAt: decoded.expiresAt,
  };
}

export function assertInternalServiceToken(
  provided: string | undefined,
  expected: string
): void {
  if (!provided || provided !== expected) {
    throw new Error("Unauthorized internal service");
  }
}
