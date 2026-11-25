import { expect } from 'chai';
import moment from 'moment';
import { AbortError } from 'node-fetch';
import https from 'node:https';
import sinon from 'sinon';
import { ApiEndpoints, OmvApi } from '../../../src/lib/omv-rpc.js';
import { createLogStub } from '../helpers/mainAdapter.js';

/**
 * Creates a minimal ioBroker adapter double for `OmvApi`.
 */
function createAdapterStub(config: Record<string, unknown> = {}): any {
    return {
        config: {
            url: 'http://omv.local',
            user: 'admin',
            password: 'secret',
            connectionTimeout: 1000,
            ignoreSSLCertificate: false,
            ...config,
        },
        log: createLogStub(),
        connected: false,
        setState: sinon.stub().resolves(),
    };
}

/**
 * Creates a response double compatible with the parts of `node-fetch` used by `OmvApi`.
 */
function createResponse(body: unknown, ok = true, status = 200, statusText = 'OK'): any {
    return {
        ok,
        status,
        statusText,
        json: sinon.stub().resolves(body),
    };
}

/**
 * Replaces the cookie aware fetch function of an `OmvApi` instance with a stub.
 */
function stubFetch(api: OmvApi, impl?: sinon.SinonStub): sinon.SinonStub {
    const stub = impl ?? sinon.stub();
    (api as any).fetchWithCookies = stub;
    return stub;
}

describe('OmvApi', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('constructor', () => {
        it('builds the rpc url from the configured url', () => {
            const api = new OmvApi(createAdapterStub());

            expect(api.url?.toString()).to.equal('http://omv.local/rpc.php');
            expect(api.httpsAgent).to.be.undefined;
            expect(api.isConnected).to.be.false;
            expect(api.lastLogin).to.be.null;
        });

        it('creates an https agent that ignores certificate errors when configured', () => {
            const api = new OmvApi(createAdapterStub({ url: 'https://omv.local', ignoreSSLCertificate: true }));

            expect(api.url?.protocol).to.equal('https:');
            expect(api.httpsAgent).to.be.instanceOf(https.Agent);
        });

        it('does not create an https agent for http urls', () => {
            const api = new OmvApi(createAdapterStub({ ignoreSSLCertificate: true }));

            expect(api.httpsAgent).to.be.undefined;
        });

        it('sets url to undefined and logs an error for an invalid url', () => {
            const adapter = createAdapterStub({ url: 'http://[invalid' });
            const api = new OmvApi(adapter);

            expect(api.url).to.be.undefined;
            expect(adapter.log.error).to.have.been.calledOnce;
        });
    });

    describe('login', () => {
        it('sends the login request and marks the connection as established', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            const fetchStub = stubFetch(api, sinon.stub().resolves(createResponse({ response: { authenticated: true } })));

            await api.login();

            expect(fetchStub).to.have.been.calledOnce;
            const [requestUrl, options] = fetchStub.firstCall.args;
            expect(requestUrl).to.equal('http://omv.local/rpc.php');
            expect(options.method).to.equal('POST');
            expect(JSON.parse(options.body)).to.deep.equal({
                service: 'session',
                method: 'login',
                params: { username: 'admin', password: 'secret' },
            });

            expect(api.isConnected).to.be.true;
            expect(adapter.connected).to.be.true;
            expect(moment.isMoment(api.lastLogin)).to.be.true;
            expect(adapter.setState).to.have.been.calledWith('info.connection', true, true);
            expect(adapter.log.info).to.have.been.calledWithMatch('login to OpenMediaVault successful');
        });

        it('accepts the newer status structure of OpenMediaVault 8.5 and later', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse({ response: { status: 'authenticated' } })));

            await api.login();

            expect(api.isConnected).to.be.true;
        });

        it('logs an error and disconnects when authentication is rejected', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse({ response: { authenticated: false } })));

            await api.login();

            expect(api.isConnected).to.be.false;
            expect(adapter.log.error).to.have.been.calledWithMatch('OpenMediaVault authenticated failed');
            expect(adapter.setState).to.have.been.calledWith('info.connection', false, true);
        });

        it('logs an error when the response contains no data', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse(null)));

            await api.login();

            expect(api.isConnected).to.be.false;
            expect(adapter.log.error).to.have.been.calledWithMatch('no data in repsonse');
        });

        it('logs an error on an http error status', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse({}, false, 401, 'Unauthorized')));

            await api.login();

            expect(api.isConnected).to.be.false;
            expect(adapter.log.error).to.have.been.calledWithMatch('HTTP error! Status: 401 - Unauthorized');
        });

        it('does not send a request when the url is invalid', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            api.url = undefined;
            const fetchStub = stubFetch(api);

            await api.login();

            expect(fetchStub).to.not.have.been.called;
            expect(adapter.log.error).to.have.been.calledWithMatch('is not valid');
            expect(api.isConnected).to.be.false;
        });

        it('logs a timeout when the request is aborted', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().rejects(new AbortError('aborted')));

            await api.login();

            expect(adapter.log.error).to.have.been.calledWithMatch('Timeout');
            expect(api.isConnected).to.be.false;
        });

        it('logs unexpected errors', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().rejects(new Error('network down')));

            await api.login();

            expect(adapter.log.error).to.have.been.calledWithMatch('network down');
            expect(api.isConnected).to.be.false;
        });

        it('logs an error when the connection state cannot be stored', async () => {
            const adapter = createAdapterStub();
            adapter.setState = sinon.stub().rejects(new Error('state write failed'));
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse({ response: { authenticated: true } })));

            await api.login();

            expect(adapter.log.error).to.have.been.calledWithMatch('state write failed');
        });
    });

    describe('retrievData', () => {
        it('returns the data of the response', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            const fetchStub = stubFetch(api, sinon.stub().resolves(createResponse({ response: { data: [{ id: 1 }] } })));

            const result = await api.retrievData(ApiEndpoints.disk);

            expect(result).to.deep.equal([{ id: 1 }]);
            const body = JSON.parse(fetchStub.firstCall.args[1].body);
            expect(body).to.deep.equal({ service: 'DiskMgmt', method: 'enumerateDevices', params: null });
        });

        it('returns the whole response when no data property exists', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse({ response: { total: 3 } })));

            const result = await api.retrievData(ApiEndpoints.fileSystem);

            expect(result).to.deep.equal({ total: 3 });
        });

        it('passes params to the request body and logs them', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            const fetchStub = stubFetch(api, sinon.stub().resolves(createResponse({ response: { data: {} } })));

            await api.retrievData(ApiEndpoints.smartInfo, { devicefile: '/dev/sda' });

            const body = JSON.parse(fetchStub.firstCall.args[1].body);
            expect(body.params).to.deep.equal({ devicefile: '/dev/sda' });
            expect(adapter.log.silly).to.have.been.calledWithMatch('/dev/sda');
        });

        it('returns undefined without request when the url is invalid', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            api.url = undefined;
            const fetchStub = stubFetch(api);

            const result = await api.retrievData(ApiEndpoints.hwInfo);

            expect(result).to.be.undefined;
            expect(fetchStub).to.not.have.been.called;
            expect(adapter.log.error).to.have.been.calledWithMatch('is not valid');
        });

        it('logs the error message of the api and returns undefined', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse({ error: 'permission denied' })));

            const result = await api.retrievData(ApiEndpoints.shareMgmt);

            expect(result).to.be.undefined;
            expect(adapter.log.error).to.have.been.calledWithMatch('permission denied');
        });

        it('logs missing data and returns undefined', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse(null)));

            const result = await api.retrievData(ApiEndpoints.smb);

            expect(result).to.be.undefined;
            expect(adapter.log.error).to.have.been.calledWithMatch('no data in repsonse');
        });

        it('logs an http error, marks the connection as lost and returns undefined', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().resolves(createResponse({}, false, 500, 'Internal Server Error')));

            const result = await api.retrievData(ApiEndpoints.smart);

            expect(result).to.be.undefined;
            expect(adapter.log.error).to.have.been.calledWithMatch('HTTP error! Status: 500');
            expect(adapter.setState).to.have.been.calledWith('info.connection', false, true);
        });

        it('logs a timeout when the request is aborted', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().rejects(new AbortError('aborted')));

            const result = await api.retrievData(ApiEndpoints.network);

            expect(result).to.be.undefined;
            expect(adapter.log.error).to.have.been.calledWithMatch('Timeout');
        });

        it('logs unexpected errors and returns undefined', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            stubFetch(api, sinon.stub().rejects(new Error('socket hang up')));

            const result = await api.retrievData(ApiEndpoints.plugin);

            expect(result).to.be.undefined;
            expect(adapter.log.error).to.have.been.calledWithMatch('socket hang up');
        });
    });

    describe('logout', () => {
        it('does nothing on the network when not connected', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            const fetchStub = stubFetch(api);

            await api.logout();

            expect(fetchStub).to.not.have.been.called;
            expect(adapter.log.info).to.have.been.calledWithMatch('no logout is needed');
            expect(adapter.setState).to.have.been.calledWith('info.connection', false, true);
        });

        it('sends the logout request when connected', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            api.isConnected = true;
            const fetchStub = stubFetch(api, sinon.stub().resolves(createResponse({ response: 'ok' })));

            await api.logout();

            const body = JSON.parse(fetchStub.firstCall.args[1].body);
            expect(body).to.deep.equal({ service: 'session', method: 'logout', params: null });
            expect(adapter.log.info).to.have.been.calledWithMatch('logout from OpenMediaVault successful');
            expect(adapter.log.info).to.have.been.calledWith(JSON.stringify({ response: 'ok' }));
            expect(adapter.setState).to.have.been.calledWith('info.connection', false, true);
        });

        it('does not send a request when the url is invalid', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            api.isConnected = true;
            api.url = undefined;
            const fetchStub = stubFetch(api);

            await api.logout();

            expect(fetchStub).to.not.have.been.called;
            expect(adapter.log.error).to.have.been.calledWithMatch('is not valid');
        });

        it('does not log success for an http error', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            api.isConnected = true;
            stubFetch(api, sinon.stub().resolves(createResponse({}, false, 403, 'Forbidden')));

            await api.logout();

            expect(adapter.log.info).to.not.have.been.calledWithMatch('successful');
        });

        it('logs a timeout when the request is aborted', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            api.isConnected = true;
            stubFetch(api, sinon.stub().rejects(new AbortError('aborted')));

            await api.logout();

            expect(adapter.log.error).to.have.been.calledWithMatch('Timeout');
        });

        it('logs unexpected errors', async () => {
            const adapter = createAdapterStub();
            const api = new OmvApi(adapter);
            api.isConnected = true;
            stubFetch(api, sinon.stub().rejects(new Error('logout broken')));

            await api.logout();

            expect(adapter.log.error).to.have.been.calledWithMatch('logout broken');
        });
    });

    describe('getEndpointData', () => {
        it('maps every endpoint to a service and method', () => {
            const api = new OmvApi(createAdapterStub());

            const expected: Record<string, [string, string]> = {
                [ApiEndpoints.logout]: ['session', 'logout'],
                [ApiEndpoints.hwInfo]: ['System', 'getInformation'],
                [ApiEndpoints.disk]: ['DiskMgmt', 'enumerateDevices'],
                [ApiEndpoints.smart]: ['Smart', 'getList'],
                [ApiEndpoints.smartInfo]: ['Smart', 'getInformation'],
                [ApiEndpoints.smartAttributes]: ['Smart', 'getAttributes'],
                [ApiEndpoints.fileSystem]: ['FileSystemMgmt', 'getList'],
                [ApiEndpoints.shareMgmt]: ['ShareMgmt', 'enumerateSharedFolders'],
                [ApiEndpoints.smb]: ['SMB', 'getShareList'],
                [ApiEndpoints.fsTab]: ['FsTab', 'enumerateEntries'],
                [ApiEndpoints.service]: ['Services', 'getStatus'],
                [ApiEndpoints.plugin]: ['Plugin', 'enumeratePlugins'],
                [ApiEndpoints.network]: ['Network', 'enumerateDevices'],
                [ApiEndpoints.kvm]: ['Kvm', 'getVmList'],
            };

            for (const [endpoint, [service, method]] of Object.entries(expected)) {
                const data = (api as any).getEndpointData(endpoint);
                expect(data, endpoint).to.include({ service, method });
            }
        });

        it('falls back to System.getInformation for unknown endpoints', () => {
            const api = new OmvApi(createAdapterStub());

            const data = (api as any).getEndpointData('unknown');

            expect(data).to.deep.equal({ service: 'System', method: 'getInformation', params: null });
        });

        it('uses start and limit parameters for list endpoints', () => {
            const api = new OmvApi(createAdapterStub());

            expect((api as any).getEndpointData(ApiEndpoints.smart).params).to.deep.equal({ start: 0, limit: -1 });
            expect((api as any).getEndpointData(ApiEndpoints.fileSystem).params).to.deep.equal({ start: 0, limit: -1 });
            expect((api as any).getEndpointData(ApiEndpoints.shareMgmt).params).to.deep.equal({ start: 0, limit: -1 });
            expect((api as any).getEndpointData(ApiEndpoints.smb).params).to.deep.equal({ start: 0, limit: -1 });
        });
    });
});
