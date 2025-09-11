/*
 * Created with @iobroker/create-adapter v2.6.5
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import _ from 'lodash';
import url from 'node:url';

// Load your modules here, e.g.:
import { ApiEndpoints, OmvApi } from './lib/omv-rpc.js';
import * as tree from './lib/tree/index.js'
import * as myHelper from './lib/helper.js';
import type { IoBrokerObjectDefinitions } from './lib/myTypes.js';
import { myIob } from './lib/myIob.js';

class Openmediavault extends utils.Adapter {
	omvApi: OmvApi | undefined = undefined;

	myIob: myIob;

	subscribedList: string[] = [];

	statesUsingValAsLastChanged = [          // id of states where lc is taken from the value
	];

	updateTimeout: ioBroker.Timeout | undefined = undefined;

	configDevicesCache: { [key: string]: { label: string, value: string }[] } = {};

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: 'openmediavault',
			useFormatDate: true
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	//#region adapter methods

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		const logPrefix = '[onReady]:';

		try {
			this.connected = false;

			await utils.I18n.init(`${utils.getAbsoluteDefaultDataDir().replace('iobroker-data/', '')}node_modules/iobroker.${this.name}/admin`, this);

			this.myIob = new myIob(this, utils, this.statesUsingValAsLastChanged);

			if (this.config.url && this.config.user && this.config.password) {
				this.omvApi = new OmvApi(this);

				await this.updateData(true);
			} else {
				this.log.warn(`${logPrefix} url and / or login data missing!`);
			}

			this.myIob.findMissingTranslation();

			// const tmp = tree.smart.getStateIDs();
			// let list = []

			// for (let id of tmp) {
			// 	list.push({ id: id });
			// }

			// this.log.warn(JSON.stringify(list));

		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * 
	 * @param callback 
	 */
	private async onUnload(callback: () => void): Promise<void> {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			if (this.updateTimeout) {
				clearTimeout(this.updateTimeout);
			}
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			await this.omvApi?.logout();

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  */
	// private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * 
	 * @param id
	 * @param state
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	/**
	 * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	 * Using this method requires 'common.messagebox' property to be set to true in io-package.json
	 * 
	 * @param obj
	 */
	private onMessage(obj: ioBroker.Message): void {
		const logPrefix = '[onMessage]:';

		try {
			if (typeof obj === 'object') {
				if (obj.command.endsWith('StateList')) {
					const states = tree[obj.command.replace('StateList', '')].getStateIDs();
					let list = [];

					if (states) {
						for (let i = 0; i <= states.length - 1; i++) {

							if (states[i + 1] && states[i] === this.myIob.getIdWithoutLastPart(states[i + 1])) {
								list.push({
									label: `[Channel]\t ${states[i]}`,
									value: states[i],
								});
							} else {
								list.push({
									label: `[State]\t\t ${states[i]}`,
									value: states[i],
								});
							}
						}
					}

					list = _.orderBy(list, ['value'], ['asc']);

					if (obj.callback) {
						this.sendTo(obj.from, obj.command, list, obj.callback);
					}
				} else if (obj.command.endsWith('BlackList')) {
					if (this.connected && this.omvApi?.isConnected) {
						let list: { label: string, value: string }[] = [];

						if (this.configDevicesCache[obj.command.replace('BlackList', '')]) {
							list = this.configDevicesCache[obj.command.replace('BlackList', '')]
							list = _.orderBy(list, ['label'], ['asc']);

							if (obj.callback) {
								this.sendTo(obj.from, obj.command, list, obj.callback);
							}
						}
					}
				}
			}

		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	//#endregion

	//#region updateData

	private async updateData(isAdapterStart: boolean = false): Promise<void> {
		const logPrefix = '[updateData]:';

		try {
			if (this.updateTimeout) {
				this.clearTimeout(this.updateTimeout);
				this.updateTimeout = undefined;
			}

			this.updateTimeout = this.setTimeout(async () => {
				await this.updateData()
			}, this.config.updateInterval * 1000);

			if (this.omvApi) {
				if (!this.omvApi.isConnected) {
					await this.omvApi.login();
				}

				if (this.connected && this.omvApi?.isConnected) {
					for (const endpoint in ApiEndpoints) {
						if (tree[endpoint]) {
							if (Object.hasOwn(tree[endpoint], 'iobObjectDefintions')) {
								this.log.debug(`${logPrefix} [${endpoint}]: start updating data...`);

								//@ts-ignore
								await this.updateDataGeneric(endpoint, tree[endpoint], tree[endpoint].iobObjectDefintions, isAdapterStart);
							} else {
								if (this.log.level === 'debug') {
									this.log.warn(`${logPrefix} no iob definitions for endpoint ${endpoint} exists!`);
								}
							}
						}
					}
				}
			}
		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	/**
	 * update data gerneric
	 * 
	 * @param endpoint
	 * @param treeType
	 * @param iobObjectDefintions
	 * @param isAdapterStart
	 */
	private async updateDataGeneric(endpoint: ApiEndpoints, treeType: any, iobObjectDefintions: IoBrokerObjectDefinitions, isAdapterStart: boolean = false): Promise<void> {
		const logPrefix = `[updateDataGeneric]: [${endpoint}]: `;

		try {
			if (this.connected && this.omvApi?.isConnected) {
				if (this.config[`${endpoint}Enabled`]) {
					if (isAdapterStart) {
						await this.myIob.createOrUpdateChannel(treeType.idChannel, iobObjectDefintions.channelName, undefined, true);
					}

					const data: any = await this.omvApi?.retrievData(endpoint);

					if (data) {
						if (Array.isArray(data)) {
							this.configDevicesCache[endpoint] = []

							for (let device of data) {
								if (iobObjectDefintions.deviceIdProperty && device[iobObjectDefintions.deviceIdProperty]) {
									const idDevice = `${treeType.idChannel}.${device[iobObjectDefintions.deviceIdProperty]}`;

									if ((!this.config[`${endpoint}IsWhiteList`] && !_.some(this.config[`${endpoint}BlackList`], { id: device[iobObjectDefintions.deviceIdProperty] })) || (this.config[`${endpoint}IsWhiteList`] && _.some(this.config[`${endpoint}BlackList`], { id: device[iobObjectDefintions.deviceIdProperty] }))) {

										if (Object.hasOwn(iobObjectDefintions, 'additionalRequest')) {
											if (iobObjectDefintions.additionalRequest) {
												if (device[iobObjectDefintions.additionalRequest.conditionProperty]) {
													const addtionalData = await this.omvApi?.retrievData(iobObjectDefintions.additionalRequest.endpoint,
														{
															[iobObjectDefintions.additionalRequest.paramsProperty]: device[iobObjectDefintions.additionalRequest.paramsProperty]
														});

													device = { ...addtionalData, ...device }
												} else {
													this.log.debug(`${logPrefix} device '${device[iobObjectDefintions.deviceIdProperty]}' - no additional data request because condition property '${iobObjectDefintions.additionalRequest.conditionProperty}' is '${device[iobObjectDefintions.additionalRequest.conditionProperty]}'`);
												}
											}
										}

										this.configDevicesCache[endpoint].push({
											label: `${device[iobObjectDefintions.deviceNameProperty]} (${device[iobObjectDefintions.deviceIdProperty]})`,
											value: device[iobObjectDefintions.deviceIdProperty],
										});

										const deviceName = iobObjectDefintions.deviceNameProperty && device[iobObjectDefintions.deviceNameProperty] ? device[iobObjectDefintions.deviceNameProperty] : 'unknown';

										await this.myIob.createOrUpdateDevice(idDevice, deviceName, undefined, undefined, undefined, isAdapterStart, true);
										await this.myIob.createOrUpdateStates(idDevice, treeType.get(), device, device, this.config[`${endpoint}StatesBlackList`], this.config[`${endpoint}StatesIsWhiteList`], deviceName, isAdapterStart);

										this.log.debug(`${logPrefix} device '${device[iobObjectDefintions.deviceIdProperty]}' data successfully updated`);
									} else {
										if (isAdapterStart) {
											if (await this.objectExists(idDevice)) {
												await this.delObjectAsync(idDevice, { recursive: true });
												this.log.warn(`${logPrefix} device '${device[iobObjectDefintions.deviceNameProperty]}' (id: ${device[iobObjectDefintions.deviceIdProperty]}) delete, ${this.config[`${endpoint}IsWhiteList`] ? 'it\'s not on the whitelist' : 'it\'s on the blacklist'}`);
											}
										}
									}
								} else {
									this.log.error(`${logPrefix} deviceName property '${iobObjectDefintions.deviceIdProperty}' not exists in device`);
								}
							}
						} else {
							await this.myIob.createOrUpdateStates(treeType.idChannel, treeType.get(), data, data, this.config[`${endpoint}StatesBlackList`], this.config[`${endpoint}StatesIsWhiteList`], iobObjectDefintions.channelName, isAdapterStart);

							this.log.debug(`${logPrefix} channel '${iobObjectDefintions.channelName}' data successfully updated`);
						}

						if (isAdapterStart) {
							this.log.info(`${logPrefix} data successfully updated`);
						}
					}
				} else {
					if (await this.objectExists(treeType.idChannel)) {
						await this.delObjectAsync(treeType.idChannel, { recursive: true });
						this.log.debug(`${logPrefix} '${treeType.idChannel}' deleted`);
					}
				}
			}
		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	//#endregion
}

// replace only needed for dev system
const modulePath = url.fileURLToPath(import.meta.url).replace('/development/', '/node_modules/');

if (process.argv[1] === modulePath) {
	// start the instance directly
	new Openmediavault();
}

export default function startAdapter(options: Partial<utils.AdapterOptions> | undefined): Openmediavault {
	// compact mode
	return new Openmediavault(options);
}