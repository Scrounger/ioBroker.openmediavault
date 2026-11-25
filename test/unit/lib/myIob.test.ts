import { expect } from 'chai';
import sinon from 'sinon';
import { myIob } from '../../../src/lib/myIob.js';
import { createLogStub } from '../helpers/mainAdapter.js';

const NAMESPACE = 'openmediavault.0';

/**
 * Creates a minimal ioBroker adapter double for `myIob`. All database methods resolve by default.
 */
function createAdapterStub(overrides: Record<string, unknown> = {}): any {
    return {
        namespace: NAMESPACE,
        connected: true,
        language: 'en',
        log: createLogStub(),
        objectExists: sinon.stub().resolves(false),
        getObjectAsync: sinon.stub().resolves(null),
        setObjectNotExistsAsync: sinon.stub().resolves(),
        extendObject: sinon.stub().resolves(),
        setStateChangedAsync: sinon.stub().resolves({ notChanged: false }),
        setState: sinon.stub().resolves(),
        subscribeStatesAsync: sinon.stub().resolves(),
        delObjectAsync: sinon.stub().resolves(),
        ...overrides,
    };
}

/**
 * Creates a utils double. `translations` maps a text to its translated object, all other texts are returned as English only.
 */
function createUtilsStub(translations: Record<string, Record<string, string>> = {}): any {
    return {
        I18n: {
            getTranslatedObject: sinon.stub().callsFake((text: string) => translations[text] ?? { en: text }),
        },
    };
}

/**
 * Creates a `myIob` instance with adapter and utils doubles. Returns the instance as `any` because the tests call private members.
 */
function createMyIob(options: { adapter?: any; utils?: any; statesUsingValAsLastChanged?: string[] } = {}): { iob: any; adapter: any; utils: any } {
    const adapter = options.adapter ?? createAdapterStub();
    const utils = options.utils ?? createUtilsStub();
    const iob: any = new myIob(adapter, utils, options.statesUsingValAsLastChanged ?? []);
    return { iob, adapter, utils };
}

/** Returns the messages of all calls of a log stub as strings. */
function messages(stub: sinon.SinonStub): string[] {
    return stub.getCalls().map(call => String(call.args[0]));
}

const CHANNEL_ID = `${NAMESPACE}.disk.sda`;

describe('myIob', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('createOrUpdateDevice', () => {
        it('creates a device with namespace prefixed status states', async () => {
            const { iob, adapter } = createMyIob();

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk', {
                onlineId: 'disk.online',
                errorId: `${NAMESPACE}.disk.error`,
            });

            expect(adapter.setObjectNotExistsAsync.calledOnce).to.be.true;
            const [id, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(id).to.equal(`${NAMESPACE}.disk`);
            expect(obj.type).to.equal('device');
            expect(obj.common.name).to.equal('Disk');
            expect(obj.common.statusStates).to.deep.equal({
                onlineId: `${NAMESPACE}.disk.online`,
                errorId: `${NAMESPACE}.disk.error`,
            });
            expect(obj.native).to.deep.equal({});
        });

        it('passes the native object and the icon to the new device', async () => {
            const { iob, adapter } = createMyIob();

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk', { icon: 'data:x', native: { foo: 1 } });

            const [, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(obj.common.icon).to.equal('data:x');
            expect(obj.native).to.deep.equal({ foo: 1 });
        });

        it('creates no status states if none are given', async () => {
            const { iob, adapter } = createMyIob();

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk');

            const [, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(obj.common.statusStates).to.be.undefined;
        });

        it('uses the translated name if a translation exists', async () => {
            const utils = createUtilsStub({ Disk: { en: 'Disk', de: 'Festplatte' } });
            const { iob, adapter } = createMyIob({ utils });

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk');

            const [, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(obj.common.name).to.deep.equal({ en: 'Disk', de: 'Festplatte' });
        });

        it('uses "undefined" as name if no name is given', async () => {
            const { iob, adapter } = createMyIob();

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, undefined);

            const [, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(obj.common.name).to.equal('undefined');
        });

        it('does not touch an existing device if updateObject is false', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk');

            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
            expect(adapter.getObjectAsync.called).to.be.false;
            expect(adapter.extendObject.called).to.be.false;
        });

        it('updates an existing device on adapter start if the common properties differ', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Old' } });

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk', { updateObject: true });

            expect(adapter.extendObject.calledOnce).to.be.true;
            const [id, data] = adapter.extendObject.firstCall.args;
            expect(id).to.equal(`${NAMESPACE}.disk`);
            expect(data.common.name).to.equal('Disk');
            expect(messages(adapter.log.debug).some(msg => msg.includes('updated properties'))).to.be.true;
        });

        it('does not log the changed properties if logChanges is false', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Old' } });

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk', { updateObject: true, logChanges: false });

            expect(adapter.extendObject.calledOnce).to.be.true;
            expect(messages(adapter.log.debug).some(msg => msg.includes('updated properties'))).to.be.false;
        });

        it('does not update an existing device whose common properties are equal', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Disk' } });

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk', { updateObject: true });

            expect(adapter.extendObject.called).to.be.false;
        });

        it('keeps the stored name on update if no name is given', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Stored' } });

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, undefined, { updateObject: true });

            expect(adapter.extendObject.called).to.be.false;
        });

        it('does nothing on update if the existing object cannot be read', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);
            adapter.getObjectAsync.resolves(null);

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk', { updateObject: true });

            expect(adapter.extendObject.called).to.be.false;
        });

        it('truncates a long icon in the log message', async () => {
            const { iob, adapter } = createMyIob();
            const longIcon = `data:image/png;base64,${'a'.repeat(200)}`;
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Disk', icon: 'old' } });

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk', { updateObject: true, icon: longIcon });

            expect(adapter.extendObject.calledOnce).to.be.true;
            const logMsg = messages(adapter.log.debug).find(msg => msg.includes('updated properties')) ?? '';
            expect(logMsg).to.include('...');
            expect(logMsg).not.to.include('a'.repeat(100));
        });

        it('logs an error if the adapter fails', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.rejects(new Error('db down'));

            await iob.createOrUpdateDevice(`${NAMESPACE}.disk`, 'Disk');

            expect(messages(adapter.log.error).some(msg => msg.includes('db down'))).to.be.true;
        });
    });

    describe('createOrUpdateChannel', () => {
        it('creates a channel with name and icon', async () => {
            const { iob, adapter } = createMyIob();

            await iob.createOrUpdateChannel(`${NAMESPACE}.disk`, 'Disk', 'mdi-disk');

            const [id, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(id).to.equal(`${NAMESPACE}.disk`);
            expect(obj.type).to.equal('channel');
            expect(obj.common).to.include({ name: 'Disk', icon: 'mdi-disk' });
        });

        it('uses the translated name if a translation exists', async () => {
            const utils = createUtilsStub({ Disk: { en: 'Disk', de: 'Festplatte' } });
            const { iob, adapter } = createMyIob({ utils });

            await iob.createOrUpdateChannel(`${NAMESPACE}.disk`, 'Disk');

            const [, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(obj.common.name).to.deep.equal({ en: 'Disk', de: 'Festplatte' });
        });

        it('uses "undefined" as name if no name is given', async () => {
            const { iob, adapter } = createMyIob();

            await iob.createOrUpdateChannel(`${NAMESPACE}.disk`, undefined);

            const [, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(obj.common.name).to.equal('undefined');
        });

        it('updates an existing channel on adapter start if the common properties differ', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Old' } });

            await iob.createOrUpdateChannel(`${NAMESPACE}.disk`, 'Disk', undefined, true);

            expect(adapter.extendObject.calledOnce).to.be.true;
        });

        it('does not update an existing channel if updateObject is false', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);

            await iob.createOrUpdateChannel(`${NAMESPACE}.disk`, 'Disk');

            expect(adapter.extendObject.called).to.be.false;
        });

        it('keeps the stored name of an existing channel if no name is given', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${NAMESPACE}.disk`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Stored' } });

            await iob.createOrUpdateChannel(`${NAMESPACE}.disk`, undefined, undefined, true);

            expect(adapter.extendObject.called).to.be.false;
        });

        it('logs an error if the adapter fails', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.rejects(new Error('channel boom'));

            await iob.createOrUpdateChannel(`${NAMESPACE}.disk`, 'Disk');

            expect(messages(adapter.log.error).some(msg => msg.includes('channel boom'))).to.be.true;
        });
    });

    describe('createOrUpdateStates - states', () => {
        it('returns false and creates nothing if the adapter is not connected', async () => {
            const { iob, adapter } = createMyIob();
            adapter.connected = false;
            const tree = { temperature: { iobType: 'number', read: true, write: false } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 1 }, { temperature: 1 });

            expect(result).to.be.false;
            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
            expect(adapter.log.warn.called).to.be.false;
        });

        it('logs a warning for a missing connection on debug level', async () => {
            const { iob, adapter } = createMyIob();
            adapter.connected = false;
            adapter.log.level = 'debug';

            await iob.createOrUpdateStates(CHANNEL_ID, {}, {}, {});

            expect(adapter.log.warn.calledOnce).to.be.true;
        });

        it('creates a number state with role, unit and value', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { iobType: 'number', name: 'Temperature', unit: '°C', read: true, write: false } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { logDeviceName: 'sda' });

            expect(result).to.be.true;
            const [id, obj] = adapter.setObjectNotExistsAsync.firstCall.args;
            expect(id).to.equal(`${CHANNEL_ID}.temperature`);
            expect(obj.type).to.equal('state');
            expect(obj.common).to.include({
                name: 'Temperature',
                type: 'number',
                read: true,
                write: false,
                role: 'value.temperature',
                unit: '°C',
            });
            expect(adapter.setStateChangedAsync.firstCall.args).to.deep.equal([`${CHANNEL_ID}.temperature`, 21, true]);
        });

        it('writes the value returned by readVal', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { iobType: 'number', read: true, write: false, readVal: (val: number) => val * 2 } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 });

            expect(adapter.setStateChangedAsync.firstCall.args[1]).to.equal(42);
        });

        it('writes an object with val and lc for numbers and strings listed in statesUsingValAsLastChanged', async () => {
            const { iob, adapter } = createMyIob({ statesUsingValAsLastChanged: ['temperature', 'model'] });
            const tree = {
                temperature: { iobType: 'number', read: true, write: false },
                model: { iobType: 'string', read: true, write: false },
            };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21, model: 'X' }, { temperature: 21, model: 'X' });

            expect(adapter.setStateChangedAsync.getCall(0).args[1]).to.deep.equal({ val: 21, lc: 21 });
            expect(adapter.setStateChangedAsync.getCall(1).args[1]).to.deep.equal({ val: 'X' });
        });

        it('uses the custom id of a state', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { id: 'temp_custom', iobType: 'number', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 });

            expect(adapter.setObjectNotExistsAsync.firstCall.args[0]).to.equal(`${CHANNEL_ID}.temp_custom`);
            expect(adapter.setStateChangedAsync.firstCall.args[0]).to.equal(`${CHANNEL_ID}.temp_custom`);
        });

        it('creates a custom state without value but does not write it', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { id: 'temp_custom', iobType: 'number', read: true, write: false } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, {}, {});

            expect(result).to.be.false;
            expect(adapter.setObjectNotExistsAsync.firstCall.args[0]).to.equal(`${CHANNEL_ID}.temp_custom`);
            expect(adapter.setStateChangedAsync.called).to.be.false;
        });

        it('does not create a state without value in data', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { iobType: 'number', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, {}, {});

            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('takes the value from valFromProperty', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { renamed: { iobType: 'string', read: true, write: false, valFromProperty: 'source' } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { source: 'abc' }, { source: 'abc' });

            expect(adapter.setObjectNotExistsAsync.firstCall.args[0]).to.equal(`${CHANNEL_ID}.renamed`);
            expect(adapter.setStateChangedAsync.firstCall.args).to.deep.equal([`${CHANNEL_ID}.renamed`, 'abc', true]);
        });

        it('skips a state whose valFromProperty does not exist in data', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { renamed: { iobType: 'string', read: true, write: false, valFromProperty: 'source' } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, {}, {});

            expect(result).to.be.false;
            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('deletes a state whose condition is false on adapter start', async () => {
            const { iob, adapter } = createMyIob();
            const id = `${CHANNEL_ID}.hidden`;
            adapter.objectExists.withArgs(id).resolves(true);
            const tree = { hidden: { iobType: 'string', read: true, write: false, conditionToCreateState: () => false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { hidden: 'x' }, { hidden: 'x' }, { updateObject: true });

            expect(adapter.delObjectAsync.firstCall.args).to.deep.equal([id]);
            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('does not delete a state whose condition is false at runtime', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.hidden`).resolves(true);
            const tree = { hidden: { iobType: 'string', read: true, write: false, conditionToCreateState: () => false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { hidden: 'x' }, { hidden: 'x' });

            expect(adapter.delObjectAsync.called).to.be.false;
        });

        it('deletes a blacklisted state at runtime and logs the device details', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.temperature`).resolves(true);
            const tree = { temperature: { iobType: 'number', read: true, write: false } };
            const fullData = { temperature: 21, mac: '00:11' };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, fullData, {
                blacklistFilter: [{ id: 'temperature' }],
                logDeviceName: 'sda',
            });

            expect(result).to.be.false;
            expect(adapter.delObjectAsync.firstCall.args).to.deep.equal([`${CHANNEL_ID}.temperature`]);
            const logMsg = messages(adapter.log.info).find(msg => msg.includes('delete')) ?? '';
            expect(logMsg).to.include("it's on the blacklist");
            expect(logMsg).to.include('(mac: 00:11)');
            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('does not delete a blacklisted state that does not exist', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { iobType: 'number', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { blacklistFilter: [{ id: 'temperature' }] });

            expect(adapter.delObjectAsync.called).to.be.false;
        });

        it('creates only whitelisted states and deletes the others', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.model`).resolves(true);
            const tree = {
                temperature: { iobType: 'number', read: true, write: false },
                model: { iobType: 'string', read: true, write: false },
            };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21, model: 'X' }, { temperature: 21, model: 'X' }, {
                blacklistFilter: [{ id: 'temperature' }],
                isWhiteList: true,
            });

            expect(adapter.setObjectNotExistsAsync.calledOnce).to.be.true;
            expect(adapter.setObjectNotExistsAsync.firstCall.args[0]).to.equal(`${CHANNEL_ID}.temperature`);
            expect(adapter.delObjectAsync.firstCall.args).to.deep.equal([`${CHANNEL_ID}.model`]);
            const logMsg = messages(adapter.log.info).find(msg => msg.includes('delete')) ?? '';
            expect(logMsg).to.include("it's not on the whitelist");
        });

        it('creates a required state even if it is blacklisted', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { iobType: 'number', read: true, write: false, required: true } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { blacklistFilter: [{ id: 'temperature' }] });

            expect(adapter.setObjectNotExistsAsync.calledOnce).to.be.true;
        });

        it('creates a state if its required function returns true', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { iobType: 'number', read: true, write: false, required: () => true } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { isWhiteList: true, blacklistFilter: [] });

            expect(adapter.setObjectNotExistsAsync.calledOnce).to.be.true;
        });

        it('subscribes writable states and states with subscribeMe only once', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                enable: { iobType: 'boolean', read: true, write: true },
                status: { iobType: 'string', read: true, write: false, subscribeMe: true },
                model: { iobType: 'string', read: true, write: false },
            };
            const data = { enable: true, status: 'ok', model: 'X' };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data);
            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data);

            expect(adapter.subscribeStatesAsync.callCount).to.equal(2);
            expect(adapter.subscribeStatesAsync.calledWith(`${CHANNEL_ID}.enable`)).to.be.true;
            expect(adapter.subscribeStatesAsync.calledWith(`${CHANNEL_ID}.status`)).to.be.true;
        });

        it('registers the writeVal function under the id without the device part', async () => {
            const { iob } = createMyIob();
            const writeVal = sinon.stub();
            const tree = { enable: { iobType: 'boolean', read: true, write: true, writeVal } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { enable: true }, { enable: true });

            expect(iob.statesWithWriteFunction[`${NAMESPACE}.disk.enable`]).to.equal(writeVal);
        });

        it('updates the timestamp with setState if the value did not change and updateTs is set', async () => {
            const { iob, adapter } = createMyIob();
            adapter.setStateChangedAsync.resolves({ notChanged: true });
            const tree = { temperature: { iobType: 'number', read: true, write: false, updateTs: true } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 });

            expect(result).to.be.false;
            expect(adapter.setState.calledOnceWithExactly(`${CHANNEL_ID}.temperature`, 21, true)).to.be.true;
        });

        it('does not call setState for updateTs if the value changed', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { iobType: 'number', read: true, write: false, updateTs: true } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 });

            expect(result).to.be.true;
            expect(adapter.setState.called).to.be.false;
        });

        it('does not call setState for states without updateTs', async () => {
            const { iob, adapter } = createMyIob();
            adapter.setStateChangedAsync.resolves({ notChanged: true });
            const tree = { temperature: { iobType: 'number', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 });

            expect(adapter.setState.called).to.be.false;
        });

        it('returns false for a value change during an object update', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { temperature: { iobType: 'number', read: true, write: false } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { updateObject: true });

            expect(result).to.be.false;
            expect(adapter.setStateChangedAsync.calledOnce).to.be.true;
        });

        it('updates the common of an existing state on adapter start if it differs', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.temperature`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Old', type: 'number', read: true, write: false, role: 'value' } });
            const tree = { temperature: { iobType: 'number', name: 'Temperature', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { updateObject: true });

            expect(adapter.extendObject.calledOnce).to.be.true;
            expect(adapter.extendObject.firstCall.args[0]).to.equal(`${CHANNEL_ID}.temperature`);
            expect(adapter.extendObject.firstCall.args[1].common.name).to.equal('Temperature');
            expect(messages(adapter.log.debug).some(msg => msg.includes('updated common properties'))).to.be.true;
        });

        it('does not update the common of an existing state if it is equal', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.temperature`).resolves(true);
            adapter.getObjectAsync.resolves({
                common: { name: 'Temperature', type: 'number', read: true, write: false, role: 'value.temperature', unit: '°C' },
            });
            const tree = { temperature: { iobType: 'number', name: 'Temperature', unit: '°C', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { updateObject: true });

            expect(adapter.extendObject.called).to.be.false;
        });

        it('updates an existing state if a defined step differs', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.temperature`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Temperature', type: 'number', read: true, write: false, role: 'value', step: 2 } });
            const tree = { temperature: { iobType: 'number', name: 'Temperature', read: true, write: false, step: 1 } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { updateObject: true });

            expect(adapter.extendObject.calledOnce).to.be.true;
        });

        it('does not update an existing state if the stored object cannot be read', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.temperature`).resolves(true);
            adapter.getObjectAsync.resolves(null);
            const tree = { temperature: { iobType: 'number', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 21 }, { temperature: 21 }, { updateObject: true });

            expect(adapter.extendObject.called).to.be.false;
        });

        it('leaves an existing state unchanged if its common cannot be created on update', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.status`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'status', type: 'string', read: true, write: false, role: 'text' } });
            const tree = {
                status: {
                    iobType: 'string',
                    read: true,
                    write: false,
                    statesFromProperty: () => {
                        throw new Error('states boom');
                    },
                },
            };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { status: 'ok' }, { status: 'ok' }, { updateObject: true });

            expect(adapter.extendObject.called).to.be.false;
            expect(messages(adapter.log.error).some(msg => msg.includes('states boom'))).to.be.true;
        });

        it('creates a state without common if its common cannot be created', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                status: {
                    iobType: 'string',
                    read: true,
                    write: false,
                    statesFromProperty: () => {
                        throw new Error('states boom');
                    },
                },
            };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { status: 'ok' }, { status: 'ok' });

            expect(adapter.setObjectNotExistsAsync.firstCall.args[1].common).to.be.undefined;
            expect(messages(adapter.log.error).some(msg => msg.includes('states boom'))).to.be.true;
        });

        it('sets all optional common properties of a state', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                rich: {
                    iobType: 'number',
                    name: 'Rich',
                    unit: () => 'kWh',
                    min: 0,
                    max: 100,
                    step: 0.5,
                    expert: true,
                    def: 0,
                    desc: 'Description',
                    read: true,
                    write: true,
                    role: 'level.custom',
                },
            };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { rich: 5 }, { rich: 5 });

            const common = adapter.setObjectNotExistsAsync.firstCall.args[1].common;
            expect(common).to.include({
                name: 'Rich',
                type: 'number',
                unit: 'kWh',
                min: 0,
                max: 100,
                step: 0.5,
                expert: true,
                def: 0,
                desc: 'Description',
                read: true,
                write: true,
                role: 'level.custom',
            });
        });

        it('sets def false and default read/write values', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { flag: { iobType: 'boolean', def: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { flag: true }, { flag: true });

            const common = adapter.setObjectNotExistsAsync.firstCall.args[1].common;
            expect(common.def).to.be.false;
            expect(common.read).to.be.true;
            expect(common.write).to.be.false;
        });

        it('translates the name and the unit into the adapter language', async () => {
            const utils = createUtilsStub({
                Temperature: { en: 'Temperature', de: 'Temperatur' },
                Hour: { en: 'Hour', de: 'Stunde' },
            });
            const { iob, adapter } = createMyIob({ utils, adapter: createAdapterStub({ language: 'de' }) });
            const tree = { temperature: { iobType: 'number', name: 'Temperature', unit: 'Hour', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 1 }, { temperature: 1 });

            const common = adapter.setObjectNotExistsAsync.firstCall.args[1].common;
            expect(common.name).to.deep.equal({ en: 'Temperature', de: 'Temperatur' });
            expect(common.unit).to.equal('Stunde');
        });

        it('keeps the unit if the adapter language has no translation', async () => {
            const utils = createUtilsStub({ Hour: { en: 'Hour', de: 'Stunde' } });
            const { iob, adapter } = createMyIob({ utils, adapter: createAdapterStub({ language: 'fr' }) });
            const tree = { temperature: { iobType: 'number', unit: 'Hour', read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { temperature: 1 }, { temperature: 1 });

            expect(adapter.setObjectNotExistsAsync.firstCall.args[1].common.unit).to.equal('Hour');
        });

        it('uses states from the tree definition as common.states', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { status: { iobType: 'string', states: { a: 'A', b: 'B' }, read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { status: 'a' }, { status: 'a' });

            expect(adapter.setObjectNotExistsAsync.firstCall.args[1].common.states).to.deep.equal({ a: 'A', b: 'B' });
        });

        it('uses statesFromProperty as common.states and logs the count', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { status: { iobType: 'number', statesFromProperty: () => ({ 1: 'on', 0: 'off' }), read: true, write: false } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { status: 1 }, { status: 1 }, { logDeviceName: 'sda' });

            expect(adapter.setObjectNotExistsAsync.firstCall.args[1].common.states).to.deep.equal({ 1: 'on', 0: 'off' });
            expect(messages(adapter.log.debug).some(msg => msg.includes('allowed common.states'))).to.be.true;
        });

        it('keeps the value in the log and continues with the next state if readVal throws', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                bad: {
                    iobType: 'number',
                    read: true,
                    write: false,
                    readVal: () => {
                        throw new Error('readVal boom');
                    },
                },
                good: { iobType: 'string', read: true, write: false },
            };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { bad: 1, good: 'x' }, { bad: 1, good: 'x' });

            expect(adapter.setStateChangedAsync.calledOnce).to.be.true;
            expect(adapter.setStateChangedAsync.firstCall.args[0]).to.equal(`${CHANNEL_ID}.good`);
            const logMsg = messages(adapter.log.error)[0] ?? '';
            expect(logMsg).to.include('readVal boom');
            expect(logMsg).to.include('id: bad');
        });

        it('logs an error and returns false if the adapter cannot be read', async () => {
            const adapter = createAdapterStub();
            Object.defineProperty(adapter, 'connected', {
                get: () => {
                    throw new Error('connected boom');
                },
            });
            const { iob } = createMyIob({ adapter });

            const result = await iob.createOrUpdateStates(CHANNEL_ID, { temperature: { iobType: 'number' } }, { temperature: 1 }, { temperature: 1 });

            expect(result).to.be.false;
            expect(messages(adapter.log.error).some(msg => msg.includes('connected boom'))).to.be.true;
        });
    });

    describe('createOrUpdateStates - channels', () => {
        it('creates an object channel with its states', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                sub: {
                    name: 'Sub channel',
                    icon: 'mdi-x',
                    object: { child: { iobType: 'number', name: 'Child', read: true, write: false } },
                },
            };
            const data = { sub: { child: 7 } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data);

            expect(result).to.be.true;
            const ids = adapter.setObjectNotExistsAsync.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
            expect(ids).to.deep.equal([`${CHANNEL_ID}.sub`, `${CHANNEL_ID}.sub.child`]);
            const channel = adapter.setObjectNotExistsAsync.firstCall.args[1];
            expect(channel.type).to.equal('channel');
            expect(channel.common).to.include({ name: 'Sub channel', icon: 'mdi-x' });
        });

        it('uses idChannel and a name function for object channels', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                sub: {
                    idChannel: 'other',
                    name: () => 'Dynamic',
                    object: { child: { iobType: 'number', read: true, write: false } },
                },
            };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { sub: { child: 7 } }, { sub: { child: 7 } });

            expect(adapter.setObjectNotExistsAsync.firstCall.args[0]).to.equal(`${CHANNEL_ID}.other`);
            expect(adapter.setObjectNotExistsAsync.firstCall.args[1].common.name).to.equal('Dynamic');
            expect(adapter.setObjectNotExistsAsync.getCall(1).args[0]).to.equal(`${CHANNEL_ID}.other.child`);
        });

        it('uses the key as channel name if no name is given', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { sub: { object: { child: { iobType: 'number', read: true, write: false } } } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { sub: { child: 7 } }, { sub: { child: 7 } });

            expect(adapter.setObjectNotExistsAsync.firstCall.args[1].common.name).to.equal('sub');
        });

        it('creates no object channel if its data is missing', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { sub: { object: { child: { iobType: 'number', read: true, write: false } } } };

            const result = await iob.createOrUpdateStates(CHANNEL_ID, tree, {}, {});

            expect(result).to.be.false;
            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('deletes an object channel recursively if its condition is false on adapter start', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.sub`).resolves(true);
            const tree = {
                sub: {
                    conditionToCreateState: () => false,
                    object: { child: { iobType: 'number', read: true, write: false } },
                },
            };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { sub: { child: 7 } }, { sub: { child: 7 } }, { updateObject: true });

            expect(adapter.delObjectAsync.firstCall.args).to.deep.equal([`${CHANNEL_ID}.sub`, { recursive: true }]);
            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('deletes a blacklisted object channel recursively', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.sub`).resolves(true);
            const tree = { sub: { object: { child: { iobType: 'number', read: true, write: false } } } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { sub: { child: 7 } }, { sub: { child: 7 } }, { blacklistFilter: [{ id: 'sub' }] });

            expect(adapter.delObjectAsync.firstCall.args).to.deep.equal([`${CHANNEL_ID}.sub`, { recursive: true }]);
            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('creates an object channel below a whitelist entry and only the whitelisted children', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                sub: { object: { child: { iobType: 'number', read: true, write: false } } },
                other: { object: { child: { iobType: 'number', read: true, write: false } } },
            };
            const data = { sub: { child: 7 }, other: { child: 8 } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data, {
                blacklistFilter: [{ id: 'sub.child' }],
                isWhiteList: true,
            });

            const ids = adapter.setObjectNotExistsAsync.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
            expect(ids).to.deep.equal([`${CHANNEL_ID}.sub`, `${CHANNEL_ID}.sub.child`]);
        });

        it('allows all children of a whitelisted object channel', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { sub: { object: { child: { iobType: 'number', read: true, write: false }, other: { iobType: 'number', read: true, write: false } } } };
            const data = { sub: { child: 7, other: 8 } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data, {
                blacklistFilter: [{ id: 'sub' }],
                isWhiteList: true,
            });

            const ids = adapter.setObjectNotExistsAsync.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
            expect(ids).to.deep.equal([`${CHANNEL_ID}.sub`, `${CHANNEL_ID}.sub.child`, `${CHANNEL_ID}.sub.other`]);
        });

        it('creates array channels with prefix, zero padding and start number', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                list: {
                    name: 'List',
                    arrayChannelIdPrefix: 'item_',
                    arrayChannelIdZeroPad: 2,
                    arrayStartNumber: 1,
                    arrayChannelNamePrefix: 'Item ',
                    array: { value: { iobType: 'number', name: 'Value', read: true, write: false } },
                },
            };
            const data = { list: [{ value: 1 }, null, { value: 3 }] };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data);

            const ids = adapter.setObjectNotExistsAsync.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
            expect(ids).to.deep.equal([
                `${CHANNEL_ID}.list`,
                `${CHANNEL_ID}.list.item_01`,
                `${CHANNEL_ID}.list.item_01.value`,
                `${CHANNEL_ID}.list.item_03`,
                `${CHANNEL_ID}.list.item_03.value`,
            ]);
            const itemChannel = adapter.setObjectNotExistsAsync.getCall(1).args[1];
            expect(itemChannel.common.name).to.equal('Item 1');
        });

        it('uses the array number (starting at 0 by default) as channel id if no prefix is given', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { list: { array: { value: { iobType: 'number', read: true, write: false } } } };
            const data = { list: [{ value: 1 }] };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data);

            const ids = adapter.setObjectNotExistsAsync.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
            expect(ids).to.deep.equal([`${CHANNEL_ID}.list`, `${CHANNEL_ID}.list.0`, `${CHANNEL_ID}.list.0.value`]);
            expect(adapter.setObjectNotExistsAsync.getCall(0).args[1].common.name).to.equal('list');
        });

        it('uses the id and name from properties of the array items', async () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                list: {
                    arrayChannelIdFromProperty: (_d: any, c: any) => c.id,
                    arrayChannelNameFromProperty: (_d: any, c: any) => `Name ${c.id}`,
                    array: { value: { iobType: 'number', read: true, write: false } },
                },
            };
            const data = { list: [{ id: 'a', value: 1 }, { value: 2 }] };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data);

            const ids = adapter.setObjectNotExistsAsync.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
            expect(ids).to.deep.equal([`${CHANNEL_ID}.list`, `${CHANNEL_ID}.list.a`, `${CHANNEL_ID}.list.a.value`]);
            expect(adapter.setObjectNotExistsAsync.getCall(1).args[1].common.name).to.equal('Name a');
        });

        it('skips empty and null arrays', async () => {
            const { iob, adapter } = createMyIob();
            const tree = { list: { array: { value: { iobType: 'number', read: true, write: false } } } };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, { list: [] }, { list: [] });
            await iob.createOrUpdateStates(CHANNEL_ID, tree, { list: null }, { list: null });

            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('deletes an array channel recursively if its condition is false on adapter start', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.list`).resolves(true);
            const tree = { list: { conditionToCreateState: () => false, array: { value: { iobType: 'number', read: true, write: false } } } };
            const data = { list: [{ value: 1 }] };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data, { updateObject: true });

            expect(adapter.delObjectAsync.firstCall.args).to.deep.equal([`${CHANNEL_ID}.list`, { recursive: true }]);
            expect(adapter.setObjectNotExistsAsync.called).to.be.false;
        });

        it('deletes a blacklisted array channel recursively', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.list`).resolves(true);
            const tree = { list: { array: { value: { iobType: 'number', read: true, write: false } } } };
            const data = { list: [{ value: 1 }] };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data, { blacklistFilter: [{ id: 'list' }] });

            expect(adapter.delObjectAsync.firstCall.args).to.deep.equal([`${CHANNEL_ID}.list`, { recursive: true }]);
        });

        it('creates the array channel and item channels with updateObject set on the existing ones', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs(`${CHANNEL_ID}.list`).resolves(true);
            adapter.getObjectAsync.resolves({ common: { name: 'Old' } });
            const tree = { list: { name: 'List', array: { value: { iobType: 'number', read: true, write: false } } } };
            const data = { list: [{ value: 1 }] };

            await iob.createOrUpdateStates(CHANNEL_ID, tree, data, data, { updateObject: true });

            expect(adapter.extendObject.firstCall.args[0]).to.equal(`${CHANNEL_ID}.list`);
            expect(adapter.extendObject.firstCall.args[1].common.name).to.equal('List');
        });
    });

    describe('setStateExists', () => {
        it('sets the value if the state exists', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs('x.state').resolves(true);

            await iob.setStateExists('x.state', 5, adapter);

            expect(adapter.setState.calledOnceWithExactly('x.state', 5, true)).to.be.true;
        });

        it('uses setStateChangedAsync if onlyChanges is true', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.withArgs('x.state').resolves(true);

            await iob.setStateExists('x.state', 5, adapter, true);

            expect(adapter.setStateChangedAsync.calledOnceWithExactly('x.state', 5, true)).to.be.true;
            expect(adapter.setState.called).to.be.false;
        });

        it('does nothing if the state does not exist', async () => {
            const { iob, adapter } = createMyIob();

            await iob.setStateExists('x.state', 5, adapter);

            expect(adapter.setState.called).to.be.false;
            expect(adapter.setStateChangedAsync.called).to.be.false;
        });

        it('logs an error if the adapter fails', async () => {
            const { iob, adapter } = createMyIob();
            adapter.objectExists.rejects(new Error('set boom'));

            await iob.setStateExists('x.state', 5, adapter);

            expect(messages(adapter.log.error).some(msg => msg.includes('set boom'))).to.be.true;
        });
    });

    describe('id helpers and hasKey', () => {
        it('getIdWithoutLastPart returns the id without its last part', () => {
            const { iob } = createMyIob();

            expect(iob.getIdWithoutLastPart('a.b.c')).to.equal('a.b');
        });

        it('getIdLastPart returns the last part of the id', () => {
            const { iob } = createMyIob();

            expect(iob.getIdLastPart('a.b.c')).to.equal('c');
            expect(iob.getIdLastPart('')).to.equal('');
        });

        it('hasKey checks own properties and rejects missing keys', () => {
            const { iob } = createMyIob();

            expect(iob.hasKey({ a: 1 }, 'a')).to.be.true;
            expect(iob.hasKey({ a: 1 }, 'b')).to.be.false;
            expect(iob.hasKey({ a: 1 }, undefined)).to.be.false;
            expect(iob.hasKey({ a: 1 }, '')).to.be.false;
        });
    });

    describe('assignPredefinedRoles', () => {
        const cases: { type: string; read?: boolean; write?: boolean; unit?: string; id: string; role: string }[] = [
            // boolean read and write
            { type: 'boolean', read: true, write: true, id: 'x.enable', role: 'switch.enable' },
            { type: 'boolean', read: true, write: true, id: 'x.lightSwitch', role: 'switch.light' },
            { type: 'boolean', read: true, write: true, id: 'x.led', role: 'switch.light' },
            { type: 'boolean', read: true, write: true, id: 'x.poe', role: 'switch.power' },
            { type: 'boolean', read: true, write: true, id: 'x.other', role: 'switch' },
            // boolean read only
            { type: 'boolean', read: true, write: false, id: 'x.connected', role: 'indicator.reachable' },
            { type: 'boolean', read: true, write: false, id: 'x.error', role: 'indicator.error' },
            { type: 'boolean', read: true, write: false, id: 'x.alarm', role: 'indicator.alarm' },
            { type: 'boolean', read: true, write: false, id: 'x.maintenance', role: 'indicator.maintenance' },
            { type: 'boolean', read: true, write: false, id: 'x.other', role: 'sensor' },
            // boolean write only falls back to state
            { type: 'boolean', read: false, write: true, id: 'x.other', role: 'state' },
            // number write with boolean read
            { type: 'number', read: true, write: true, unit: '%', id: 'x.volume', role: 'level.volume' },
            { type: 'number', read: true, write: true, id: 'x.setpoint', role: 'level' },
            // number read only with unit and id based suffix
            { type: 'number', read: true, write: false, unit: '°C', id: 'x.temp', role: 'value.temperature' },
            { type: 'number', read: true, write: false, unit: 'K', id: 'x.temp', role: 'value.temperature' },
            { type: 'number', read: true, write: false, id: 'x.temperature', role: 'value.temperature' },
            { type: 'number', read: true, write: false, unit: 'lux', id: 'x.light', role: 'value.brightness' },
            { type: 'number', read: true, write: false, unit: 'ppm', id: 'x.gas', role: 'value.co2' },
            { type: 'number', read: true, write: false, unit: 'mbar', id: 'x.air', role: 'value.pressure' },
            { type: 'number', read: true, write: false, unit: 'kWh', id: 'x.energy', role: 'value.energy' },
            { type: 'number', read: true, write: false, unit: 'kW', id: 'x.power', role: 'value.power' },
            { type: 'number', read: true, write: false, unit: 'A', id: 'x.current', role: 'value.current' },
            { type: 'number', read: true, write: false, unit: 'V', id: 'x.voltage', role: 'value.voltage' },
            { type: 'number', read: true, write: false, unit: 'Hz', id: 'x.freq', role: 'value.frequency' },
            { type: 'number', read: true, write: false, id: 'x.Longitude', role: 'value.gps.longitude' },
            { type: 'number', read: true, write: false, id: 'x.latitude', role: 'value.gps.latitude' },
            { type: 'number', read: true, write: false, unit: '%', id: 'x.humidity', role: 'value.humidity' },
            { type: 'number', read: true, write: false, unit: '%', id: 'x.battery', role: 'value.battery' },
            { type: 'number', read: true, write: false, unit: '%', id: 'x.volume', role: 'value.volume' },
            { type: 'number', read: true, write: false, id: 'x.count', role: 'value' },
            { type: 'number', read: false, write: false, id: 'x.count', role: 'state' },
            // string
            { type: 'string', read: true, write: false, id: 'x.firmwareVersion', role: 'info.firmware' },
            { type: 'string', read: true, write: false, id: 'x.status', role: 'info.status' },
            { type: 'string', read: true, write: false, id: 'x.model', role: 'info.model' },
            { type: 'string', read: true, write: false, id: 'x.mac', role: 'info.mac' },
            { type: 'string', read: true, write: false, id: 'x.hostname', role: 'info.name' },
            { type: 'string', read: true, write: false, id: 'x.hardware', role: 'info.hardware' },
            { type: 'string', read: true, write: false, id: 'x.serial', role: 'info.serial' },
            { type: 'string', read: true, write: false, id: 'x.other', role: 'text' },
            { type: 'string', read: true, write: true, id: 'x.model', role: 'text' },
            { type: 'string', write: false, id: 'x.model', role: 'text' },
            // unknown type
            { type: 'mixed', read: true, write: true, id: 'x.other', role: 'state' },
        ];

        for (const testCase of cases) {
            it(`returns "${testCase.role}" for ${testCase.type} ${testCase.id} (read ${testCase.read}, write ${testCase.write}, unit ${testCase.unit})`, () => {
                const { iob } = createMyIob();
                const common = { type: testCase.type, read: testCase.read, write: testCase.write, unit: testCase.unit };

                expect(iob.assignPredefinedRoles(common, testCase.id)).to.equal(testCase.role);
            });
        }

        it('returns "state" and logs an error if the common is missing', () => {
            const { iob, adapter } = createMyIob();

            expect(iob.assignPredefinedRoles(undefined, 'x.y')).to.equal('state');
            expect(messages(adapter.log.error).some(msg => msg.includes('assignPredefinedRoles'))).to.be.true;
        });
    });

    describe('deepDiffBetweenObjects', () => {
        it('returns only the changed primitive values', () => {
            const { iob, adapter } = createMyIob();

            const result = iob.deepDiffBetweenObjects({ a: 1, b: 2, c: 3 }, { a: 1, b: 3 }, adapter);

            expect(result).to.deep.equal({ b: 2, c: 3 });
        });

        it('returns only the changed nested values', () => {
            const { iob, adapter } = createMyIob();

            const result = iob.deepDiffBetweenObjects({ x: { y: 2, z: 1 } }, { x: { y: 1, z: 1 } }, adapter);

            expect(result).to.deep.equal({ x: { y: 2 } });
        });

        it('returns an empty object if nothing differs', () => {
            const { iob, adapter } = createMyIob();

            expect(iob.deepDiffBetweenObjects({ a: { b: 1 } }, { a: { b: 1 } }, adapter)).to.deep.equal({});
        });

        it('returns pure arrays that differ as a whole', () => {
            const { iob, adapter } = createMyIob();

            expect(iob.deepDiffBetweenObjects({ arr: [1, 2] }, { arr: [1] }, adapter)).to.deep.equal({ arr: [1, 2] });
        });

        it('returns arrays of objects with null for unchanged items', () => {
            const { iob, adapter } = createMyIob();

            const result = iob.deepDiffBetweenObjects({ list: [{ a: 1 }, { a: 2 }] }, { list: [{ a: 1 }, { a: 1 }] }, adapter);

            expect(result).to.deep.equal({ list: [null, { a: 2 }] });
        });

        it('returns array items that are new in the object', () => {
            const { iob, adapter } = createMyIob();

            const result = iob.deepDiffBetweenObjects({ list: [{ a: 1 }] }, { list: [] }, adapter);

            expect(result).to.deep.equal({ list: [{ a: 1 }] });
        });

        it('returns only the allowed keys', () => {
            const { iob, adapter } = createMyIob();

            const result = iob.deepDiffBetweenObjects({ a: 2, b: 3 }, { a: 1, b: 1 }, adapter, ['a']);

            expect(result).to.deep.equal({ a: 2 });
        });

        it('returns missing base keys as changes', () => {
            const { iob, adapter } = createMyIob();

            expect(iob.deepDiffBetweenObjects({ a: { b: 1 } }, {}, adapter)).to.deep.equal({ a: { b: 1 } });
        });

        it('returns an object as a change if the base value is a primitive', () => {
            const { iob, adapter } = createMyIob();

            expect(iob.deepDiffBetweenObjects({ x: { y: 1 } }, { x: 1 }, adapter)).to.deep.equal({ x: { y: 1 } });
        });

        it('uses the prefix in the allowed key check', () => {
            const { iob, adapter } = createMyIob();

            expect(iob.deepDiffBetweenObjects({ y: 2 }, { y: 1 }, adapter, ['x.y'], 'x')).to.deep.equal({ y: 2 });
        });

        it('logs an error and skips a key if the base cannot be read', () => {
            const { iob, adapter } = createMyIob();
            const base: any = { toJSON: () => 'base' };
            Object.defineProperty(base, 'a', {
                enumerable: true,
                get: () => {
                    throw new Error('getter boom');
                },
            });

            const result = iob.deepDiffBetweenObjects({ a: 1 }, base, adapter);

            expect(result).to.deep.equal({});
            expect(messages(adapter.log.error).some(msg => msg.includes('transform error'))).to.be.true;
        });

        it('returns the object and logs an error if it cannot be iterated', () => {
            const { iob, adapter } = createMyIob();
            const object: any = {};
            Object.defineProperty(object, 'toJSON', { value: () => 'object', enumerable: false });
            Object.defineProperty(object, 'x', {
                enumerable: true,
                get: () => {
                    throw new Error('iterate boom');
                },
            });

            const result = iob.deepDiffBetweenObjects(object, {}, adapter);

            expect(result).to.equal(object);
            expect(messages(adapter.log.error).some(msg => msg.includes('iterate boom'))).to.be.true;
        });
    });

    describe('findMissingTranslation', () => {
        it('warns about names without a translation', () => {
            const utils = createUtilsStub({ Known: { en: 'Known', de: 'Bekannt' } });
            const { iob, adapter } = createMyIob({ utils });
            const tree = {
                disk: {
                    get: () => ({
                        temp: { iobType: 'number', name: 'Missing Name' },
                        known: { iobType: 'string', name: 'Known' },
                    }),
                },
            };

            iob.findMissingTranslation(tree);

            expect(adapter.log.warn.calledOnce).to.be.true;
            const logMsg = String(adapter.log.warn.firstCall.args[0]);
            expect(logMsg).to.include('missing translations');
            expect(logMsg).to.include('Missing Name');
            expect(logMsg).not.to.include('Known');
        });

        it('uses the key as name if the definition has no name', () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                disk: {
                    get: () => ({
                        channel: { object: { child: { iobType: 'number' } } },
                    }),
                },
            };

            iob.findMissingTranslation(tree);

            const logMsg = String(adapter.log.warn.firstCall.args[0]);
            expect(logMsg).to.include('"child":"child"');
            expect(logMsg).to.include('"channel":"channel"');
        });

        it('does not warn if all names are translated', () => {
            const utils = createUtilsStub({ Known: { en: 'Known', de: 'Bekannt' } });
            const { iob, adapter } = createMyIob({ utils });
            const tree = { disk: { get: () => ({ known: { iobType: 'string', name: 'Known' } }) } };

            iob.findMissingTranslation(tree);

            expect(adapter.log.warn.called).to.be.false;
        });

        it('checks nested groups without a get function', () => {
            const { iob, adapter } = createMyIob();
            const tree = { group: { disk: { get: () => ({ temp: { iobType: 'number', name: 'Missing' } }) } } };

            iob.findMissingTranslation(tree);

            expect(adapter.log.warn.calledOnce).to.be.true;
        });

        it('ignores entries with events in the key', () => {
            const { iob, adapter } = createMyIob();
            const tree = { events: { get: () => ({ temp: { iobType: 'number', name: 'Missing' } }) } };

            iob.findMissingTranslation(tree);

            expect(adapter.log.warn.called).to.be.false;
        });

        it('logs an error if the tree cannot be read', () => {
            const { iob, adapter } = createMyIob();
            const tree = {
                disk: {
                    get: () => {
                        throw new Error('get boom');
                    },
                },
            };

            iob.findMissingTranslation(tree);

            expect(messages(adapter.log.error).some(msg => msg.includes('get boom'))).to.be.true;
        });
    });
});
