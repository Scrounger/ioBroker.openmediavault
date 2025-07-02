/*
 * Created with @iobroker/create-adapter v2.6.5
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import _ from 'lodash';

// Load your modules here, e.g.:
import { ApiEndpoints, OmvApi } from './lib/omv-rpc.js';
import { HwInfo } from './lib/types-hwInfo.js';
import * as tree from './lib/tree/index.js'
import * as myHelper from './lib/helper.js';
import * as myI18n from './lib/i18n.js';
import { myCommonChannelArray, myCommonState, myCommoneChannelObject } from './lib/myTypes.js';
import { Disk } from './lib/types-disk.js';

class Openmediavault extends utils.Adapter {
	omvApi: OmvApi | undefined = undefined;

	subscribedList: string[] = [];

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

		// ohne worte....
		await myI18n.init(`${utils.getAbsoluteDefaultDataDir().replace('iobroker-data/', '')}node_modules/iobroker.${this.name}/admin`, this);

		this.omvApi = new OmvApi(this);

		await this.updateData(true);

		// // Initialize your adapter here

		// // The adapters config (in the instance object everything under the attribute "native") is accessible via
		// // this.config:
		// this.log.info('config option1: ' + this.config.option1);
		// this.log.info('config option2: ' + this.config.option2);

		// /*
		// For every state in the system there has to be also an object of type state
		// Here a simple template for a boolean variable named "testVariable"
		// Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		// */
		// await this.setObjectNotExistsAsync('testVariable', {
		// 	type: 'state',
		// 	common: {
		// 		name: 'testVariable',
		// 		type: 'boolean',
		// 		role: 'indicator',
		// 		read: true,
		// 		write: true,
		// 	},
		// 	native: {},
		// });

		// // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		// this.subscribeStates('testVariable');
		// // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// // this.subscribeStates('lights.*');
		// // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// // this.subscribeStates('*');

		// /*
		// 	setState examples
		// 	you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		// */
		// // the variable testVariable is set to true as command (ack=false)
		// await this.setStateAsync('testVariable', true);

		// // same thing, but the value is flagged "ack"
		// // ack should be always set to true if the value is received from or acknowledged from the target system
		// await this.setStateAsync('testVariable', { val: true, ack: true });

		// // same thing, but the state is deleted after 30s (getState will return null afterwards)
		// await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		// let result = await this.checkPasswordAsync('admin', 'iobroker');
		// this.log.info('check user admin pw iobroker: ' + result);

		// result = await this.checkGroupAsync('admin', 'admin');
		// this.log.info('check group user admin group admin: ' + result);


	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private async onUnload(callback: () => void): Promise<void> {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
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
	 * Using this method requires "common.messagebox" property to be set to true in io-package.json
	 */
	private async onMessage(obj: ioBroker.Message): Promise<void> {
		const logPrefix = '[onMessage]:';

		try {
			if (typeof obj === 'object') {
				if (obj.command.endsWith('StateList')) {
					//@ts-ignore
					const states = tree[obj.command.replace('StateList', '')].getStateIDs();
					let list = [];

					if (states) {
						for (let i = 0; i <= states.length - 1; i++) {

							if (states[i + 1] && states[i] === myHelper.getIdWithoutLastPart(states[i + 1])) {
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

					if (obj.callback) this.sendTo(obj.from, obj.command, list, obj.callback);
				}
			}

		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	//#endregion

	//#region updateData

	private async updateData(isAdapterStart: boolean = false) {
		const logPrefix = '[updateData]:';

		try {

			if (this.omvApi) {
				if (!this.omvApi.isConnected) {
					await this.omvApi.login();
				}

				await this.updateDataGeneric(ApiEndpoints.hwInfo, tree.hwInfo, 'hardware info', undefined, undefined, this.config.hwInfoEnabled, isAdapterStart, this.config.hwInfoStatesIsWhiteList, this.config.hwInfoStatesBlackList);
				await this.updateDataGeneric(ApiEndpoints.disk, tree.disk, 'disk info', 'devicename', 'devicename', this.config.diskEnabled, isAdapterStart, this.config.diskStatesIsWhiteList, this.config.diskStatesBlackList);
				await this.updateDataGeneric(ApiEndpoints.smart, tree.smart, 'smart info', 'uuid', 'devicename', this.config.smartEnabled, isAdapterStart, this.config.smartStatesIsWhiteList, this.config.smartStatesBlackList);
				await this.updateDataGeneric(ApiEndpoints.fileSystem, tree.fileSystem, 'file system info', 'uuid', 'comment', this.config.fileSystemEnabled, isAdapterStart, this.config.fileSystemStatesIsWhiteList, this.config.fileSystemStatesBlackList);

				//@ts-ignore
				this.log.warn(JSON.stringify(this.config['diskStatesBlackList']));
			}

		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	/**
	 * 
	 * @param endpoint 
	 * @param treeType 
	 * @param channelName 
	 * @param propertyDeviceId property to be used as id of device
	 * @param deviceName property to be used as name of device
	 * @param configEnabled 
	 * @param isAdapterStart 
	 */

	private async updateDataGeneric(endpoint: ApiEndpoints, treeType: any, channelName: string, propertyDeviceId: string | undefined, deviceName: string | undefined, configEnabled: boolean, isAdapterStart: boolean = false, statesIsWhiteList: boolean = false, blacklist: { id: string }[] = []) {
		const logPrefix = `[updateDataGeneric]: [${endpoint}]: `;

		try {
			if (this.connected && this.omvApi?.isConnected) {
				if (configEnabled) {
					if (isAdapterStart) {
						await this.createOrUpdateChannel(treeType.idChannel, channelName, undefined, true);
					}

					const data: any = await this.omvApi.retrievData(endpoint);

					if (data) {
						if (Array.isArray(data)) {
							for (let device of data) {
								if (propertyDeviceId && device[propertyDeviceId]) {
									const idDevice = `${treeType.idChannel}.${device[propertyDeviceId]}`;

									await this.createOrUpdateDevice(idDevice, deviceName && device[deviceName] ? device[deviceName] : 'unknown', undefined, undefined, undefined, isAdapterStart, true);
									await this.createOrUpdateGenericState(idDevice, treeType.get(), device, blacklist, statesIsWhiteList, device, device, isAdapterStart);

									this.log.debug(`${logPrefix} device '${device[propertyDeviceId]}' data successfully updated`);
								} else {
									this.log.error(`${logPrefix} deviceName property '${propertyDeviceId}' not exists in device`);
								}
							}
						} else {
							await this.createOrUpdateGenericState(treeType.idChannel, treeType.get(), data, blacklist, statesIsWhiteList, data, data, isAdapterStart);

							this.log.debug(`${logPrefix} channel '${channelName}' data successfully updated`);
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

	/**
	 * create or update a channel object, update will only be done on adapter start
	 * @param id 
	 * @param name 
	 * @param onlineId 
	 * @param icon 
	 * @param isAdapterStart
	 */
	private async createOrUpdateChannel(id: string, name: string, icon: string | undefined = undefined, isAdapterStart: boolean = false): Promise<void> {
		const logPrefix = '[createOrUpdateChannel]:';

		try {
			const i18n = name ? myI18n.getTranslatedObject(name) : name;

			let common = {
				name: name && Object.keys(i18n).length > 1 ? i18n : name,
				icon: icon
			};

			if (!await this.objectExists(id)) {
				this.log.debug(`${logPrefix} creating channel '${id}'`);
				await this.setObjectAsync(id, {
					type: 'channel',
					common: common,
					native: {}
				});
			} else {
				if (isAdapterStart) {
					const obj = await this.getObjectAsync(id);

					if (obj && obj.common) {
						if (!myHelper.isChannelCommonEqual(obj.common as ioBroker.ChannelCommon, common)) {
							await this.extendObject(id, { common: common });

							let diff = myHelper.deepDiffBetweenObjects(common, obj.common, this);
							if (diff && diff.icon) diff.icon = _.truncate(diff.icon);	// reduce base64 image string for logging

							this.log.debug(`${logPrefix} channel updated '${id}' (updated properties: ${JSON.stringify(diff)})`);
						}
					}
				}
			}
		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	/**
	* create or update a device object, update will only be done on adapter start
	* @param id 
	* @param name 
	* @param onlineId 
	* @param icon 
	* @param isAdapterStart
	*/
	private async createOrUpdateDevice(id: string, name: string | undefined, onlineId: string | undefined, errorId: string | undefined = undefined, icon: string | undefined = undefined, isAdapterStart: boolean = false, logChanges: boolean = true): Promise<void> {
		const logPrefix = '[createOrUpdateDevice]:';

		try {
			const i18n: any = name ? myI18n.getTranslatedObject(name) : name;

			let common: any = {
				name: name && Object.keys(i18n).length > 1 ? i18n : name,
				icon: icon
			};

			if (onlineId) {
				common['statusStates'] = {
					onlineId: onlineId
				}
			}

			if (errorId) {
				common['statusStates']['errorId'] = errorId;
			}

			if (!await this.objectExists(id)) {
				this.log.debug(`${logPrefix} creating device '${id}'`);
				await this.setObject(id, {
					type: 'device',
					common: common,
					native: {}
				});
			} else {
				if (isAdapterStart) {
					const obj = await this.getObjectAsync(id);

					if (obj && obj.common) {
						if (!myHelper.isDeviceCommonEqual(obj.common as ioBroker.ChannelCommon, common)) {
							await this.extendObject(id, { common: common });

							let diff = myHelper.deepDiffBetweenObjects(common, obj.common, this);
							if (diff && diff.icon) diff.icon = _.truncate(diff.icon);	// reduce base64 image string for logging

							this.log.debug(`${logPrefix} device updated '${id}' ${logChanges ? `(updated properties: ${JSON.stringify(diff)})` : ''}`);
						}
					}
				}
			}
		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	async createOrUpdateGenericState(channel: string, treeDefinition: any, objValues: any, blacklistFilter: { id: string }[], isWhiteList: boolean, objDevices: any, objChannel: any, isAdapterStart: boolean = false, filterId = '', isChannelOnWhitelist: boolean = false) {
		const logPrefix = '[createOrUpdateGenericState]:';

		try {
			if (this.connected && this.omvApi?.isConnected) {
				for (const key in treeDefinition) {
					let logMsgState = `${channel}.${key}`.split('.')?.slice(1)?.join('.');

					let logDetails = `${(objDevices as any)?.mac ? `mac: ${(objDevices as any)?.mac}` : (objDevices as any)?.ip ? `ip: ${(objDevices as any)?.ip}` : (objDevices as any)?._id ? `id: ${(objDevices as any)?._id}` : ''}`

					try {
						// if we have an own defined state which takes val from other property
						const valKey = Object.hasOwn(objValues, treeDefinition[key].valFromProperty) && treeDefinition[key].valFromProperty ? treeDefinition[key].valFromProperty : key

						const cond1 = (Object.hasOwn(objValues, valKey) && objValues[valKey] !== undefined) || (Object.hasOwn(treeDefinition[key], 'id') && !Object.hasOwn(treeDefinition[key], 'valFromProperty'));
						const cond2 = Object.hasOwn(treeDefinition[key], 'iobType') && !Object.hasOwn(treeDefinition[key], 'object') && !Object.hasOwn(treeDefinition[key], 'array');
						const cond3 = (Object.hasOwn(treeDefinition[key], 'conditionToCreateState') && treeDefinition[key].conditionToCreateState(objChannel, this) === true) || !Object.hasOwn(treeDefinition[key], 'conditionToCreateState');

						// if (channel === 'devices.f4:e2:c6:55:55:e2' && (key === 'satisfaction' || valKey === 'satisfaction')) {
						// 	this.log.warn(`cond 1: ${cond1}`);
						// 	this.log.warn(`cond 2: ${cond2}`);
						// 	this.log.warn(`cond 3: ${cond3}`)
						// 	this.log.warn(`val: ${objValues[valKey]}`);
						// }

						if (key && cond1 && cond2 && cond3) {
							// if we have a 'iobType' property, then it's a state
							let stateId = key;

							if (Object.hasOwn(treeDefinition[key], 'id')) {
								// if we have a custom state, use defined id
								stateId = treeDefinition[key].id;
							}

							logMsgState = `${channel}.${stateId}`.split('.')?.slice(1)?.join('.');

							if ((!isWhiteList && !_.some(blacklistFilter, { id: `${filterId}${stateId}` })) || (isWhiteList && _.some(blacklistFilter, { id: `${filterId}${stateId}` })) || isChannelOnWhitelist || Object.hasOwn(treeDefinition[key], 'required')) {
								if (!await this.objectExists(`${channel}.${stateId}`)) {
									// create State
									this.log.silly(`${logPrefix} ${objDevices?.name} - creating state '${logMsgState}'`);
									const obj = {
										type: 'state',
										common: await this.getCommonGenericState(key, (treeDefinition as { [key: string]: myCommonState }), objDevices, logMsgState),
										native: {}
									};

									// @ts-ignore
									await this.setObjectAsync(`${channel}.${stateId}`, obj);
								} else {
									// update State if needed (only on adapter start)
									if (isAdapterStart) {
										const obj = await this.getObjectAsync(`${channel}.${stateId}`);

										const commonUpdated = await this.getCommonGenericState(key, (treeDefinition as { [key: string]: myCommonState }), objDevices, logMsgState);

										if (obj && obj.common) {
											if (!myHelper.isStateCommonEqual(obj.common as ioBroker.StateCommon, commonUpdated)) {
												await this.extendObject(`${channel}.${stateId}`, { common: commonUpdated });
												this.log.debug(`${logPrefix} ${objDevices?.name} - updated common properties of state '${logMsgState}' (updated properties: ${JSON.stringify(myHelper.deepDiffBetweenObjects(commonUpdated, obj.common, this))})`);
											}
										}
									}
								}

								if (!this.subscribedList.includes(`${channel}.${stateId}`) && ((treeDefinition[key].write && treeDefinition[key].write === true) || Object.hasOwn(treeDefinition[key], 'subscribeMe'))) {
									// state is writeable or has subscribeMe Property -> subscribe it
									this.log.silly(`${logPrefix} ${objDevices?.name} - subscribing state '${logMsgState}'`);
									await this.subscribeStatesAsync(`${channel}.${stateId}`);

									this.subscribedList.push(`${channel}.${stateId}`);
								}

								if (objValues && (Object.hasOwn(objValues, key) || (Object.hasOwn(objValues, treeDefinition[key].valFromProperty)))) {
									const val = treeDefinition[key].readVal ? await treeDefinition[key].readVal(objValues[valKey], this, objDevices, `${channel}.${stateId}`) : objValues[valKey];

									let changedObj: any = undefined

									if (key === 'last_seen' || key === 'first_seen' || key === 'rundate') {
										// set lc to last_seen value
										changedObj = await this.setStateChangedAsync(`${channel}.${stateId}`, { val: val, lc: val * 1000 }, true);
									} else {
										changedObj = await this.setStateChangedAsync(`${channel}.${stateId}`, val, true);
									}

									if (!isAdapterStart && changedObj && Object.hasOwn(changedObj, 'notChanged') && !changedObj.notChanged) {
										this.log.silly(`${logPrefix} value of state '${logMsgState}' changed to ${val}`);
									}
								} else {
									if (!Object.hasOwn(treeDefinition[key], 'id')) {
										// only report it if it's not a custom defined state
										this.log.debug(`${logPrefix} ${objDevices?.name} - property '${logMsgState}' not exists in bootstrap values (sometimes this option may first need to be activated / used in the Unifi Network application or will update by an event)`);
									}
								}
							} else {
								// channel is on blacklist
								// delete also at runtime, because some properties are only available on websocket data
								if (await this.objectExists(`${channel}.${stateId}`)) {
									await this.delObjectAsync(`${channel}.${stateId}`);

									this.log.info(`${logPrefix} '${objDevices?.name}' ${logDetails ? `(${logDetails}) ` : ''}state '${channel}.${stateId}' delete, ${isWhiteList ? 'it\'s not on the whitelist' : 'it\'s on the blacklist'}`);
								}
							}
						} else {
							// it's a channel from type object
							if (Object.hasOwn(treeDefinition[key], 'object') && Object.hasOwn(objValues, key)) {
								const idChannelAppendix = Object.hasOwn(treeDefinition[key], 'idChannel') ? treeDefinition[key].idChannel : key
								const idChannel = `${channel}.${idChannelAppendix}`;

								if ((!isWhiteList && !_.some(blacklistFilter, { id: `${filterId}${idChannelAppendix}` })) || (isWhiteList && _.some(blacklistFilter, (x) => x.id.startsWith(`${filterId}${idChannelAppendix}`))) || Object.hasOwn(treeDefinition[key], 'required')) {
									await this.createOrUpdateChannel(`${idChannel}`, Object.hasOwn(treeDefinition[key], 'channelName') ? treeDefinition[key].channelName(objDevices, objChannel, this) : key, Object.hasOwn(treeDefinition[key], 'icon') ? treeDefinition[key].icon : undefined, true);
									await this.createOrUpdateGenericState(`${idChannel}`, treeDefinition[key].object, objValues[key], blacklistFilter, isWhiteList, objDevices, objChannel[key], isAdapterStart, `${filterId}${idChannelAppendix}.`, isWhiteList && _.some(blacklistFilter, { id: `${filterId}${idChannelAppendix}` }));
								} else {
									// channel is on blacklist
									if (await this.objectExists(idChannel)) {
										await this.delObjectAsync(idChannel, { recursive: true });
										this.log.info(`${logPrefix} '${objDevices?.name}' ${logDetails ? `(${logDetails}) ` : ''}channel '${idChannel}' delete, ${isWhiteList ? 'it\'s not on the whitelist' : 'it\'s on the blacklist'}`);
									}
								}
							}

							// it's a channel from type array
							if (Object.hasOwn(treeDefinition[key], 'array') && Object.hasOwn(objValues, key)) {

								if (objValues[key] !== null && objValues[key].length > 0) {
									const idChannelAppendix = Object.hasOwn(treeDefinition[key], 'idChannel') ? treeDefinition[key].idChannel : key
									const idChannel = `${channel}.${idChannelAppendix}`;

									if ((!isWhiteList && !_.some(blacklistFilter, { id: `${filterId}${idChannelAppendix}` })) || (isWhiteList && _.some(blacklistFilter, (x) => x.id.startsWith(`${filterId}${idChannelAppendix}`))) || Object.hasOwn(treeDefinition[key], 'required')) {
										await this.createOrUpdateChannel(`${idChannel}`, Object.hasOwn(treeDefinition[key], 'channelName') ? treeDefinition[key].channelName(objDevices, objChannel, this) : key, Object.hasOwn(treeDefinition[key], 'icon') ? treeDefinition[key].icon : undefined, isAdapterStart);

										const arrayNumberAdd = Object.hasOwn(treeDefinition[key], 'arrayStartNumber') ? treeDefinition[key].arrayStartNumber : 0

										for (let i = 0; i <= objValues[key].length - 1; i++) {
											let nr = i + arrayNumberAdd;

											if (objValues[key][i] !== null && objValues[key][i] !== undefined) {
												let idChannelArray: string | undefined = myHelper.zeroPad(nr, treeDefinition[key].arrayChannelIdZeroPad || 0);

												if (Object.hasOwn(treeDefinition[key], 'arrayChannelIdFromProperty')) {
													idChannelArray = treeDefinition[key].arrayChannelIdFromProperty(objChannel[key][i], i, this);
												} else if (Object.hasOwn(treeDefinition[key], 'arrayChannelIdPrefix')) {
													idChannelArray = treeDefinition[key].arrayChannelIdPrefix + myHelper.zeroPad(nr, treeDefinition[key].arrayChannelIdZeroPad || 0);
												}

												if (idChannelArray !== undefined) {
													await this.createOrUpdateChannel(`${idChannel}.${idChannelArray}`, Object.hasOwn(treeDefinition[key], 'arrayChannelNameFromProperty') ? treeDefinition[key].arrayChannelNameFromProperty(objChannel[key][i], this) : treeDefinition[key].arrayChannelNamePrefix + nr || nr.toString(), undefined, true)
													await this.createOrUpdateGenericState(`${idChannel}.${idChannelArray}`, treeDefinition[key].array, objValues[key][i], blacklistFilter, isWhiteList, objDevices, objChannel[key][i], true, `${filterId}${idChannelAppendix}.`, isWhiteList && _.some(blacklistFilter, { id: `${filterId}${idChannelAppendix}` }));
												}
											}
										}
									} else {
										// channel is on blacklist, wlan is comming from realtime api
										if (await this.objectExists(idChannel)) {
											await this.delObjectAsync(idChannel, { recursive: true });
											this.log.info(`${logPrefix} '${objDevices?.name}' ${logDetails ? `(${logDetails}) ` : ''}channel '${idChannel}' delete, ${isWhiteList ? 'it\'s not on the whitelist' : 'it\'s on the blacklist'}`);
										}
									}
								}
							}
						}
					} catch (error: any) {
						this.log.error(`${logPrefix} [id: ${key}, ${logDetails ? `${logDetails}, ` : ''}key: ${key}] error: ${error}, stack: ${error.stack}, data: ${JSON.stringify(objValues[key])}`);
					}
				}
			}
		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}
	}

	async getCommonGenericState(id: string, treeDefinition: { [key: string]: myCommonState }, objDevices: any, logMsgState: string) {
		const logPrefix = '[getCommonGenericState]:';

		try {
			// i18x translation if exists
			const i18n = myI18n.getTranslatedObject(treeDefinition[id].name || id);
			const name = Object.keys(i18n).length > 1 ? i18n : (treeDefinition[id].name || id);

			const common: any = {
				name: name,
				type: treeDefinition[id].iobType,
				read: (treeDefinition[id].read !== undefined) ? treeDefinition[id].read : true,
				write: (treeDefinition[id].write !== undefined) ? treeDefinition[id].write : false,
				role: treeDefinition[id].role ? treeDefinition[id].role : 'state',
			};

			if (treeDefinition[id].unit) common.unit = treeDefinition[id].unit;

			if (treeDefinition[id].min || treeDefinition[id].min === 0) common.min = treeDefinition[id].min;

			if (treeDefinition[id].max || treeDefinition[id].max === 0) common.max = treeDefinition[id].max;

			if (treeDefinition[id].step) common.step = treeDefinition[id].step;

			if (treeDefinition[id].expert) common.expert = treeDefinition[id].expert;

			if (treeDefinition[id].def || treeDefinition[id].def === 0 || treeDefinition[id].def === false) common.def = treeDefinition[id].def;

			if (treeDefinition[id].states) {
				common.states = treeDefinition[id].states;
			} else if (Object.hasOwn(treeDefinition[id], 'statesFromProperty')) {
				const statesFromProp = myHelper.getAllowedCommonStates(treeDefinition[id].statesFromProperty, objDevices);

				common.states = statesFromProp;
				this.log.debug(`${logPrefix} ${objDevices?.name} - set allowed common.states for '${logMsgState}' (from: ${treeDefinition[id].statesFromProperty})`);
			}

			if (treeDefinition[id].desc) common.desc = treeDefinition[id].desc;

			return common;
		} catch (error: any) {
			this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
		}

		return undefined;
	}

	//#endregion
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Openmediavault(options);
} else {
	// otherwise start the instance directly
	(() => new Openmediavault())();
}