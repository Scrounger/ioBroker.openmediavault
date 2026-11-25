/**
 * Live-Test: Struktur der Antworten der OpenMediaVault-RPC-Endpoints.
 *
 * Prüft, ob die Felder vorhanden sind, die der Adapter für Objekte und IDs benötigt
 * (siehe src/lib/tree/*.ts). Schlägt ein Test fehl, hat sich die OMV-API
 * gegenüber der Adapter-Definition geändert.
 *
 * Voraussetzung: .env mit OMV_URL, OMV_USER, OMV_PASSWORD (siehe omv-session.ts).
 * Ohne vollständige .env werden die Tests übersprungen.
 *
 * Start: npm run test:live
 */
import { expect } from 'chai';
import { ApiEndpoints, OmvApi } from '../../src/lib/omv-rpc.js';
import { createApi, getLiveConfig } from './omv-session.js';

const config = getLiveConfig();

describe('live: api responses', function () {
    this.timeout(60000);

    let api: OmvApi | undefined;

    before(async function () {
        if (!config) {
            console.warn('[live] .env mit OMV_URL, OMV_USER und OMV_PASSWORD fehlt, API-Tests werden übersprungen.');
            this.skip();
        }
        api = createApi(config!);
        await api!.login();
        expect(api!.isConnected, 'login before API tests').to.be.true;
    });

    after(async () => {
        await api?.logout();
    });

    it('hwInfo contains hostname and cpuCores', async () => {
        const hwInfo = await api!.retrievData(ApiEndpoints.hwInfo);

        expect(hwInfo, 'hwInfo').to.be.an('object');
        expect(hwInfo.hostname, 'hostname').to.be.a('string').that.is.not.empty;
        expect(hwInfo.cpuCores, 'cpuCores').to.be.a('string').that.is.not.empty;
    });

    it('disk returns a list of devices with devicename', async () => {
        const disks = await api!.retrievData(ApiEndpoints.disk);

        expect(disks, 'disk list').to.be.an('array');
        for (const disk of disks) {
            expect(disk.devicename, `disk ${JSON.stringify(disk)}`).to.be.a('string');
        }
    });

    it('fileSystem returns a list of file systems', async () => {
        const fileSystems = await api!.retrievData(ApiEndpoints.fileSystem);

        expect(fileSystems, 'fileSystem list').to.be.an('array');
        for (const fs of fileSystems) {
            expect(fs, 'fileSystem entry').to.be.an('object');
        }
    });

    it('smart returns a list of devices with devicename', async () => {
        const smart = await api!.retrievData(ApiEndpoints.smart);

        expect(smart, 'smart list').to.be.an('array');
        for (const device of smart) {
            expect(device.devicename, `smart ${JSON.stringify(device)}`).to.be.a('string');
        }
    });

    it('shareMgmt returns shares with uuid and name', async () => {
        const shares = await api!.retrievData(ApiEndpoints.shareMgmt);

        expect(shares, 'shareMgmt list').to.be.an('array');
        for (const share of shares) {
            expect(share.uuid, `shareMgmt ${JSON.stringify(share)}`).to.be.a('string').that.is.not.empty;
            expect(share.name, `shareMgmt name ${JSON.stringify(share)}`).to.be.a('string');
        }
    });

    it('smb returns SMB shares with uuid and sharedfoldername', async () => {
        const smb = await api!.retrievData(ApiEndpoints.smb);

        expect(smb, 'smb list').to.be.an('array');
        for (const share of smb) {
            expect(share.uuid, `smb ${JSON.stringify(share)}`).to.be.a('string').that.is.not.empty;
            expect(share.sharedfoldername, `smb name ${JSON.stringify(share)}`).to.be.a('string');
        }
    });
});
