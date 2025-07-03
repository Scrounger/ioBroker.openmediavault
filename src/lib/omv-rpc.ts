import fetch from 'node-fetch';
import fetchCookie, { FetchCookieImpl } from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import https from 'https';
import * as url from 'url';

import * as myTypes from './myTypes.js'
import { IoBrokerObjectDefinitions } from './myTypes.js';

export class OmvApi {
    private logPrefix: string = 'OmvApi';

    public isConnected = false;

    private adapter: ioBroker.Adapter;
    private log: ioBroker.Logger;

    url: URL;
    httpsAgent: https.Agent | undefined = undefined;
    private jar: CookieJar;
    private fetchWithCookies: FetchCookieImpl<fetch.RequestInfo, fetch.RequestInit, fetch.Response>;


    public constructor(adapter: ioBroker.Adapter) {
        this.adapter = adapter;
        this.log = adapter.log;

        this.url = new url.URL(`${this.adapter.config.url}/rpc.php`)

        if (this.adapter.config.ignoreSSLCertificate && this.url.protocol === 'https:') {
            this.httpsAgent = new https.Agent({
                rejectUnauthorized: false,
            });
        }

        this.jar = new CookieJar();
        this.fetchWithCookies = fetchCookie(fetch, this.jar);
    }

    public async login() {
        const logPrefix = `[${this.logPrefix}.login]:`;

        try {
            const response = await this.fetchWithCookies(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.getEndpointData(ApiEndpoints.login)),
                agent: this.httpsAgent,
            });

            if (response.ok) {
                const result = await response.json();

                if (result && response) {
                    if (result.response.authenticated) {
                        this.log.debug(`${logPrefix} result: ${JSON.stringify(result)}`);

                        this.log.info(`${logPrefix} login to OpenMediaVault successful`);

                        await this.setConnectionStatus(true)

                        return;
                    } else {
                        this.log.error(`${logPrefix} OpenMediaVault authenticated failed`);
                    }
                } else {
                    this.log.error(`${logPrefix} OpenMediaVault no data in repsonse`);
                }
            } else {
                this.log.error(`${logPrefix} HTTP error! Status: ${response.status} - ${response.statusText}`);
            }

        } catch (error: any) {
            this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
        }

        await this.setConnectionStatus(false);
    }

    public async retrievData(endpoint: ApiEndpoints) {
        const logPrefix = `[${this.logPrefix}.retrievData]:`;

        try {
            const response = await this.fetchWithCookies(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.getEndpointData(endpoint)),
                agent: this.httpsAgent,
            });

            if (response.ok) {
                const result = await response.json();

                if (result && result.response) {
                    this.log.debug(`${logPrefix} reponse data for endpoint '${endpoint}': ${JSON.stringify(result)}`);

                    if (result.response.data) {
                        return result.response.data;
                    } else {
                        return result.response;
                    }
                } else {
                    if (result && result.error) {
                        this.log.error(`${logPrefix} OpenMediaVault error: ${result.error}`);
                    } else {
                        this.log.error(`${logPrefix} OpenMediaVault no data in repsonse`);
                    }

                    return undefined;
                }
            } else {
                this.log.error(`${logPrefix} HTTP error! Status: ${response.status} - ${response.statusText}`);
            }

        } catch (error: any) {
            this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
        }

        await this.setConnectionStatus(false);
        return undefined;
    }

    public async logout() {
        const logPrefix = `[${this.logPrefix}.logout]:`;

        try {
            const response = await this.fetchWithCookies(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.getEndpointData(ApiEndpoints.login)),
                agent: this.httpsAgent,
            });

            if (response.ok) {
                this.log.info(`${logPrefix} login from OpenMediaVault successful`);

                const result = await response.json();
                this.log.info(JSON.stringify(result));
            }
        } catch (error: any) {
            this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
        }

        await this.setConnectionStatus(false);
    }

    private getEndpointData(endpoint: ApiEndpoints): myTypes.EndpointData {
        switch (endpoint) {
            case ApiEndpoints.login:
                return {
                    service: 'session',
                    method: 'login',
                    params: {
                        username: this.adapter.config.user,
                        password: this.adapter.config.password,
                    },
                }
            case ApiEndpoints.logout:
                return {
                    service: 'session',
                    method: 'logout',
                    params: null,
                }
            case ApiEndpoints.hwInfo:
                return {
                    service: 'System',
                    method: 'getInformation',
                    params: null,
                }
            case ApiEndpoints.disk:
                return {
                    service: 'DiskMgmt',
                    method: 'enumerateDevices',
                    params: null,
                }
            case ApiEndpoints.smart:
                return {
                    service: 'Smart',
                    method: 'getList',
                    params: {
                        start: 0,
                        limit: -1
                    }
                }
            case ApiEndpoints.fileSystem:
                return {
                    service: 'FileSystemMgmt',
                    method: 'enumerateMountedFilesystems',
                }
            case ApiEndpoints.shareMgmt:
                return {
                    service: 'ShareMgmt',
                    method: 'enumerateSharedFolders',
                    params: {
                        start: 0,
                        limit: -1
                    }
                }
            case ApiEndpoints.service:
                return {
                    service: 'Services',
                    method: 'getStatus',
                }
            case ApiEndpoints.plugin:
                return {
                    service: 'Plugin',
                    method: 'enumeratePlugins',
                }
            case ApiEndpoints.network:
                return {
                    service: 'Network',
                    method: 'enumerateDevices',
                }
            case ApiEndpoints.kvm:
                return {
                    service: 'Kvm',
                    method: 'getVmList',
                }
            default:
                return {
                    service: 'System',
                    method: 'getInformation',
                }
        }
    }

    /** Set adapter info.connection state and internal var
    * @param {boolean} isConnected
    */
    private async setConnectionStatus(isConnected: boolean) {
        const logPrefix = `[${this.logPrefix}.setConnectionStatus]:`;

        try {
            this.isConnected = isConnected;
            await this.adapter.setState('info.connection', isConnected, true);
        } catch (error: any) {
            this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
        }
    }
}

export enum ApiEndpoints {
    login = 'login',
    logout = 'logout',

    // tree classes must have the same name like enums
    hwInfo = 'hwInfo',
    disk = 'disk',
    smart = 'smart',
    fileSystem = 'fileSystem',
    shareMgmt = 'shareMgmt',
    service = 'service',
    plugin = 'plugin',
    network = 'network',
    kvm = 'kvm'
}

export const iobObjectDef: { [key: string]: IoBrokerObjectDefinitions; } = {
    hwInfo: {
        channelName: 'hardware info',
        deviceIdProperty: undefined,
        deviceNameProperty: undefined,
    },
    disk: {
        channelName: 'disk info',
        deviceIdProperty: 'devicename',
        deviceNameProperty: 'devicename',
    },
    smart: {
        channelName: 'S.M.A.R.T info',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'devicename',
    },
    fileSystem: {
        channelName: 'file system info',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'comment',
    },
    shareMgmt: {
        channelName: 'shared folders',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'name',
    }
}