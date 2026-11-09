import { Database } from "@survival/database";
import { createRedis } from "@survival/events";
import { config } from "./config";
import { buildApp } from "./app";
import { seedDemoData } from "./seed";

async function main(): Promise<void> {
  const db = await Database.connect(config.mongodbUri);
  const redis = createRedis(config.redisUrl);

  if (config.nodeEnv !== "production") {
    await seedDemoData(db);
  }

  const { app } = await buildApp({ db, redis });

  const shutdown = async () => {
    await app.close();
    await redis.quit();
    await db.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({ host: config.apiHost, port: config.apiPort });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
