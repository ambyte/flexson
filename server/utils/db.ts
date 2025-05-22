import { MongoClient } from "mongodb";
import type { Db } from "mongodb";
import { useRuntimeConfig } from "nitropack/runtime";

let client: MongoClient | null = null;
let isConnecting = false;
let connectionPromise: Promise<MongoClient> | null = null;

export async function getDbClient(): Promise<MongoClient> {
  const config = useRuntimeConfig();

  if (!config.mongoUri) {
    throw new Error("MongoDB URI is not defined");
  }

  if (client) return client;

  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  try {
    isConnecting = true;
    connectionPromise = (async () => {
      client = new MongoClient(config.mongoUri as string);
      await client.connect();
      return client;
    })();
    return await connectionPromise;
  } finally {
    isConnecting = false;
    connectionPromise = null;
  }
}

export async function getDb(): Promise<Db> {
  const config = useRuntimeConfig();
  if (!config.mongoDb) {
    console.error("MongoDB database name is not defined in runtime config");
    throw new Error("MongoDB database name is not defined");
  }

  const client = await getDbClient();
  return client.db(config.mongoDb as string);
}

// This function should ONLY be called when the application is shutting down
export async function closeDbConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
