import fetch, { AbortError } from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import https from 'node:https';
import * as url from 'node:url';
export var ApiEndpoints;
(function (ApiEndpoints) {
    ApiEndpoints["login"] = "login";
    ApiEndpoints["logout"] = "logout";
    // tree classes must have the same name like enums
    ApiEndpoints["hwInfo"] = "hwInfo";
    ApiEndpoints["disk"] = "disk";
    ApiEndpoints["smart"] = "smart";
    ApiEndpoints["smartInfo"] = "smartInfo";
    ApiEndpoints["smartAttributes"] = "smartAttributes";
    ApiEndpoints["fileSystem"] = "fileSystem";
    ApiEndpoints["shareMgmt"] = "shareMgmt";
    ApiEndpoints["smb"] = "smb";
    ApiEndpoints["fsTab"] = "fsTab";
    ApiEndpoints["service"] = "service";
    ApiEndpoints["plugin"] = "plugin";
    ApiEndpoints["network"] = "network";
    ApiEndpoints["kvm"] = "kvm";
})(ApiEndpoints || (ApiEndpoints = {}));
export class OmvApi {
    logPrefix = 'OmvApi';
    isConnected = false;
    adapter;
    log;
    url;
    httpsAgent = undefined;
    jar;
    fetchWithCookies;
    constructor(adapter) {
        const logPrefix = `[${this.logPrefix}.constructor]:`;
        this.adapter = adapter;
        this.log = adapter.log;
        try {
            this.url = new url.URL(`${this.adapter.config.url}/rpc.php`);
            if (this.adapter.config.ignoreSSLCertificate && this.url.protocol === 'https:') {
                this.httpsAgent = new https.Agent({
                    rejectUnauthorized: false,
                });
            }
            this.jar = new CookieJar();
            this.fetchWithCookies = fetchCookie(fetch, this.jar);
        }
        catch (error) {
            this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
            this.url = undefined;
        }
    }
    async login() {
        const logPrefix = `[${this.logPrefix}.login]:`;
        try {
            if (this.url) {
                const response = await this.fetchWithCookies(this.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.getEndpointData(ApiEndpoints.login)),
                    agent: this.httpsAgent,
                    signal: AbortSignal.timeout(5000),
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result && response) {
                        if (result.response.authenticated) {
                            this.log.debug(`${logPrefix} result: ${JSON.stringify(result)}`);
                            this.log.info(`${logPrefix} login to OpenMediaVault successful`);
                            await this.setConnectionStatus(true);
                            return;
                        }
                        else {
                            this.log.error(`${logPrefix} OpenMediaVault authenticated failed`);
                        }
                    }
                    else {
                        this.log.error(`${logPrefix} OpenMediaVault no data in repsonse`);
                    }
                }
                else {
                    this.log.error(`${logPrefix} HTTP error! Status: ${response.status} - ${response.statusText}`);
                }
            }
            else {
                this.log.error(`${logPrefix} url '${this.url}' is not valid. Check the adapter settings!`);
            }
        }
        catch (error) {
            if (error instanceof AbortError) {
                this.log.error(`${logPrefix} no connection to OpenMediaVault -> Timeout !`);
            }
            else {
                this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
            }
        }
        await this.setConnectionStatus(false);
    }
    async retrievData(endpoint, params = undefined) {
        const logPrefix = `[${this.logPrefix}.retrievData]:`;
        try {
            const endpointData = this.getEndpointData(endpoint);
            if (params) {
                endpointData.params = params;
            }
            const response = await this.fetchWithCookies(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(endpointData),
                agent: this.httpsAgent,
                signal: AbortSignal.timeout(5000),
            });
            if (response.ok) {
                const result = await response.json();
                if (result && result.response) {
                    this.log.silly(`${logPrefix} reponse data for endpoint '${endpoint}'${params ? ` (params: ${JSON.stringify(params)})` : ''}: ${JSON.stringify(result)}`);
                    if (result.response.data) {
                        return result.response.data;
                    }
                    else {
                        return result.response;
                    }
                }
                else {
                    if (result && result.error) {
                        this.log.error(`${logPrefix} OpenMediaVault error: ${result.error}`);
                    }
                    else {
                        this.log.error(`${logPrefix} OpenMediaVault no data in repsonse`);
                    }
                    return undefined;
                }
            }
            else {
                this.log.error(`${logPrefix} HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
        }
        catch (error) {
            if (error instanceof AbortError) {
                this.log.error(`${logPrefix} no connection to OpenMediaVault -> Timeout !`);
            }
            else {
                this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
            }
        }
        await this.setConnectionStatus(false);
        return undefined;
    }
    async logout() {
        const logPrefix = `[${this.logPrefix}.logout]:`;
        try {
            if (this.isConnected) {
                const response = await this.fetchWithCookies(this.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.getEndpointData(ApiEndpoints.logout)),
                    agent: this.httpsAgent,
                    signal: AbortSignal.timeout(5000),
                });
                if (response.ok) {
                    this.log.info(`${logPrefix} logout from OpenMediaVault successful`);
                    const result = await response.json();
                    this.log.info(JSON.stringify(result));
                }
            }
            else {
                this.log.info(`${logPrefix} we are not logged in, so no logout is needed`);
            }
        }
        catch (error) {
            if (error instanceof AbortError) {
                this.log.error(`${logPrefix} no connection to OpenMediaVault -> Timeout !`);
            }
            else {
                this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
            }
        }
        await this.setConnectionStatus(false);
    }
    getEndpointData(endpoint) {
        switch (endpoint) {
            case ApiEndpoints.login:
                return {
                    service: 'session',
                    method: 'login',
                    params: {
                        username: this.adapter.config.user,
                        password: this.adapter.config.password,
                    },
                };
            case ApiEndpoints.logout:
                return {
                    service: 'session',
                    method: 'logout',
                    params: null,
                };
            case ApiEndpoints.hwInfo:
                return {
                    service: 'System',
                    method: 'getInformation',
                    params: null,
                };
            case ApiEndpoints.disk:
                return {
                    service: 'DiskMgmt',
                    method: 'enumerateDevices',
                    params: null,
                };
            case ApiEndpoints.smart:
                return {
                    service: 'Smart',
                    method: 'getList',
                    params: {
                        start: 0,
                        limit: -1,
                    }
                };
            case ApiEndpoints.smartInfo:
                return {
                    service: 'Smart',
                    method: 'getInformation',
                    params: null
                };
            case ApiEndpoints.smartAttributes:
                return {
                    service: 'Smart',
                    method: 'getAttributes',
                    params: null
                };
            case ApiEndpoints.fileSystem:
                return {
                    service: 'FileSystemMgmt',
                    method: 'enumerateMountedFilesystems',
                    params: null,
                };
            case ApiEndpoints.shareMgmt:
                return {
                    service: 'ShareMgmt',
                    method: 'enumerateSharedFolders',
                    params: {
                        start: 0,
                        limit: -1,
                    }
                };
            case ApiEndpoints.smb:
                return {
                    service: 'SMB',
                    method: 'getShareList',
                    params: {
                        start: 0,
                        limit: -1,
                    }
                };
            case ApiEndpoints.fsTab:
                return {
                    service: 'FsTab',
                    method: 'enumerateEntries',
                    params: null,
                };
            case ApiEndpoints.service:
                return {
                    service: 'Services',
                    method: 'getStatus',
                    params: null,
                };
            case ApiEndpoints.plugin:
                return {
                    service: 'Plugin',
                    method: 'enumeratePlugins',
                    params: null,
                };
            case ApiEndpoints.network:
                return {
                    service: 'Network',
                    method: 'enumerateDevices',
                    params: null,
                };
            case ApiEndpoints.kvm:
                return {
                    service: 'Kvm',
                    method: 'getVmList',
                    params: null,
                };
            default:
                return {
                    service: 'System',
                    method: 'getInformation',
                    params: null,
                };
        }
    }
    /**
     * Set adapter info.connection state and internal var
     *
     * @param isConnected
     */
    async setConnectionStatus(isConnected) {
        const logPrefix = `[${this.logPrefix}.setConnectionStatus]:`;
        try {
            this.adapter.connected = isConnected;
            this.isConnected = isConnected;
            await this.adapter.setState('info.connection', isConnected, true);
        }
        catch (error) {
            this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
        }
    }
}
