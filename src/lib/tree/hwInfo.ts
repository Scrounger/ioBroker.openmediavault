import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import * as myHelper from '../helper.js';
import type { HwInfo } from '../types-hwInfo.js';
import type { myTreeDefinition } from '../myIob.js';

export namespace hwInfo {
	let keys: string[] | undefined = undefined;

	export const idChannel = 'hwInfo'

	export const iobObjectDefintions: IoBrokerObjectDefinitions = {
		channelName: 'hardware info',
		deviceIdProperty: undefined,
		deviceNameProperty: undefined,
	}

	export function get(): { [key: string]: myTreeDefinition } {
		return {
			availablePkgUpdates: {
				iobType: 'number',
				name: 'available package updates',
			},
			cpuModelName: {
				iobType: 'string',
				name: 'cpu model',
			},
			cpuUtilization: {
				iobType: 'number',
				name: 'cpu utilization',
				unit: '%',
				readVal(val: any, adapter: ioBroker.myAdapter, device: HwInfo, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val);
				}
			},
			cpuCores: {
				iobType: 'number',
				name: 'cpu cores',
			},
			cpuMhz: {
				iobType: 'number',
				name: 'cpu freqency',
			},
			hostname: {
				iobType: 'string',
				name: 'hostname',
			},
			kernel: {
				iobType: 'string',
				name: 'hostname',
			},
			loadAverage: {
				idChannel: 'loadAverage',
				name: 'load average',
				object: {
					'1min': {
						iobType: 'number',
						name: '1 minute',
					},
					'5min': {
						iobType: 'number',
						name: '5 minute',
					},
					'15min': {
						iobType: 'number',
						name: '15 minute',
					},
				}
			},
			memTotal: {
				iobType: 'number',
				name: 'memory total',
				unit: 'GB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: HwInfo, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			memFree: {
				iobType: 'number',
				name: 'memory free',
				unit: 'GB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: HwInfo, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			memUsed: {
				iobType: 'number',
				name: 'memory used',
				unit: 'GB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: HwInfo, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			memAvailable: {
				iobType: 'number',
				name: 'memory available',
				unit: 'GB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: HwInfo, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			memUtilization: {
				iobType: 'number',
				name: 'memory utilization',
				unit: '%',
				readVal(val: any, adapter: ioBroker.myAdapter, device: HwInfo, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val * 100);
				}
			},
			rebootRequired: {
				iobType: 'boolean',
				name: 'restart required'
			},
			uptime: {
				iobType: 'number',
				name: 'uptime',
				unit: 's',
				readVal(val: any, adapter: ioBroker.myAdapter, device: HwInfo, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val);
				}
			},
			upgradeable: {
				id: 'upgradeable',
				iobType: 'boolean',
				name: 'upgradeable',
				valFromProperty: 'availablePkgUpdates',
				readVal(val: any, adapter: ioBroker.myAdapter, device: HwInfo, channel: any, id: string): ioBroker.StateValue {
					return val > 0;
				}
			},
			version: {
				iobType: 'string',
				name: 'version',
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