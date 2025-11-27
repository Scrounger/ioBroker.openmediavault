import fetch, { AbortError } from 'node-fetch';
import fetchCookie, { type FetchCookieImpl } from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import https from 'node:https';
import * as url from 'node:url';

import type * as myTypes from './myTypes.js'

export enum ApiEndpoints {
	login = 'login',
	logout = 'logout',

	// tree classes must have the same name like enums
	hwInfo = 'hwInfo',
	disk = 'disk',
	smart = 'smart',
	smartInfo = 'smartInfo',
	smartAttributes = 'smartAttributes',
	fileSystem = 'fileSystem',
	shareMgmt = 'shareMgmt',
	smb = 'smb',
	fsTab = 'fsTab',
	service = 'service',
	plugin = 'plugin',
	network = 'network',
	kvm = 'kvm'
}

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
		const logPrefix = `[${this.logPrefix}.constructor]:`;

		this.adapter = adapter;
		this.log = adapter.log;

		try {
			this.url = new url.URL(`${this.adapter.config.url}/rpc.php`)

			if (this.adapter.config.ignoreSSLCertificate && this.url.protocol === 'https:') {
				this.httpsAgent = new https.Agent({
					rejectUnauthorized: false,
				});
			}

			this.jar = new CookieJar();
			this.fetchWithCookies = fetchCookie(fetch, this.jar);

		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
			this.url = undefined;
		}
	}

	public async login(): Promise<void> {
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
			} else {
				this.log.error(`${logPrefix} url '${this.url}' is not valid. Check the adapter settings!`);
			}
		} catch (error: any) {
			if (error instanceof AbortError) {
				this.log.error(`${logPrefix} no connection to OpenMediaVault -> Timeout !`);
			} else {
				this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
			}
		}

		await this.setConnectionStatus(false);
	}

	public async retrievData(endpoint: ApiEndpoints, params: { [key: string]: any } | undefined = undefined): Promise<any> {
		const logPrefix = `[${this.logPrefix}.retrievData]:`;

		try {
			const endpointData = this.getEndpointData(endpoint);

			if (params) {
				endpointData.params = params
			}

			const response = await this.fetchWithCookies(this.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(endpointData),
				agent: this.httpsAgent,
				signal: AbortSignal.timeout(10000),
			});

			if (response.ok) {
				const result = await response.json();

				if (result && result.response) {
					this.log.silly(`${logPrefix} reponse data for endpoint '${endpoint}'${params ? ` (params: ${JSON.stringify(params)})` : ''}: ${JSON.stringify(result)}`);

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
			if (error instanceof AbortError) {
				this.log.error(`${logPrefix} no connection to OpenMediaVault -> Timeout !`);
			} else {
				this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
			}
		}

		await this.setConnectionStatus(false);
		return undefined;
	}

	public async logout(): Promise<void> {
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
			} else {
				this.log.info(`${logPrefix} we are not logged in, so no logout is needed`);
			}
		} catch (error: any) {
			if (error instanceof AbortError) {
				this.log.error(`${logPrefix} no connection to OpenMediaVault -> Timeout !`);
			} else {
				this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
			}
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
						limit: -1,
					}
				}
			case ApiEndpoints.smartInfo:
				return {
					service: 'Smart',
					method: 'getInformation',
					params: null
				}
			case ApiEndpoints.smartAttributes:
				return {
					service: 'Smart',
					method: 'getAttributes',
					params: null
				}
			case ApiEndpoints.fileSystem:
				return {
					service: 'FileSystemMgmt',
					method: 'getList',
					params: {
						start: 0,
						limit: -1,
					}
				}
			case ApiEndpoints.shareMgmt:
				return {
					service: 'ShareMgmt',
					method: 'enumerateSharedFolders',
					params: {
						start: 0,
						limit: -1,
					}
				}
			case ApiEndpoints.smb:
				return {
					service: 'SMB',
					method: 'getShareList',
					params: {
						start: 0,
						limit: -1,
					}
				}
			case ApiEndpoints.fsTab:
				return {
					service: 'FsTab',
					method: 'enumerateEntries',
					params: null,
				}
			case ApiEndpoints.service:
				return {
					service: 'Services',
					method: 'getStatus',
					params: null,
				}
			case ApiEndpoints.plugin:
				return {
					service: 'Plugin',
					method: 'enumeratePlugins',
					params: null,
				}
			case ApiEndpoints.network:
				return {
					service: 'Network',
					method: 'enumerateDevices',
					params: null,
				}
			case ApiEndpoints.kvm:
				return {
					service: 'Kvm',
					method: 'getVmList',
					params: null,
				}
			default:
				return {
					service: 'System',
					method: 'getInformation',
					params: null,
				}
		}
	}

	/**
	 * Set adapter info.connection state and internal var
	 * 
	 * @param isConnected
	 */
	private async setConnectionStatus(isConnected: boolean): Promise<void> {
		const logPrefix = `[${this.logPrefix}.setConnectionStatus]:`;

		try {
			this.adapter.connected = isConnected
			this.isConnected = isConnected;
			await this.adapter.setState('info.connection', isConnected, true);
		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}
}
