export interface SeoApiResult<T> {
  data: T;
  fromApi: boolean;
}

export async function fetchSeoWithFallback<T>(
  endpoint: string,
  fallback: T,
  init?: RequestInit
): Promise<SeoApiResult<T>> {
  try {
    const res = await fetch(endpoint, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      return { data: fallback, fromApi: false };
    }
    const json = (await res.json()) as T | { data?: T };
    if (json && typeof json === "object" && "data" in json && json.data !== undefined) {
      return { data: json.data, fromApi: true };
    }
    return { data: json as T, fromApi: true };
  } catch {
    return { data: fallback, fromApi: false };
  }
}

export async function mutateSeoWithFallback<T>(
  endpoint: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: unknown,
  fallback: T
): Promise<SeoApiResult<T>> {
  return fetchSeoWithFallback<T>(endpoint, fallback, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function getKdTone(kd: number): "success" | "warning" | "danger" {
  if (kd < 35) return "success";
  if (kd < 65) return "warning";
  return "danger";
}

export type SearchIntent = "Informational" | "Commercial" | "Transactional" | "Navigational";

export function getIntentTone(
  intent: SearchIntent
): "primary" | "lilac" | "success" | "neutral" {
  switch (intent) {
    case "Commercial":
      return "lilac";
    case "Transactional":
      return "success";
    case "Informational":
      return "primary";
    default:
      return "neutral";
  }
}
