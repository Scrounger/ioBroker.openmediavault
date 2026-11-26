/**
 * Offline tests for the version helpers (tools/fixtureVersions.ts) and for recorded API fixtures
 * (test/fixtures/local/<version>/api/, created by `npm run record:api`).
 *
 * The fixture tests are skipped when no fixtures have been recorded yet.
 */
import { expect } from 'chai';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { findLeaks } from '../../tools/anonymizeFixtures.js';
import { apiFixtureDir, compareVersions, latestFixtureVersion, listFixtureVersions, VERSION_PATTERN, versionFromHwInfo } from '../../tools/fixtureVersions.js';
import { getLiveConfig } from './omv-session.js';

describe('tools: fixtureVersions', () => {
    it('extracts the package version from hwInfo', () => {
        expect(versionFromHwInfo({ version: '7.0.4-1 (Sandworm)' })).to.equal('7.0.4-1');
        expect(versionFromHwInfo({ version: '7.4.96' })).to.equal('7.4.96');
        expect(versionFromHwInfo({ version: 'unknown' })).to.be.undefined;
        expect(versionFromHwInfo({})).to.be.undefined;
        expect(versionFromHwInfo(undefined)).to.be.undefined;
    });

    it('accepts OpenMediaVault version directory names', () => {
        expect(VERSION_PATTERN.test('7.0.4-1')).to.be.true;
        expect(VERSION_PATTERN.test('7.4.96')).to.be.true;
        expect(VERSION_PATTERN.test('../7.0')).to.be.false;
        expect(VERSION_PATTERN.test('7.0 (Sandworm)')).to.be.false;
    });

    it('compares versions numerically', () => {
        expect(compareVersions('7.0.10', '7.0.9')).to.be.greaterThan(0);
        expect(compareVersions('7.0.4-1', '7.0.4')).to.be.greaterThan(0);
        expect(compareVersions('6.9.9', '7.0.0')).to.be.lessThan(0);
        expect(compareVersions('7.0.4', '7.0.4')).to.equal(0);
    });

    it('returns no versions for a missing fixture root', () => {
        const root = path.join(process.cwd(), 'test', 'fixtures', 'does-not-exist');
        expect(listFixtureVersions(root)).to.deep.equal([]);
        expect(latestFixtureVersion(root)).to.be.undefined;
        expect(() => apiFixtureDir('../etc', root)).to.throw(/Invalid fixture version/);
    });
});

const version = latestFixtureVersion();
const fixtureDir = version ? apiFixtureDir(version) : undefined;

describe('recorded API fixtures', () => {
    if (!version || !fixtureDir || !existsSync(fixtureDir)) {
        it.skip('no recorded fixtures in test/fixtures/local (run npm run record:api)', () => { });
        return;
    }

    const files = readdirSync(fixtureDir).filter(file => file.endsWith('.json'));
    const documents = files.map(file => ({
        file,
        raw: readFileSync(path.join(fixtureDir, file), 'utf8'),
        document: JSON.parse(readFileSync(path.join(fixtureDir, file), 'utf8')) as {
            endpoint: string;
            recordedAt: string;
            anonymized: boolean;
            params?: Record<string, unknown>;
            response?: unknown;
        },
    }));

    // secrets are only known when the .env exists; the anonymization check then also covers them
    const config = getLiveConfig();
    const secrets = config ? [new URL(config.url).hostname, config.user, config.password] : [];

    it('contains at least one fixture', () => {
        expect(files).to.not.be.empty;
    });

    it('stores endpoint, recording time and anonymized flag in every file', () => {
        for (const { file, document } of documents) {
            expect(document.endpoint, file).to.equal(path.basename(file, '.json'));
            expect(new Date(document.recordedAt).toString(), file).to.not.equal('Invalid Date');
            expect(document.anonymized, file).to.be.a('boolean');
            expect(document.response, file).to.not.be.undefined;
        }
    });

    it('matches the version directory to the hwInfo fixture', () => {
        const hwInfo = documents.find(({ document }) => document.endpoint === 'hwInfo');
        expect(hwInfo, 'hwInfo.json').to.not.be.undefined;
        expect(versionFromHwInfo(hwInfo?.document.response)).to.equal(version);
    });

    it('contains no leaks in anonymized fixtures', () => {
        for (const { file, raw, document } of documents) {
            if (document.anonymized) {
                expect(findLeaks(raw, secrets), file).to.deep.equal([]);
            }
        }
    });
});
