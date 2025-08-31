/// <reference types="node" />
import https from 'node:https';
export declare enum ApiEndpoints {
    login = "login",
    logout = "logout",
    hwInfo = "hwInfo",
    disk = "disk",
    smart = "smart",
    smartInfo = "smartInfo",
    fileSystem = "fileSystem",
    shareMgmt = "shareMgmt",
    smb = "smb",
    fsTab = "fsTab",
    service = "service",
    plugin = "plugin",
    network = "network",
    kvm = "kvm"
}
export declare class OmvApi {
    private logPrefix;
    isConnected: boolean;
    private adapter;
    private log;
    url: URL;
    httpsAgent: https.Agent | undefined;
    private jar;
    private fetchWithCookies;
    constructor(adapter: ioBroker.Adapter);
    login(): Promise<void>;
    retrievData(endpoint: ApiEndpoints, params?: {
        [key: string]: any;
    } | undefined): Promise<any>;
    logout(): Promise<void>;
    private getEndpointData;
    /**
     * Set adapter info.connection state and internal var
     *
     * @param isConnected
     */
    private setConnectionStatus;
}
