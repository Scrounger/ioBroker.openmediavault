import { IoBrokerObjectDefinitions, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import { Disk } from '../types-disk.js';

export namespace disk {
	let keys: string[] | undefined = undefined;

	export const idChannel = 'disk'

	export const iobObjectDefintions: IoBrokerObjectDefinitions = {
		channelName: 'disk info',
		deviceIdProperty: 'devicename',
		deviceNameProperty: 'devicename'
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
				readVal(val: string, _adapter: ioBroker.Adapter, _deviceOrClient: Disk, _id: string): ioBroker.StateValue {
					return JSON.stringify(val);
				}
			},
			devicename: {
				iobType: 'string',
				name: 'device name',
			},
			hotpluggable: {
				iobType: 'boolean',
				name: 'hot pluggable'
			},
			israid: {
				iobType: 'boolean',
				name: 'is raid'
			},
			isreadonly: {
				iobType: 'boolean',
				name: 'is read only'
			},
			isroot: {
				iobType: 'boolean',
				name: 'is root'
			},
			model: {
				iobType: 'string',
				name: 'model',
			},
			powermode: {
				iobType: 'string',
				name: 'powermode',
			},
			serialnumber: {
				iobType: 'string',
				name: 'serialnumber',
			},
			size: {
				iobType: 'number',
				name: 'size',
				unit: 'TB',
				readVal(val: number, _adapter: ioBroker.Adapter, _deviceOrClient: Disk, _id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			temperature: {
				iobType: 'number',
				name: 'temperature',
				unit: '°C',
				conditionToCreateState(objDevice: Disk, _adapter: ioBroker.Adapter): boolean {
					return objDevice.temperature > 0;
				},
				readVal: function (val: number, _adapter: ioBroker.Adapter, _deviceOrClient: Disk, _id: string): ioBroker.StateValue {
					return Math.round(val * 10) / 10;
				},
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