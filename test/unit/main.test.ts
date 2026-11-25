import { expect } from 'chai';
import sinon from 'sinon';
import * as tree from '../../src/lib/tree/index.js';
import startAdapter from '../../src/main.js';
import { createLogStub, createMainAdapter } from './helpers/mainAdapter.js';

describe('startAdapter', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('returns an adapter instance with all event handlers registered', () => {
        const adapter: any = startAdapter({});

        expect(adapter).to.be.an('object');
        expect(adapter.handlers).to.have.all.keys('ready', 'stateChange', 'message', 'unload');
    });
});

describe('onStateChange', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('logs value and ack of a changed state', () => {
        const adapter = createMainAdapter();

        adapter.onStateChange('openmediavault.0.disk.sda.temperature', { val: 42, ack: true });

        expect(adapter.log.info).to.have.been.calledWith('state openmediavault.0.disk.sda.temperature changed: 42 (ack = true)');
    });

    it('logs a deleted state', () => {
        const adapter = createMainAdapter();

        adapter.onStateChange('openmediavault.0.disk.sda.temperature', null);

        expect(adapter.log.info).to.have.been.calledWith('state openmediavault.0.disk.sda.temperature deleted');
    });
});

describe('onMessage', () => {
    afterEach(() => {
        sinon.restore();
    });

    const callback = { message: {}, id: 1, ack: false, time: 0 };

    it('answers StateList requests with a sorted list of all states of the endpoint', () => {
        const adapter = createMainAdapter({
            myIob: { getIdWithoutLastPart: (id: string) => id.split('.').slice(0, -1).join('.') },
        });

        adapter.onMessage({ command: 'diskStateList', from: 'system.adapter.admin.0', callback });

        expect(adapter.sendTo).to.have.been.calledOnce;

        const [from, command, list, cb] = adapter.sendTo.firstCall.args;
        expect(from).to.equal('system.adapter.admin.0');
        expect(command).to.equal('diskStateList');
        expect(cb).to.equal(callback);
        expect(list).to.have.length(tree.disk.getStateIDs().length);

        for (const item of list) {
            expect(item.label).to.match(/^\[(State|Channel)\]/);
            expect(item.value).to.be.a('string');
        }

        const values: string[] = list.map((item: { value: string }) => item.value);
        expect(values).to.deep.equal([...values].sort());
    });

    it('does not answer StateList requests without callback', () => {
        const adapter = createMainAdapter({
            myIob: { getIdWithoutLastPart: (id: string) => id },
        });

        adapter.onMessage({ command: 'diskStateList', from: 'system.adapter.admin.0' });

        expect(adapter.sendTo).to.not.have.been.called;
    });

    it('logs an error for a StateList request of an unknown endpoint', () => {
        const adapter = createMainAdapter({
            myIob: { getIdWithoutLastPart: (id: string) => id },
        });

        adapter.onMessage({ command: 'unknownStateList', from: 'system.adapter.admin.0', callback });

        expect(adapter.sendTo).to.not.have.been.called;
        expect(adapter.log.error).to.have.been.calledOnce;
    });

    it('answers BlackList requests with the cached devices when connected', () => {
        const adapter = createMainAdapter({
            myIob: { getIdWithoutLastPart: (id: string) => id },
            connected: true,
            omvApi: { isConnected: true },
            configDevicesCache: {
                disk: [
                    { label: 'sdb (b)', value: 'b' },
                    { label: 'sda (a)', value: 'a' },
                ],
            },
        });

        adapter.onMessage({ command: 'diskBlackList', from: 'system.adapter.admin.0', callback });

        expect(adapter.sendTo).to.have.been.calledOnce;

        const [from, command, list, cb] = adapter.sendTo.firstCall.args;
        expect(from).to.equal('system.adapter.admin.0');
        expect(command).to.equal('diskBlackList');
        expect(list).to.deep.equal([
            { label: 'sda (a)', value: 'a' },
            { label: 'sdb (b)', value: 'b' },
        ]);
        expect(cb).to.equal(callback);
    });

    it('does not answer BlackList requests when not connected', () => {
        const adapter = createMainAdapter({
            myIob: { getIdWithoutLastPart: (id: string) => id },
            connected: false,
            omvApi: { isConnected: true },
            configDevicesCache: { disk: [{ label: 'sda (a)', value: 'a' }] },
        });

        adapter.onMessage({ command: 'diskBlackList', from: 'system.adapter.admin.0', callback });

        expect(adapter.sendTo).to.not.have.been.called;
    });

    it('ignores messages without object payload', () => {
        const adapter = createMainAdapter({
            myIob: { getIdWithoutLastPart: (id: string) => id },
        });

        adapter.onMessage('diskStateList');

        expect(adapter.sendTo).to.not.have.been.called;
    });
});

describe('onUnload', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('cancels the schedule, logs out and calls the callback', async () => {
        const cancel = sinon.spy();
        const logout = sinon.stub().resolves();
        const adapter = createMainAdapter({
            updateSchedule: { cancel },
            omvApi: { logout },
        });
        const callback = sinon.spy();

        await adapter.onUnload(callback);

        expect(cancel).to.have.been.calledOnce;
        expect(logout).to.have.been.calledOnce;
        expect(callback).to.have.been.calledOnce;
    });

    it('clears the update timeout', async () => {
        const clearTimeoutSpy = sinon.spy(globalThis, 'clearTimeout');
        const timeout = setTimeout(() => undefined, 60_000);
        const adapter = createMainAdapter({ updateTimeout: timeout });

        await adapter.onUnload(sinon.spy());

        expect(clearTimeoutSpy).to.have.been.calledWith(timeout);
    });

    it('calls the callback even when logout fails', async () => {
        const adapter = createMainAdapter({
            omvApi: { logout: sinon.stub().rejects(new Error('logout failed')) },
        });
        const callback = sinon.spy();

        await adapter.onUnload(callback);

        expect(callback).to.have.been.calledOnce;
    });
});

describe('logger stub', () => {
    it('provides all log levels as stubs', () => {
        const log = createLogStub();

        for (const level of ['debug', 'info', 'warn', 'error', 'silly'] as const) {
            expect(log[level]).to.be.a('function');
        }
    });
});
