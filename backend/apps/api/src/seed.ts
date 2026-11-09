import { hashPassword } from "@survival/authentication";
import type { Database } from "@survival/database";
import { v4 as uuidv4 } from "uuid";

/** Seeds a demo account/character for local integration tests. */
export async function seedDemoData(db: Database): Promise<void> {
  const email = "demo@survival.local";
  const existing = await db.collections.accounts.findOne({ email });
  if (existing) {
    return;
  }

  const now = new Date().toISOString();
  const accountId = uuidv4();
  const characterId = uuidv4();
  const passwordHash = await hashPassword("demo1234");

  await db.collections.accounts.insertOne({
    _id: accountId,
    email,
    displayName: "Demo Survivor",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  await db.collections.characters.insertOne({
    _id: characterId,
    characterId,
    accountId,
    name: "Demo",
    level: 1,
    inventory: [
      { itemId: "wood", quantity: 10 },
      { itemId: "stone", quantity: 5 },
    ],
    currency: 100,
    lastWorldId: "world-persistent-01",
    updatedAt: now,
  });
}
