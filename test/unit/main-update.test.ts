import * as utils from '@iobroker/adapter-core';
import { expect } from 'chai';
import dayjs from 'dayjs';
import sinon from 'sinon';
import { OmvApi } from '../../src/lib/omv-rpc.js';
import * as tree from '../../src/lib/tree/index.js';
import { describeWithFixtures, getFixtureRecords, getFixtureResponse } from './helpers/fixtures.js';
import { createMainAdapter, DEFAULT_CONFIG } from './helpers/mainAdapter.js';

/** Adapters with a cron job. Their jobs are cancelled after each test, otherwise mocha would not exit. */
const createdAdapters: any[] = [];

/**
 * Creates an adapter with timer, object and state methods replaced by stubs, so no real timers or
 * database calls happen.
 *
 * @param overrides values to set on the instance
 */
function createAdapter(overrides: Record<string, unknown> = {}): any {
    const adapter = createMainAdapter({
        setTimeout: sinon.stub().returns(1),
        clearTimeout: sinon.stub(),
        objectExists: sinon.stub().resolves(false),
        delObjectAsync: sinon.stub().resolves(),
        setState: sinon.stub().resolves(),
        ...overrides,
    });
    createdAdapters.push(adapter);
    return adapter;
}

afterEach(() => {
    sinon.restore();
    for (const adapter of createdAdapters.splice(0)) {
        adapter.updateSchedule?.cancel();
    }
});

describe('onReady', () => {
    beforeEach(() => {
        sinon.stub((utils as any).I18n, 'init').resolves();
        sinon.stub((utils as any).I18n, 'getTranslatedObject').callsFake((key: string) => ({ en: key }));
    });

    it('warns and does not create the API when url, user or password is missing', async () => {
        const adapter = createAdapter({ config: { ...DEFAULT_CONFIG, url: '', user: 'admin', password: '' } });

        await adapter.onReady();

        expect((utils as any).I18n.init).to.have.been.calledOnce;
        expect(adapter.log.warn).to.have.been.calledWith('[onReady]: url and / or login data missing!');
        expect(adapter.omvApi).to.be.undefined;
        expect(adapter.myIob).to.exist;
    });

    it('creates the API and runs the first update when all login data is set', async () => {
        const login = sinon.stub(OmvApi.prototype, 'login').resolves();
        const adapter = createAdapter({
            config: { ...DEFAULT_CONFIG, url: 'https://omv.local', user: 'admin', password: 'secret' },
        });

        await adapter.onReady();

        expect(adapter.omvApi).to.be.instanceOf(OmvApi);
        expect(login).to.have.been.calledOnce;
        expect(adapter.setTimeout).to.have.been.calledOnceWith(sinon.match.func, DEFAULT_CONFIG.updateInterval * 1000);
        // findMissingTranslation may warn about the stubbed translations, but never about missing login data
        expect(adapter.log.warn).to.not.have.been.calledWith('[onReady]: url and / or login data missing!');
    });

    it('logs an error when the initialisation fails', async () => {
        (utils as any).I18n.init.rejects(new Error('i18n failed'));
        const adapter = createAdapter();

        await adapter.onReady();

        expect(adapter.log.error).to.have.been.calledWithMatch('[onReady]: error: Error: i18n failed');
    });
});

describe('updateData', () => {
    it('starts a timeout with the update interval when no cron job is used', async () => {
        const adapter = createAdapter({ config: { ...DEFAULT_CONFIG, updateMethode: false, updateInterval: 120 } });

        await adapter.updateData(true);

        expect(adapter.setTimeout).to.have.been.calledOnceWith(sinon.match.func, 120_000);
        expect(adapter.updateTimeout).to.equal(1);
        expect(adapter.updateSchedule).to.be.undefined;
    });

    it('replaces an existing update timeout', async () => {
        const adapter = createAdapter({ updateTimeout: 42 });

        await adapter.updateData();

        expect(adapter.clearTimeout).to.have.been.calledOnceWith(42);
        expect(adapter.updateTimeout).to.equal(1);
    });

    it('runs a new update when the timeout fires', async () => {
        const adapter = createAdapter();

        await adapter.updateData(true);
        const updateDataStub = sinon.stub(adapter, 'updateData').resolves();
        const timeoutCallback = adapter.setTimeout.firstCall.args[0];
        await timeoutCallback();

        expect(updateDataStub).to.have.been.calledOnceWithExactly();
    });

    it('starts the cron job on adapter start when update method is cron', async () => {
        const adapter = createAdapter({ config: { ...DEFAULT_CONFIG, updateMethode: true, updateCron: '0 0 1 1 *' } });

        await adapter.updateData(true);

        expect(adapter.updateSchedule).to.exist;
        expect(adapter.setTimeout).to.not.have.been.called;
        expect(adapter.log.info).to.have.been.calledWithMatch("starting cron job with parameter '0 0 1 1 *'");
    });

    it('does not start another cron job on regular updates', async () => {
        const adapter = createAdapter({ config: { ...DEFAULT_CONFIG, updateMethode: true, updateCron: '0 0 1 1 *' } });

        await adapter.updateData(false);

        expect(adapter.updateSchedule).to.be.undefined;
    });

    it('logs in when the API is not connected', async () => {
        const login = sinon.stub().resolves();
        const adapter = createAdapter({ omvApi: { isConnected: false, lastLogin: null, MAX_LOGIN_AGE_MINUTES: 30, login } });

        await adapter.updateData();

        expect(login).to.have.been.calledOnce;
    });

    it('logs in again and logs a debug message when the session is too old', async () => {
        const login = sinon.stub().resolves();
        const adapter = createAdapter({
            omvApi: { isConnected: true, lastLogin: dayjs().subtract(31, 'minute'), MAX_LOGIN_AGE_MINUTES: 30, login },
        });

        await adapter.updateData();

        expect(login).to.have.been.calledOnce;
        expect(adapter.log.debug).to.have.been.calledWithMatch('re-login because session id expired');
    });

    it('does not log in when the session is still valid', async () => {
        const login = sinon.stub().resolves();
        const adapter = createAdapter({
            omvApi: { isConnected: true, lastLogin: dayjs(), MAX_LOGIN_AGE_MINUTES: 30, login },
        });

        await adapter.updateData();

        expect(login).to.not.have.been.called;
    });

    it('logs an error when the login fails', async () => {
        const adapter = createAdapter({
            omvApi: { isConnected: false, lastLogin: null, MAX_LOGIN_AGE_MINUTES: 30, login: sinon.stub().rejects(new Error('login failed')) },
        });

        await adapter.updateData();

        expect(adapter.log.error).to.have.been.calledWithMatch('login failed');
    });

    it('updates every endpoint that has iob definitions when connected', async () => {
        const adapter = createAdapter({
            connected: true,
            omvApi: { isConnected: true, lastLogin: dayjs(), MAX_LOGIN_AGE_MINUTES: 30, login: sinon.stub().resolves() },
        });
        const updateDataGeneric = sinon.stub(adapter, 'updateDataGeneric').resolves();
        const expectedCount = Object.keys(tree).filter(key => Object.hasOwn((tree as any)[key], 'iobObjectDefintions')).length;

        await adapter.updateData(true);

        expect(updateDataGeneric.callCount).to.equal(expectedCount);
        for (const call of updateDataGeneric.getCalls()) {
            expect(call.args[3]).to.be.true;
        }
    });

    it('does not update any endpoint when not connected', async () => {
        const adapter = createAdapter({
            connected: false,
            omvApi: { isConnected: true, lastLogin: dayjs(), MAX_LOGIN_AGE_MINUTES: 30, login: sinon.stub().resolves() },
        });
        const updateDataGeneric = sinon.stub(adapter, 'updateDataGeneric').resolves();

        await adapter.updateData();

        expect(updateDataGeneric).to.not.have.been.called;
    });

    it('logs a warning for endpoints without iob definitions in debug mode', async () => {
        const disk: any = tree.disk;
        const descriptor = Object.getOwnPropertyDescriptor(disk, 'iobObjectDefintions');
        const adapter = createAdapter({
            connected: true,
            omvApi: { isConnected: true, lastLogin: dayjs(), MAX_LOGIN_AGE_MINUTES: 30, login: sinon.stub().resolves() },
        });
        adapter.log.level = 'debug';
        const updateDataGeneric = sinon.stub(adapter, 'updateDataGeneric').resolves();

        delete disk.iobObjectDefintions;
        try {
            await adapter.updateData();
        } finally {
            if (descriptor) {
                Object.defineProperty(disk, 'iobObjectDefintions', descriptor);
            }
        }

        expect(adapter.log.warn).to.have.been.calledWithMatch('no iob definitions for endpoint disk exists!');
        const endpoints = updateDataGeneric.getCalls().map(call => call.args[0]);
        expect(endpoints).to.not.include('disk');
    });

    it('logs an error when an endpoint update throws', async () => {
        const adapter = createAdapter({
            connected: true,
            omvApi: { isConnected: true, lastLogin: dayjs(), MAX_LOGIN_AGE_MINUTES: 30, login: sinon.stub().resolves() },
        });
        sinon.stub(adapter, 'updateDataGeneric').rejects(new Error('endpoint failed'));

        await adapter.updateData();

        expect(adapter.log.error).to.have.been.calledWithMatch('endpoint failed');
    });
});

describe('updateDataGeneric', () => {
    const ENDPOINT = 'disk';

    const treeType: any = {
        idChannel: 'openmediavault.0.disk',
        get: () => ({ temperature: { iobType: 'number', read: true, write: false } }),
    };

    /** Creates a device based definition. Tests override single properties as needed. */
    const createDefinitions = (overrides: Record<string, unknown> = {}): any => ({
        channelName: 'Disk',
        deviceIdProperty: 'serial',
        deviceNameProperty: 'devicename',
        ...overrides,
    });

    /**
     * Creates an adapter with an API stub and a myIob stub for the `disk` endpoint.
     *
     * @param config adapter config values, e.g. `diskEnabled`
     * @param overrides values to set on the instance
     */
    function createGenericAdapter(config: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}): any {
        const retrievData = sinon.stub().resolves([]);
        const myIobStub = {
            createOrUpdateChannel: sinon.stub().resolves(),
            createOrUpdateDevice: sinon.stub().resolves(),
            createOrUpdateStates: sinon.stub().resolves(),
        };
        return createAdapter({
            connected: true,
            config: { ...DEFAULT_CONFIG, diskEnabled: true, ...config },
            omvApi: { isConnected: true, retrievData },
            myIob: myIobStub,
            ...overrides,
        });
    }

    it('deletes the channel of a disabled endpoint if it exists', async () => {
        const adapter = createGenericAdapter({ diskEnabled: false });
        adapter.objectExists = sinon.stub().resolves(true);

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), false);

        expect(adapter.delObjectAsync).to.have.been.calledOnceWith('openmediavault.0.disk', { recursive: true });
        expect(adapter.log.debug).to.have.been.calledWithMatch("'openmediavault.0.disk' deleted");
        expect(adapter.omvApi.retrievData).to.not.have.been.called;
    });

    it('does nothing for a disabled endpoint without existing channel', async () => {
        const adapter = createGenericAdapter({ diskEnabled: false });

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), false);

        expect(adapter.delObjectAsync).to.not.have.been.called;
        expect(adapter.omvApi.retrievData).to.not.have.been.called;
    });

    it('does nothing when not connected', async () => {
        const adapter = createGenericAdapter({}, { connected: false });

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), true);

        expect(adapter.omvApi.retrievData).to.not.have.been.called;
        expect(adapter.myIob.createOrUpdateChannel).to.not.have.been.called;
    });

    it('does nothing when the adapter has no myIob instance', async () => {
        const adapter = createGenericAdapter({}, { myIob: undefined });

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), true);

        expect(adapter.omvApi.retrievData).to.not.have.been.called;
    });

    it('creates the channel on adapter start and updates the states of a single object', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves({ temperature: 42 });
        const data = { temperature: 42 };

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), true);

        expect(adapter.myIob.createOrUpdateChannel).to.have.been.calledOnceWith('openmediavault.0.disk', 'Disk', undefined, true);
        expect(adapter.myIob.createOrUpdateStates).to.have.been.calledOnce;
        const [id, def, treeData, channelData, options] = adapter.myIob.createOrUpdateStates.firstCall.args;
        expect(id).to.equal('openmediavault.0.disk');
        expect(def).to.deep.equal(treeType.get());
        expect(treeData).to.deep.equal(data);
        expect(channelData).to.deep.equal(data);
        expect(options).to.deep.equal({ blacklistFilter: [], isWhiteList: false, logDeviceName: 'Disk', updateObject: true });
        expect(adapter.log.info).to.have.been.calledWithMatch('data successfully updated');
    });

    it('does not create the channel on regular updates', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves({ temperature: 42 });

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), false);

        expect(adapter.myIob.createOrUpdateChannel).to.not.have.been.called;
        expect(adapter.myIob.createOrUpdateStates).to.have.been.calledOnce;
        expect(adapter.log.info).to.not.have.been.called;
    });

    it('uses the configured state blacklist and whitelist', async () => {
        const blacklist = [{ id: 'temperature' }];
        const adapter = createGenericAdapter({ diskStatesBlackList: blacklist, diskStatesIsWhiteList: true });
        adapter.omvApi.retrievData.resolves({ temperature: 42 });

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), false);

        const options = adapter.myIob.createOrUpdateStates.firstCall.args[4];
        expect(options.blacklistFilter).to.deep.equal(blacklist);
        expect(options.isWhiteList).to.be.true;
    });

    it('does not retrieve data when the API returns nothing', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves(null);

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), true);

        expect(adapter.myIob.createOrUpdateStates).to.not.have.been.called;
        expect(adapter.log.info).to.not.have.been.called;
    });

    it('creates a device for every entry of an array response', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves([{ serial: 'S1', devicename: 'sda', temperature: 30 }]);

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), true);

        expect(adapter.myIob.createOrUpdateDevice).to.have.been.calledOnce;
        const [idDevice, name, options] = adapter.myIob.createOrUpdateDevice.firstCall.args;
        expect(idDevice).to.equal('openmediavault.0.disk.S1');
        expect(name).to.equal('sda');
        expect(options.updateObject).to.be.true;
        expect(options.logChanges).to.be.true;
        expect(options.onlineId).to.be.undefined;
        expect(options.errorId).to.be.undefined;

        expect(adapter.myIob.createOrUpdateStates).to.have.been.calledOnce;
        const stateOptions = adapter.myIob.createOrUpdateStates.firstCall.args[4];
        expect(stateOptions).to.deep.equal({ blacklistFilter: [], isWhiteList: false, logDeviceName: 'sda', updateObject: true });

        expect(adapter.configDevicesCache.disk).to.deep.equal([{ label: 'sda (S1)', value: 'S1' }]);
    });

    it('passes the online and error state ids to the device', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves([{ serial: 'S1', devicename: 'sda' }]);
        const definitions = createDefinitions({ deviceIsOnlineState: 'online', deviceHasErrorsState: 'errors' });

        await adapter.updateDataGeneric(ENDPOINT, treeType, definitions, false);

        const options = adapter.myIob.createOrUpdateDevice.firstCall.args[2];
        expect(options.onlineId).to.equal('openmediavault.0.disk.S1.online');
        expect(options.errorId).to.equal('openmediavault.0.disk.S1.errors');
        expect(options.updateObject).to.be.false;
    });

    it('uses function based device id and name properties', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves([{ serial: 'S1', devicename: 'sda' }]);
        const definitions = createDefinitions({
            deviceIdProperty: (device: any) => device.serial,
            deviceNameProperty: (device: any, adapterArg: any) => `Name ${device.serial} (${adapterArg === adapter})`,
        });

        await adapter.updateDataGeneric(ENDPOINT, treeType, definitions, false);

        expect(adapter.myIob.createOrUpdateDevice.firstCall.args[0]).to.equal('openmediavault.0.disk.S1');
        expect(adapter.myIob.createOrUpdateDevice.firstCall.args[1]).to.equal('Name S1 (true)');
    });

    it('uses "unknown" as device name when the name property is not defined', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves([{ serial: 'S1' }]);
        const definitions = createDefinitions({ deviceNameProperty: undefined });

        await adapter.updateDataGeneric(ENDPOINT, treeType, definitions, false);

        expect(adapter.myIob.createOrUpdateDevice.firstCall.args[1]).to.equal('unknown');
        expect(adapter.configDevicesCache.disk[0].label).to.equal('unknown (S1)');
    });

    it('processes only the listed devices when the device list is a whitelist', async () => {
        const adapter = createGenericAdapter({ diskIsWhiteList: true, diskBlackList: [{ id: 'S1' }] });
        adapter.omvApi.retrievData.resolves([
            { serial: 'S1', devicename: 'sda' },
            { serial: 'S2', devicename: 'sdb' },
        ]);

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), false);

        expect(adapter.myIob.createOrUpdateDevice).to.have.been.calledOnce;
        expect(adapter.myIob.createOrUpdateDevice.firstCall.args[0]).to.equal('openmediavault.0.disk.S1');
        expect(adapter.delObjectAsync).to.not.have.been.called;
    });

    it('deletes devices that are on the blacklist on adapter start', async () => {
        const adapter = createGenericAdapter({ diskBlackList: [{ id: 'S1' }] });
        adapter.objectExists = sinon.stub().resolves(true);
        adapter.omvApi.retrievData.resolves([{ serial: 'S1', devicename: 'sda' }]);

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), true);

        expect(adapter.myIob.createOrUpdateDevice).to.not.have.been.called;
        expect(adapter.delObjectAsync).to.have.been.calledOnceWith('openmediavault.0.disk.S1', { recursive: true });
        expect(adapter.log.warn).to.have.been.calledWithMatch("it's on the blacklist");
    });

    it('deletes devices that are not on the whitelist on adapter start', async () => {
        const adapter = createGenericAdapter({ diskIsWhiteList: true, diskBlackList: [{ id: 'S1' }] });
        adapter.objectExists = sinon.stub().resolves(true);
        adapter.omvApi.retrievData.resolves([{ serial: 'S2', devicename: 'sdb' }]);

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), true);

        expect(adapter.myIob.createOrUpdateDevice).to.not.have.been.called;
        expect(adapter.delObjectAsync).to.have.been.calledOnceWith('openmediavault.0.disk.S2', { recursive: true });
        expect(adapter.log.warn).to.have.been.calledWithMatch("it's not on the whitelist");
    });

    it('does not delete a filtered device that has no channel', async () => {
        const adapter = createGenericAdapter({ diskBlackList: [{ id: 'S1' }] });
        adapter.omvApi.retrievData.resolves([{ serial: 'S1', devicename: 'sda' }]);

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), true);

        expect(adapter.delObjectAsync).to.not.have.been.called;
    });

    it('logs an error for a device without id value', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves([{ devicename: 'sda' }]);

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), false);

        expect(adapter.log.error).to.have.been.calledWithMatch('deviceIdProperty for device not exists!');
        expect(adapter.myIob.createOrUpdateDevice).to.not.have.been.called;
    });

    it('logs an error when the tree definition has no deviceIdProperty', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.resolves([{ serial: 'S1', devicename: 'sda' }]);
        const definitions = createDefinitions({ deviceIdProperty: undefined });

        await adapter.updateDataGeneric(ENDPOINT, treeType, definitions, false);

        expect(adapter.log.error).to.have.been.calledWithMatch('deviceIdProperty property not exists in tree definition!');
        expect(adapter.myIob.createOrUpdateDevice).to.not.have.been.called;
    });

    it('merges converted additional data into the device', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.withArgs(ENDPOINT).resolves([{ serial: 'S1', devicename: 'sda', hasInfo: true }]);
        adapter.omvApi.retrievData.withArgs('diskInfo', { serial: 'S1' }).resolves({ model: 'WD', serial: 'other' });
        const definitions = createDefinitions({
            additionalRequest: [{
                conditionProperty: 'hasInfo',
                endpoint: 'diskInfo',
                paramsProperty: 'serial',
                converter: (data: any) => ({ model: data.model }),
            }],
        });

        await adapter.updateDataGeneric(ENDPOINT, treeType, definitions, false);

        const device = adapter.myIob.createOrUpdateStates.firstCall.args[2];
        expect(device.model).to.equal('WD');
        expect(device.serial).to.equal('S1');
        expect(device.devicename).to.equal('sda');
    });

    it('merges additional data without converter into the device', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.withArgs(ENDPOINT).resolves([{ serial: 'S1', devicename: 'sda', hasInfo: true }]);
        adapter.omvApi.retrievData.withArgs('diskInfo', { serial: 'S1' }).resolves({ model: 'WD' });
        const definitions = createDefinitions({
            additionalRequest: [{ conditionProperty: 'hasInfo', endpoint: 'diskInfo', paramsProperty: 'serial' }],
        });

        await adapter.updateDataGeneric(ENDPOINT, treeType, definitions, false);

        expect(adapter.myIob.createOrUpdateStates.firstCall.args[2].model).to.equal('WD');
    });

    it('skips the additional request when the condition property is false', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.withArgs(ENDPOINT).resolves([{ serial: 'S1', devicename: 'sda', hasInfo: false }]);
        const definitions = createDefinitions({
            additionalRequest: [{ conditionProperty: 'hasInfo', endpoint: 'diskInfo', paramsProperty: 'serial' }],
        });

        await adapter.updateDataGeneric(ENDPOINT, treeType, definitions, false);

        expect(adapter.omvApi.retrievData).to.not.have.been.calledWith('diskInfo');
        expect(adapter.log.debug).to.have.been.calledWithMatch('no additional data request because condition property');
        expect(adapter.myIob.createOrUpdateDevice).to.have.been.calledOnce;
    });

    it('skips the additional request when the definition has none', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.withArgs(ENDPOINT).resolves([{ serial: 'S1', devicename: 'sda' }]);
        const definitions = createDefinitions({ additionalRequest: null });

        await adapter.updateDataGeneric(ENDPOINT, treeType, definitions, false);

        expect(adapter.omvApi.retrievData).to.have.been.calledOnceWith(ENDPOINT);
        expect(adapter.myIob.createOrUpdateDevice).to.have.been.calledOnce;
    });

    it('logs an error when the data retrieval fails', async () => {
        const adapter = createGenericAdapter();
        adapter.omvApi.retrievData.rejects(new Error('retrieval failed'));

        await adapter.updateDataGeneric(ENDPOINT, treeType, createDefinitions(), false);

        expect(adapter.log.error).to.have.been.calledWithMatch('retrieval failed');
    });
});

describeWithFixtures('updateDataGeneric with recorded fixtures', () => {
    /**
     * Creates an adapter with the endpoint enabled and the API answering with the recorded responses.
     *
     * @param endpoint the endpoint to enable
     */
    function createFixtureAdapter(endpoint: string): any {
        const retrievData = sinon.stub().callsFake(async (requested: string, params?: Record<string, unknown>) => getFixtureResponse(requested, params));

        return createAdapter({
            connected: true,
            config: { ...DEFAULT_CONFIG, [`${endpoint}Enabled`]: true },
            omvApi: { isConnected: true, retrievData },
            myIob: {
                createOrUpdateChannel: sinon.stub().resolves(),
                createOrUpdateDevice: sinon.stub().resolves(),
                createOrUpdateStates: sinon.stub().resolves(),
            },
        });
    }

    const endpoints = Object.keys(tree).filter(endpoint => getFixtureRecords(endpoint) !== undefined);

    for (const endpoint of endpoints) {
        const def = (tree as any)[endpoint];
        const hasDevices = def.iobObjectDefintions?.deviceIdProperty !== undefined;

        it(`${endpoint}: processes every recorded entry without errors`, async () => {
            const adapter = createFixtureAdapter(endpoint);

            await adapter.updateDataGeneric(endpoint, def, def.iobObjectDefintions, true);

            const records = getFixtureRecords(endpoint) ?? [];
            expect(adapter.log.error).to.not.have.been.called;
            if (hasDevices) {
                expect(adapter.myIob.createOrUpdateDevice.callCount).to.equal(records.length);
            } else {
                expect(adapter.myIob.createOrUpdateStates).to.have.been.calledOnce;
            }
        });

        if (hasDevices) {
            it(`${endpoint}: creates one device per recorded entry with a unique id`, async () => {
                const adapter = createFixtureAdapter(endpoint);

                await adapter.updateDataGeneric(endpoint, def, def.iobObjectDefintions, true);

                const ids: string[] = adapter.myIob.createOrUpdateDevice.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
                expect(ids).to.have.lengthOf(getFixtureRecords(endpoint)?.length ?? 0);
                expect(new Set(ids).size).to.equal(ids.length);
                for (const id of ids) {
                    expect(id).to.match(new RegExp(`^${def.idChannel}\\.`));
                }
            });
        }
    }

    it('fileSystem: online and error states are bound to the recorded status values', async () => {
        const adapter = createFixtureAdapter('fileSystem');

        await adapter.updateDataGeneric('fileSystem', tree.fileSystem, tree.fileSystem.iobObjectDefintions, true);

        const options = adapter.myIob.createOrUpdateDevice.getCalls().map((call: sinon.SinonSpyCall) => call.args[2]);
        expect(options).to.not.be.empty;
        for (const option of options) {
            expect(option.onlineId).to.match(/\.isOnline$/);
            expect(option.errorId).to.match(/\.hasErrors$/);
        }
    });

    it('smart: monitored devices receive the recorded smartInfo and smartAttributes data', async () => {
        const adapter = createFixtureAdapter('smart');
        const additionalRequests: any[] = (tree.smart.iobObjectDefintions as any).additionalRequest;

        await adapter.updateDataGeneric('smart', tree.smart, tree.smart.iobObjectDefintions, true);

        const records = getFixtureRecords('smart') ?? [];
        expect(adapter.myIob.createOrUpdateStates.callCount).to.equal(records.length);

        records.forEach((record, index) => {
            const device = adapter.myIob.createOrUpdateStates.getCall(index).args[2];
            expect(device.devicefile).to.equal(record.devicefile);

            if (!record.monitor) {
                expect(device.devicemodel).to.be.undefined;
                return;
            }

            const info = getFixtureResponse('smartInfo', { devicefile: record.devicefile });
            expect(info, `smartInfo for ${record.devicefile}`).to.exist;
            expect(device.devicemodel).to.equal(info.devicemodel);
            expect(device.powercycles).to.equal(info.powercycles);
            expect(device.poweronhours).to.equal(info.poweronhours);
            expect(device.rotationrate).to.equal(info.rotationrate);

            const attributes = additionalRequests[1].converter(getFixtureResponse('smartAttributes', { devicefile: record.devicefile }), adapter);
            expect(Object.keys(attributes), `attributes for ${record.devicefile}`).to.not.be.empty;
            for (const [key, value] of Object.entries(attributes)) {
                expect(device).to.have.property(key, value);
            }
        });
    });
});
