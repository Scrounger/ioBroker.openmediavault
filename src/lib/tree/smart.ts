import type { IoBrokerObjectDefinitions, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import type { Smart } from '../types-smart.js';
import { ApiEndpoints } from '../omv-rpc.js';

export namespace smart {
	let keys: string[] | undefined = undefined;

	export const idChannel = 'smart'

	export const iobObjectDefintions: IoBrokerObjectDefinitions = {
		channelName: 'S.M.A.R.T info',
		deviceIdProperty: 'uuid',
		deviceNameProperty: 'devicename',
		additionalRequest: {
			endpoint: ApiEndpoints.smartInfo,
			conditionProperty: 'monitor',
			paramsProperty: 'devicefile'
		}
	}

	export function get(): { [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray } {
		return {
			canonicaldevicefile: {
				iobType: 'string',
				name: 'canonical device file',
			},
			description: {
				iobType: 'string',
				name: 'description',
			},
			devicefile: {
				iobType: 'string',
				name: 'device file',
			},
			devicelinks: {
				iobType: 'string',
				name: 'hostname',
				readVal(val: string, _adapter: ioBroker.Adapter, _deviceOrClient: Smart, _id: string): ioBroker.StateValue {
					return JSON.stringify(val);
				}
			},
			devicemodel: {
				iobType: 'string',
				name: 'devicemodel',
				conditionToCreateState(objDevice: Smart, _adapter: ioBroker.Adapter): boolean {
					return objDevice.devicemodel !== undefined && objDevice.devicemodel !== '';
				},
			},
			devicename: {
				id: 'devicename',
				iobType: 'string',
				name: 'device name',
			},
			firmwareversion: {
				iobType: 'string',
				name: 'firmwareversion',
				conditionToCreateState(objDevice: Smart, _adapter: ioBroker.Adapter): boolean {
					return objDevice.firmwareversion !== undefined && objDevice.firmwareversion !== '';
				},
			},
			model: {
				iobType: 'string',
				name: 'model',
			},
			monitor: {
				iobType: 'boolean',
				name: 'is monitored'
			},
			modelfamily: {
				iobType: 'string',
				name: 'modelfamily',
				conditionToCreateState(objDevice: Smart, _adapter: ioBroker.Adapter): boolean {
					return objDevice.modelfamily !== undefined && objDevice.modelfamily !== '';
				},
			},
			overallstatus: {
				iobType: 'string',
				name: 'overall status',
			},
			powercycles: {
				iobType: 'number',
				name: 'powercycles',
				readVal(val: string, _adapter: ioBroker.Adapter, _deviceOrClient: Smart, _id: string): ioBroker.StateValue {
					return parseInt(val);
				},
			},
			poweronhours: {
				iobType: 'number',
				name: 'poweronhours',
				unit: 'h',
				readVal(val: string, _adapter: ioBroker.Adapter, _deviceOrClient: Smart, _id: string): ioBroker.StateValue {
					return parseInt(val);
				},
			},
			rotationrate: {
				iobType: 'number',
				name: 'rotationrate',
				unit: 'rpm',
				readVal(val: string, _adapter: ioBroker.Adapter, _deviceOrClient: Smart, _id: string): ioBroker.StateValue {
					return parseInt(val.replace(' rpm', ''));
				}
			},
			serialnumber: {
				iobType: 'string',
				name: 'serialnumber',
			},
			size: {
				iobType: 'number',
				name: 'size',
				unit: 'TB',
				readVal(val: number, _adapter: ioBroker.Adapter, _deviceOrClient: Smart, _id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			temperature: {
				iobType: 'number',
				name: 'temperature',
				unit: '°C',
				conditionToCreateState(objDevice: Smart, _adapter: ioBroker.Adapter): boolean {
					return objDevice.temperature > 0;
				},
				readVal: function (val: number, _adapter: ioBroker.Adapter, _deviceOrClient: Smart, _id: string): ioBroker.StateValue {
					return Math.round(val * 10) / 10;
				},
			},
			uuid: {
				iobType: 'string',
				name: 'uuid',
			},
			vendor: {
				iobType: 'string',
				name: 'vendor',
			},
		}
	}

	export function getKeys(): string[] {
		if (keys === undefined) {
			keys = myHelper.getAllKeysOfTreeDefinition(get());
		}

		return keys
	}

	export function getStateIDs(): string[] {
		return myHelper.getAllIdsOfTreeDefinition(get());
	}
}