/**
 * Records the API responses of an OpenMediaVault server as anonymized, local fixtures.
 *
 * Writes `test/fixtures/local/<version>/api/<name>.json`. `<version>` is the OpenMediaVault version
 * from `System.getInformation` (see `hwInfo`), e.g. `7.0.4-1`.
 *
 * - One file per RPC endpoint of the adapter (`hwInfo.json`, `disk.json`, `smart.json`, ...).
 *   Endpoints without data are skipped with a warning.
 * - One `smartInfo-<n>.json` and `smartAttributes-<n>.json` per monitored smart device (`n` = position in the
 *   `smart` list). The `params.devicefile` value is the parameter the adapter uses for this request.
 * - Read only: login, read requests and logout. Nothing is changed on the server.
 * - Anonymized with `anonymizeFixtures.ts`. If a leak is detected, nothing is written.
 *
 * Usage (requires `OMV_URL`, `OMV_USER`, `OMV_PASSWORD` in `.env`):
 *   npm run record:api                    record and anonymize
 *   npm run record:api -- --dry-run       read from the server, print the plan, write nothing
 *   npm run record:api -- --no-anonymize  record raw values (never commit these files)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ApiEndpoints, type OmvApi } from '../src/lib/omv-rpc.js';
import { createApi, getLiveConfig, type LiveConfig } from '../test/tools/omv-session.js';
import { anonymizeDocuments, findLeaks } from './anonymizeFixtures.js';
import { apiFixtureDir, FIXTURE_ROOT, versionFromHwInfo } from './fixtureVersions.js';

/** Endpoints that are recorded as they are. Session calls (`login`, `logout`) are not data. */
const RECORDED_ENDPOINTS: ApiEndpoints[] = [
    ApiEndpoints.hwInfo,
    ApiEndpoints.disk,
    ApiEndpoints.smart,
    ApiEndpoints.fileSystem,
    ApiEndpoints.shareMgmt,
    ApiEndpoints.smb,
    ApiEndpoints.fsTab,
    ApiEndpoints.service,
    ApiEndpoints.plugin,
    ApiEndpoints.network,
    ApiEndpoints.kvm,
];

/** Per monitored smart device, these endpoints are requested with `devicefile` as parameter (see `src/main.ts`). */
const SMART_DEVICE_ENDPOINTS: ApiEndpoints[] = [ApiEndpoints.smartInfo, ApiEndpoints.smartAttributes];

interface Options {
    dryRun: boolean;
    anonymize: boolean;
}

interface Recording {
    name: string;
    params?: Record<string, unknown>;
    response: unknown;
}

function parseOptions(argv: string[]): Options {
    return {
        dryRun: argv.includes('--dry-run'),
        anonymize: !argv.includes('--no-anonymize'),
    };
}

interface Recorded {
    version: string;
    recordings: Recording[];
}

async function recordAll(api: OmvApi): Promise<Recorded | undefined> {
    const recordings: Recording[] = [];
    const responses = new Map<ApiEndpoints, unknown>();

    for (const endpoint of RECORDED_ENDPOINTS) {
        const response = await api.retrievData(endpoint);
        if (response === undefined || response === null) {
            console.warn(`[record:api] no data for '${endpoint}', skipped`);
            continue;
        }
        responses.set(endpoint, response);
        recordings.push({ name: endpoint, response });
    }

    const version = versionFromHwInfo(responses.get(ApiEndpoints.hwInfo));
    if (!version) {
        console.error('[record:api] could not read the OpenMediaVault version from hwInfo, nothing recorded');
        return undefined;
    }

    const smartDevices = responses.get(ApiEndpoints.smart);
    if (Array.isArray(smartDevices)) {
        const monitored = smartDevices.filter(device => device?.monitor && typeof device.devicefile === 'string');
        if (monitored.length === 0) {
            console.warn('[record:api] no monitored smart device, smartInfo/smartAttributes skipped');
        }

        for (const [index, device] of monitored.entries()) {
            const params = { devicefile: device.devicefile };
            for (const endpoint of SMART_DEVICE_ENDPOINTS) {
                const response = await api.retrievData(endpoint, params);
                if (response === undefined || response === null) {
                    console.warn(`[record:api] no data for '${endpoint}' (device ${index + 1}), skipped`);
                    continue;
                }
                recordings.push({ name: `${endpoint}-${index + 1}`, params, response });
            }
        }
    }

    return { version, recordings };
}

function writeFixtures(version: string, recordings: Recording[], options: Options, secrets: string[]): void {
    const recordedAt = new Date().toISOString();
    const bodies = recordings.map(({ params, response }) => ({ params, response }));
    const bodiesOut = options.anonymize ? anonymizeDocuments(bodies, secrets) : bodies;

    const documents = recordings.map((recording, index) => ({
        endpoint: recording.name,
        recordedAt,
        anonymized: options.anonymize,
        ...(recording.params ? { params: bodiesOut[index].params } : {}),
        response: bodiesOut[index].response,
    }));

    if (options.anonymize) {
        const leaks = documents.flatMap(document => findLeaks(JSON.stringify(document), secrets).map(leak => `${document.endpoint}: ${leak}`));
        if (leaks.length > 0) {
            console.error('[record:api] anonymization left values that look like secrets or identifiers, nothing written:');
            leaks.forEach(leak => console.error(`  - ${leak}`));
            process.exitCode = 1;
            return;
        }
    }

    const targetDir = apiFixtureDir(version);
    mkdirSync(targetDir, { recursive: true });

    for (const document of documents) {
        const file = path.join(targetDir, `${document.endpoint}.json`);
        writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
        console.log(`[record:api] written ${path.relative(process.cwd(), file)}`);
    }
    console.log(`[record:api] ${documents.length} fixture(s) for OpenMediaVault ${version} in ${path.relative(process.cwd(), targetDir)}`);
}

async function main(): Promise<void> {
    const options = parseOptions(process.argv.slice(2));
    const config: LiveConfig | undefined = getLiveConfig();
    if (!config) {
        console.error('[record:api] OMV_URL, OMV_USER and OMV_PASSWORD must be set in .env');
        process.exitCode = 1;
        return;
    }

    const secrets = [new URL(config.url).hostname, config.user, config.password];
    const api = createApi(config);

    try {
        await api.login();
        if (!api.isConnected) {
            console.error('[record:api] login failed');
            process.exitCode = 1;
            return;
        }

        const recorded = await recordAll(api);
        if (!recorded) {
            process.exitCode = 1;
            return;
        }
        const { version, recordings } = recorded;

        if (options.dryRun) {
            console.log(`[record:api] dry run: OpenMediaVault ${version}, ${recordings.length} fixture(s) would be written to ${path.relative(process.cwd(), apiFixtureDir(version))}`);
            recordings.forEach(recording => console.log(`  - ${recording.name}.json`));
            return;
        }

        writeFixtures(version, recordings, options, options.anonymize ? secrets : []);
        console.log(`[record:api] fixtures root: ${path.relative(process.cwd(), FIXTURE_ROOT)} (git-ignored)`);
    } finally {
        await api.logout();
    }
}

main().catch((error: unknown) => {
    console.error(`[record:api] failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
});
