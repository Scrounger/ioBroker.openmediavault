import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Root directory of the local (git-ignored) fixtures: `test/fixtures/local/`. */
export const FIXTURE_ROOT = fileURLToPath(new URL('../test/fixtures/local/', import.meta.url));

/**
 * Directory names of fixture versions. OpenMediaVault versions look like `7.0.4-1`, the optional `-N` is the package revision.
 */
export const VERSION_PATTERN = /^\d+(\.\d+)*(-\d+)?$/;

/**
 * Extracts the version directory name from the `version` field of the `System.getInformation` response.
 * OpenMediaVault reports e.g. `7.0.4-1 (Sandworm)`, only `7.0.4-1` is used for the directory name.
 *
 * @param hwInfo the `System.getInformation` response
 * @returns the version string or undefined if it cannot be read
 */
export function versionFromHwInfo(hwInfo: unknown): string | undefined {
    const version = (hwInfo as { version?: unknown } | undefined)?.version;
    if (typeof version !== 'string') {
        return undefined;
    }
    const match = /^\d+(?:\.\d+)*(?:-\d+)?/.exec(version.trim());
    return match?.[0];
}

/**
 * Compares two version strings by their numeric parts, e.g. `7.0.10` > `7.0.9` and `7.0.4-1` > `7.0.4`.
 *
 * @param a first version
 * @param b second version
 * @returns a positive number if a is newer, negative if older, 0 if equal
 */
export function compareVersions(a: string, b: string): number {
    const partsA = a.match(/\d+/g)?.map(Number) ?? [];
    const partsB = b.match(/\d+/g)?.map(Number) ?? [];
    const length = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < length; i++) {
        const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }
    return 0;
}

/**
 * Lists all recorded versions (directories with a valid version name), newest first.
 *
 * @param root the fixture root directory
 */
export function listFixtureVersions(root: string = FIXTURE_ROOT): string[] {
    if (!existsSync(root)) {
        return [];
    }
    return readdirSync(root, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && VERSION_PATTERN.test(entry.name))
        .map(entry => entry.name)
        .sort(compareVersions)
        .reverse();
}

/**
 * Returns the newest recorded version or undefined if no fixtures exist.
 *
 * @param root the fixture root directory
 */
export function latestFixtureVersion(root: string = FIXTURE_ROOT): string | undefined {
    return listFixtureVersions(root)[0];
}

/**
 * Directory of the API fixtures for one version: `test/fixtures/local/<version>/api/`.
 *
 * @param version the version directory name
 * @param root the fixture root directory
 */
export function apiFixtureDir(version: string, root: string = FIXTURE_ROOT): string {
    if (!VERSION_PATTERN.test(version)) {
        throw new Error(`Invalid fixture version '${version}'`);
    }
    return path.join(root, version, 'api');
}
