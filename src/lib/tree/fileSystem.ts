import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import * as myHelper from '../helper.js';
import type { FileSystem } from '../types-fileSystem.js';
import type { myTreeDefinition } from '../myIob.js';

export namespace fileSystem {
	let keys: string[] | undefined = undefined;

	export const idChannel = 'fileSystem'

	export const iobObjectDefintions: IoBrokerObjectDefinitions = {
		channelName: 'file system info',
		deviceIdProperty: 'uuid',
		deviceNameProperty: 'label',
	}

	export function get(): { [key: string]: myTreeDefinition } {
		return {
			available: {
				iobType: 'number',
				name: 'available',
				unit: 'TB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: FileSystem, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			comment: {
				iobType: 'string',
				name: 'comment',
			},
			devicefile: {
				iobType: 'string',
				name: 'device file',
			},
			description: {
				iobType: 'string',
				name: 'description',
			},
			devicename: {
				iobType: 'string',
				name: 'device name',
			},
			label: {
				iobType: 'string',
				name: 'device name',
			},
			mounted: {
				iobType: 'boolean',
				name: 'monted'
			},
			mountpoint: {
				iobType: 'string',
				name: 'mountpoint',
			},
			percentage: {
				iobType: 'number',
				name: 'percentage',
				unit: '%',
				readVal(val: any, adapter: ioBroker.myAdapter, device: FileSystem, id: string): ioBroker.StateValue {
					return Math.round(val);
				}
			},
			size: {
				iobType: 'number',
				name: 'size',
				unit: 'TB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: FileSystem, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			type: {
				iobType: 'string',
				name: 'type',
			},
			used: {
				iobType: 'number',
				name: 'used',
				unit: 'TB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: FileSystem, id: string): ioBroker.StateValue {
					return Math.round((device.size - device.available) / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			uuid: {
				iobType: 'string',
				name: 'uuid',
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