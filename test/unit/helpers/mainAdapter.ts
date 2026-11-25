import sinon from 'sinon';
import startAdapter from '../../../src/main.js';

/**
 * Default adapter configuration used by the unit tests. Values are overridden per test.
 */
export const DEFAULT_CONFIG = {
    url: '',
    user: '',
    password: '',
    updateMethode: false,
    updateInterval: 60,
    updateCron: '0 * * * *',
};

/**
 * Creates a logger with sinon stubs for all log levels.
 */
export function createLogStub(): Record<'debug' | 'info' | 'warn' | 'error' | 'silly', sinon.SinonStub> & { level: string } {
    return {
        debug: sinon.stub(),
        info: sinon.stub(),
        warn: sinon.stub(),
        error: sinon.stub(),
        silly: sinon.stub(),
        level: 'info',
    };
}

/**
 * Creates an adapter instance for the unit tests.
 *
 * The instance is created by the real `startAdapter()` export, so the constructor wiring is tested
 * as well. Runtime members that the real Adapter normally provides (`log`, `config`, `sendTo`, ...)
 * are replaced by test doubles. Private members are typed `any` because the tests call them directly.
 *
 * @param overrides values to set on the instance after creation
 */
export function createMainAdapter(overrides: Record<string, unknown> = {}): any {
    const adapter: any = startAdapter({});

    adapter.log = createLogStub();
    adapter.config = { ...DEFAULT_CONFIG };
    adapter.connected = false;
    adapter.sendTo = sinon.stub();

    return Object.assign(adapter, overrides);
}
