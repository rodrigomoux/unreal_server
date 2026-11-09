import type Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import {
  createJoinTokenPayload,
  encodeJoinToken,
  decodeJoinToken,
} from "@survival/authentication";
import {
  consumeJoinToken,
  storeJoinToken,
  setActiveCharacterSession,
  clearActiveCharacterSession,
  getWorldHealth,
} from "@survival/events";
import type { AppConfig } from "@survival/infrastructure";
import type { JoinTokenPayload, WorldJoinResponse } from "@survival/shared-types";
import { PROTOCOL_VERSION } from "@survival/shared-types";

export class SessionManager {
  constructor(
    private readonly redis: Redis,
    private readonly config: AppConfig
  ) {}

  async issueJoinToken(input: {
    accountId: string;
    characterId: string;
  }): Promise<WorldJoinResponse> {
    const health = await getWorldHealth(this.redis);
    const playerCount = health?.playerCount ?? 0;
    if (playerCount >= this.config.maxPlayers) {
      throw Object.assign(new Error("World at capacity"), { statusCode: 503 });
    }

    const payload = createJoinTokenPayload({
      accountId: input.accountId,
      characterId: input.characterId,
      worldId: this.config.worldId,
      instanceId: this.config.worldInstanceId,
      ttlSeconds: this.config.joinTokenTtlSeconds,
    });

    const token = encodeJoinToken(payload, this.config.jwtSecret);
    await storeJoinToken(
      this.redis,
      payload.tokenId,
      JSON.stringify(payload),
      this.config.joinTokenTtlSeconds
    );

    return {
      host: this.config.dedicatedServerHost,
      port: this.config.dedicatedServerPort,
      joinToken: token,
      expiresIn: this.config.joinTokenTtlSeconds,
      worldId: this.config.worldId,
      instanceId: this.config.worldInstanceId,
      protocolVersion: PROTOCOL_VERSION,
    };
  }

  async validateAndConsumeJoinToken(
    joinToken: string,
    dedicatedServerInstanceId: string
  ): Promise<{ payload: JoinTokenPayload; sessionId: string; previousSessionId: string | null }> {
    let payload: JoinTokenPayload;
    try {
      payload = decodeJoinToken(joinToken, this.config.jwtSecret);
    } catch {
      throw Object.assign(new Error("invalid"), { reason: "invalid" as const });
    }

    if (payload.instanceId !== dedicatedServerInstanceId) {
      throw Object.assign(new Error("unauthorized"), {
        reason: "unauthorized" as const,
      });
    }

    if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
      throw Object.assign(new Error("expired"), { reason: "expired" as const });
    }

    const stored = await consumeJoinToken(this.redis, payload.tokenId);
    if (!stored) {
      throw Object.assign(new Error("already_used"), {
        reason: "already_used" as const,
      });
    }

    const sessionId = uuidv4();
    const previousSessionId = await setActiveCharacterSession(
      this.redis,
      payload.characterId,
      sessionId,
      60 * 60 * 12
    );

    return { payload, sessionId, previousSessionId };
  }

  async endSession(characterId: string, sessionId: string): Promise<void> {
    await clearActiveCharacterSession(this.redis, characterId, sessionId);
  }
}
