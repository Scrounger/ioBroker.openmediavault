import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import * as tree from '../../../src/lib/tree/index.js';
import { apiFixtureDir, latestFixtureVersion } from '../../../tools/fixtureVersions.js';

/** One recorded API response as written by `npm run record:api`. */
export interface FixtureDocument {
    endpoint: string;
    recordedAt?: string;
    anonymized?: boolean;
    params?: Record<string, unknown>;
    response: any;
}

let documents: FixtureDocument[] | undefined;

/**
 * Returns all recorded documents of the newest fixture version. The list is empty when no fixtures are recorded
 * (the fixtures are git-ignored and only exist on machines with a recorded OpenMediaVault).
 */
export function getFixtureDocuments(): FixtureDocument[] {
    if (documents === undefined) {
        const version = latestFixtureVersion();
        const dir = version ? apiFixtureDir(version) : undefined;

        documents = dir && existsSync(dir)
            ? readdirSync(dir)
                .filter(file => file.endsWith('.json'))
                .sort()
                .map(file => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as FixtureDocument)
            : [];
    }
    return documents;
}

/** `describe` when recorded fixtures exist, otherwise `describe.skip`. */
export const describeWithFixtures: Mocha.SuiteFunction = getFixtureDocuments().length > 0 ? describe : describe.skip;

/**
 * Compares the params of a recorded document with the requested params.
 * Documents without params only match requests without params.
 */
function paramsMatch(recorded: Record<string, unknown> | undefined, requested: Record<string, unknown> | undefined): boolean {
    if (!requested) {
        return recorded === undefined;
    }
    return recorded !== undefined && Object.entries(requested).every(([key, value]) => recorded[key] === value);
}

/**
 * Returns the recorded response of an endpoint or undefined when it was not recorded.
 * Numbered endpoints like `smartInfo-1` are found by their base name `smartInfo`, the params select the document.
 *
 * @param endpoint the endpoint name, e.g. `disk` or `smartInfo`
 * @param params the request params, e.g. `{ devicefile: '/dev/sda' }`
 */
export function getFixtureResponse(endpoint: string, params?: Record<string, unknown>): any {
    const document = getFixtureDocuments().find(doc => doc.endpoint.replace(/-\d+$/, '') === endpoint && paramsMatch(doc.params, params));
    return document?.response;
}

/**
 * Returns the recorded entries of an endpoint as array. A single object response is wrapped in an array.
 *
 * @param endpoint the endpoint name
 */
export function getFixtureRecords(endpoint: string): any[] | undefined {
    const response = getFixtureResponse(endpoint);
    if (response === undefined) {
        return undefined;
    }
    return Array.isArray(response) ? response : [response];
}

/**
 * Returns the recorded S.M.A.R.T. devices as the adapter sees them: every monitored device is merged with its
 * recorded smartInfo and smartAttributes data. This follows the merge in `updateDataGeneric()` in `src/main.ts`.
 */
export function getSmartDevices(): any[] {
    const additionalRequests: any[] = (tree.smart.iobObjectDefintions as any).additionalRequest ?? [];

    return (getFixtureRecords('smart') ?? []).map(record => {
        let device: any = record;

        for (const request of additionalRequests) {
            if (!device[request.conditionProperty]) {
                continue;
            }
            const data = getFixtureResponse(request.endpoint, { [request.paramsProperty]: device[request.paramsProperty] });

            device = request.converter
                ? { ...request.converter(data, undefined), ...device }
                : { ...data, ...device };
        }
        return device;
    });
}
