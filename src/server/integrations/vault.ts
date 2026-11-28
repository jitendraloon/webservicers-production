import { decrypt, encrypt } from "@/server/crypto";
import { db } from "@/server/db";

export interface IntegrationConfigResult<T = Record<string, unknown>> {
  id: string;
  category: string;
  provider: string;
  enabled: boolean;
  config: T;
  updatedAt: Date;
}

/**
 * Retrieve and decrypt an integration's configuration from the database.
 * Returns `null` if no record exists for `(category, provider)`.
 */
export async function getIntegrationConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  category: string,
  provider: string
): Promise<IntegrationConfigResult<T> | null> {
  const record = await db.integration.findUnique({
    where: {
      category_provider: {
        category,
        provider,
      },
    },
  });

  if (!record) {
    return null;
  }

  let config = {} as T;
  if (record.configEnc) {
    const raw = decrypt(record.configEnc);
    config = JSON.parse(raw) as T;
  }

  return {
    id: record.id,
    category: record.category,
    provider: record.provider,
    enabled: record.enabled,
    config,
    updatedAt: record.updatedAt,
  };
}

/**
 * Retrieve the first enabled integration for a given category.
 */
export async function getActiveIntegrationForCategory<
  T extends Record<string, unknown> = Record<string, unknown>,
>(category: string): Promise<IntegrationConfigResult<T> | null> {
  const record = await db.integration.findFirst({
    where: {
      category,
      enabled: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!record) {
    return null;
  }

  let config = {} as T;
  if (record.configEnc) {
    const raw = decrypt(record.configEnc);
    config = JSON.parse(raw) as T;
  }

  return {
    id: record.id,
    category: record.category,
    provider: record.provider,
    enabled: record.enabled,
    config,
    updatedAt: record.updatedAt,
  };
}

/**
 * Encrypt and persist an integration's configuration in the database.
 */
export async function saveIntegrationConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  category: string,
  provider: string,
  enabled: boolean,
  configObj: T
): Promise<IntegrationConfigResult<T>> {
  const configEnc = encrypt(JSON.stringify(configObj ?? {}));

  const record = await db.integration.upsert({
    where: {
      category_provider: {
        category,
        provider,
      },
    },
    update: {
      enabled,
      configEnc,
    },
    create: {
      category,
      provider,
      enabled,
      configEnc,
    },
  });

  return {
    id: record.id,
    category: record.category,
    provider: record.provider,
    enabled: record.enabled,
    config: configObj,
    updatedAt: record.updatedAt,
  };
}
