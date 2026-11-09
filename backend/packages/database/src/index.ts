import { MongoClient, Db, Collection } from "mongodb";
import type {
  CharacterLoadout,
  InventoryItem,
  WorldSnapshotMetadata,
} from "@survival/shared-types";

export interface AccountDocument {
  _id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterDocument extends CharacterLoadout {
  _id: string;
}

export interface EventLogDocument {
  _id: string;
  type: string;
  worldId: string;
  instanceId: string;
  occurredAt: string;
  characterId?: string;
  accountId?: string;
  payload: object;
  idempotencyKey: string;
  createdAt: string;
}

export interface DatabaseCollections {
  accounts: Collection<AccountDocument>;
  characters: Collection<CharacterDocument>;
  snapshots: Collection<WorldSnapshotMetadata & { _id: string }>;
  eventLog: Collection<EventLogDocument>;
}

export class Database {
  private client: MongoClient;
  readonly db: Db;
  readonly collections: DatabaseCollections;

  private constructor(client: MongoClient, dbName: string) {
    this.client = client;
    this.db = client.db(dbName);
    this.collections = {
      accounts: this.db.collection("accounts"),
      characters: this.db.collection("characters"),
      snapshots: this.db.collection("snapshots"),
      eventLog: this.db.collection("event_log"),
    };
  }

  static async connect(uri: string, dbName = "survival"): Promise<Database> {
    const client = new MongoClient(uri);
    await client.connect();
    const database = new Database(client, dbName);
    await database.ensureIndexes();
    return database;
  }

  async ensureIndexes(): Promise<void> {
    await this.collections.accounts.createIndex({ email: 1 }, { unique: true });
    await this.collections.characters.createIndex({ accountId: 1 });
    await this.collections.eventLog.createIndex(
      { idempotencyKey: 1 },
      { unique: true }
    );
    await this.collections.eventLog.createIndex({ worldId: 1, occurredAt: 1 });
    await this.collections.snapshots.createIndex({ worldId: 1, version: -1 });
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

export async function upsertCharacterInventory(
  db: Database,
  characterId: string,
  inventory: InventoryItem[],
  currency?: number
): Promise<CharacterDocument | null> {
  const updatedAt = new Date().toISOString();
  const update: Record<string, unknown> = { inventory, updatedAt };
  if (typeof currency === "number") {
    update.currency = currency;
  }

  const result = await db.collections.characters.findOneAndUpdate(
    { _id: characterId },
    { $set: update },
    { returnDocument: "after" }
  );
  return result;
}

export async function getCharacter(
  db: Database,
  characterId: string
): Promise<CharacterDocument | null> {
  return db.collections.characters.findOne({ _id: characterId });
}

export async function listCharactersForAccount(
  db: Database,
  accountId: string
): Promise<CharacterDocument[]> {
  return db.collections.characters.find({ accountId }).toArray();
}

export function toLoadout(doc: CharacterDocument): CharacterLoadout {
  return {
    characterId: doc._id,
    accountId: doc.accountId,
    name: doc.name,
    level: doc.level,
    inventory: doc.inventory,
    currency: doc.currency,
    lastWorldId: doc.lastWorldId,
    updatedAt: doc.updatedAt,
  };
}
