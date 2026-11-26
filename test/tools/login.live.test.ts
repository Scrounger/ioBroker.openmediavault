/**
 * Live-Test: Login und Logout gegen den OpenMediaVault-Server.
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

describe('live: login', function () {
    this.timeout(60000);

    let api: OmvApi | undefined;

    before(function () {
        if (!config) {
            console.warn('[live] .env mit OMV_URL, OMV_USER und OMV_PASSWORD fehlt, Login-Tests werden übersprungen.');
            this.skip();
        }
        api = createApi(config!);
    });

    after(async () => {
        await api?.logout();
    });

    it('logs in with the credentials from .env', async () => {
        await api!.login();

        expect(api!.isConnected, 'isConnected').to.be.true;
        expect(api!.lastLogin?.isValid(), 'lastLogin is a valid dayjs object').to.be.true;
    });

    it('returns data for an endpoint after login', async () => {
        const hwInfo = await api!.retrievData(ApiEndpoints.hwInfo);

        expect(hwInfo, 'hwInfo').to.be.an('object');
    });

    it('logs out and clears the connection status', async () => {
        await api!.logout();

        expect(api!.isConnected, 'isConnected after logout').to.be.false;

        // erneut einloggen, damit der after-Hook und folgende Tests eine aktive Session haben
        await api!.login();
        expect(api!.isConnected, 'isConnected after re-login').to.be.true;
    });

    it('rejects a wrong password', async () => {
        const wrong = createApi({ ...config!, password: `${config!.password}-wrong-live-test` });

        await wrong.login();

        expect(wrong.isConnected, 'isConnected with wrong password').to.be.false;
    });
});
