import path from "path";
import dotenv from "dotenv";
import { loadConfig } from "@survival/infrastructure";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../../../../.env"),
});

export const config = loadConfig({
  ...process.env,
  WORLD_ID: process.env.WORLD_ID ?? "world-persistent-01",
});
