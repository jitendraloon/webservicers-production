/**
 * Lightweight, robust Semantic Versioning (SemVer) helper for WebServicers updater.
 */

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  raw: string;
}

export function parseSemver(v: string): ParsedSemver | null {
  const clean = v.trim().replace(/^v+/i, "");
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    raw: v,
  };
}

/**
 * Returns:
 *  1 if a > b
 * -1 if a < b
 *  0 if a == b
 */
export function compareSemver(a: string, b: string): number {
  const pA = parseSemver(a);
  const pB = parseSemver(b);

  if (!pA || !pB) {
    return a.localeCompare(b);
  }

  if (pA.major !== pB.major) return pA.major > pB.major ? 1 : -1;
  if (pA.minor !== pB.minor) return pA.minor > pB.minor ? 1 : -1;
  if (pA.patch !== pB.patch) return pA.patch > pB.patch ? 1 : -1;

  // Prerelease comparison: non-prerelease is greater than prerelease
  if (!pA.prerelease && pB.prerelease) return 1;
  if (pA.prerelease && !pB.prerelease) return -1;
  if (pA.prerelease && pB.prerelease) {
    return pA.prerelease.localeCompare(pB.prerelease);
  }

  return 0;
}

export function isUpgradeAvailable(current: string, target: string): boolean {
  return compareSemver(target, current) > 0;
}
