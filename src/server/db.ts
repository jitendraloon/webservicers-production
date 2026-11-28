import { PrismaClient } from "@prisma/client";
import { ensureEnvLoaded } from "./env";

ensureEnvLoaded();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  activeUrl: string | undefined;
};

/**
 * Dynamically retrieve or instantiate the PrismaClient singleton.
 * If DATABASE_URL was populated after server boot (e.g. by /install),
 * this automatically connects to the configured MariaDB/MySQL database.
 */
export function getPrismaClient(): PrismaClient {
  ensureEnvLoaded(true);
  const currentUrl = process.env.DATABASE_URL;

  if (globalForPrisma.prisma && globalForPrisma.activeUrl === currentUrl) {
    return globalForPrisma.prisma;
  }

  const client = new PrismaClient({
    ...(currentUrl ? { datasources: { db: { url: currentUrl } } } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  globalForPrisma.prisma = client;
  globalForPrisma.activeUrl = currentUrl;
  return client;
}

/**
 * Transparent proxy delegating all db calls to the active PrismaClient singleton.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export const prisma = db;
export default db;
