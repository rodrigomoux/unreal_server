import type { Database } from "@survival/database";
import { getCharacter, toLoadout, upsertCharacterInventory } from "@survival/database";
import type Redis from "ioredis";
import { createGameEvent, publishGameEvent } from "@survival/events";
import type {
  GameEventEnvelope,
  InventoryCommitPayload,
  InventoryItem,
} from "@survival/shared-types";

export class PersistenceService {
  constructor(
    private readonly db: Database,
    private readonly redis: Redis
  ) {}

  async commitInventory(input: {
    worldId: string;
    instanceId: string;
    accountId: string;
    characterId: string;
    inventory: InventoryItem[];
    currency?: number;
    reason: InventoryCommitPayload["reason"];
    idempotencyKey: string;
  }) {
    const existing = await this.db.collections.eventLog.findOne({
      idempotencyKey: input.idempotencyKey,
    });
    if (existing) {
      const character = await getCharacter(this.db, input.characterId);
      return {
        duplicate: true,
        loadout: character ? toLoadout(character) : null,
      };
    }

    const updated = await upsertCharacterInventory(
      this.db,
      input.characterId,
      input.inventory,
      input.currency
    );

    const event = createGameEvent({
      type: "inventory.commit",
      worldId: input.worldId,
      instanceId: input.instanceId,
      accountId: input.accountId,
      characterId: input.characterId,
      idempotencyKey: input.idempotencyKey,
      payload: {
        inventory: input.inventory,
        currency: input.currency,
        reason: input.reason,
      } as InventoryCommitPayload,
    });

    await this.persistEvent(event);
    await publishGameEvent(this.redis, event);

    return {
      duplicate: false,
      loadout: updated ? toLoadout(updated) : null,
    };
  }

  async persistEvent(event: GameEventEnvelope): Promise<void> {
    try {
      await this.db.collections.eventLog.insertOne({
        _id: event.eventId,
        type: event.type,
        worldId: event.worldId,
        instanceId: event.instanceId,
        occurredAt: event.occurredAt,
        characterId: event.characterId,
        accountId: event.accountId,
        payload: event.payload,
        idempotencyKey: event.idempotencyKey,
        createdAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const code = (error as { code?: number }).code;
      if (code === 11000) {
        return;
      }
      throw error;
    }
  }
}
