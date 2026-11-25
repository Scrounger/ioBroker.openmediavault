/**
 * Gemeinsame Helfer für die Live-Tests gegen einen echten OpenMediaVault-Server.
 *
 * - Zugangsdaten kommen aus der .env im Projektverzeichnis:
 *   OMV_URL (z.B. https://omv.local), OMV_USER, OMV_PASSWORD
 *   optional: OMV_IGNORE_SSL_CERTIFICATE (true/false), OMV_CONNECTION_TIMEOUT (ms)
 * - Werte werden nie ausgegeben.
 * - Ist die .env oder eine Pflicht-Variable nicht gesetzt, liefert getLiveConfig() undefined
 *   und die Tests werden übersprungen.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OmvApi } from '../../src/lib/omv-rpc.js';

export interface LiveConfig {
    url: string;
    user: string;
    password: string;
    ignoreSSLCertificate: boolean;
    connectionTimeout: number;
}

const DEFAULT_CONNECTION_TIMEOUT = 10000;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const envFile = path.join(root, '.env');

/**
 * @returns the controller access from the .env, or undefined if it is incomplete
 */
export function getLiveConfig(): LiveConfig | undefined {
    if (!existsSync(envFile)) {
        return undefined;
    }

    process.loadEnvFile(envFile);

    const {
        OMV_URL: url,
        OMV_USER: user,
        OMV_PASSWORD: password,
        OMV_IGNORE_SSL_CERTIFICATE: ignoreSSL,
        OMV_CONNECTION_TIMEOUT: timeout,
    } = process.env;

    if (!url || !user || !password) {
        return undefined;
    }

    return {
        url,
        user,
        password,
        ignoreSSLCertificate: ignoreSSL === 'true',
        connectionTimeout: Number(timeout) || DEFAULT_CONNECTION_TIMEOUT,
    };
}

const logger = {
    silly: (): void => { },
    debug: (): void => { },
    info: (): void => { },
    warn: (): void => { },
    error: (message: string): void => console.error(`[omv] ${message}`),
};

/**
 * @returns a new `OmvApi` client for the live tests, with a minimal adapter double
 */
export function createApi(config: LiveConfig): OmvApi {
    // OmvApi only uses config, log and setState of the adapter
    const adapter: any = {
        config: {
            url: config.url,
            user: config.user,
            password: config.password,
            ignoreSSLCertificate: config.ignoreSSLCertificate,
            connectionTimeout: config.connectionTimeout,
        },
        log: logger,
        connected: false,
        setState: async (): Promise<void> => { },
    };

    return new OmvApi(adapter);
}
