import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import * as myHelper from '../helper.js';
import type { Smart } from '../types-smart.js';
import { ApiEndpoints } from '../omv-rpc.js';
import type { myTreeDefinition } from '../myIob.js';

export namespace smart {
	let keys: string[] | undefined = undefined;

	export const idChannel = 'smart'

	export const iobObjectDefintions: IoBrokerObjectDefinitions = {
		channelName: 'S.M.A.R.T info',
		deviceIdProperty: (objDevice: Smart, adapter: ioBroker.Adapter | ioBroker.myAdapter): string => {
			if (objDevice.devicelinks) {
				const find = objDevice.devicelinks.find(x => x.includes('/dev/disk/by-uuid/'));

				if (find) {
					return find.replace('/dev/disk/by-uuid/', '');
				}
			}

			return objDevice.devicename;
		},
		deviceNameProperty: 'devicename',
		deviceHasErrorsState: 'hasErrors',
		additionalRequest: [
			{
				endpoint: ApiEndpoints.smartInfo,
				conditionProperty: 'monitor',
				paramsProperty: 'devicefile'
			},
			{
				endpoint: ApiEndpoints.smartAttributes,
				conditionProperty: 'monitor',
				paramsProperty: 'devicefile',
				converter: (data: any, adapter: ioBroker.myAdapter): Smart => {
					const logPrefix = `[smart.getAttributes.converter]:`;

					try {
						if (data) {
							const result: { [key: string]: string | number } = {};
							data.forEach((item: { attrname: string; rawvalue: string | number; }) => {
								const cleanAttrname = item.attrname.replace(/[-]/g, '_').toLowerCase();
								result[cleanAttrname] = item.rawvalue;
							});

							return result as Smart;
						}
					} catch (error: any) {
						adapter.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
					}
					return {} as Smart;
				}
			},
		]
	}

	export function get(): { [key: string]: myTreeDefinition } {
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
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return JSON.stringify(val);
				}
			},
			devicemodel: {
				iobType: 'string',
				name: 'devicemodel',
				conditionToCreateState(objDevice: Smart, objChannel: Smart, adapter: ioBroker.myAdapter): boolean {
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
				conditionToCreateState(objDevice: Smart, objChannel: Smart, adapter: ioBroker.myAdapter): boolean {
					return objDevice.firmwareversion !== undefined && objDevice.firmwareversion !== '';
				},
			},
			hasErrors: {
				id: 'hasErrors',
				iobType: 'boolean',
				name: 'has errors',
				valFromProperty: 'overallstatus',
				required: true,
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return val !== 'GOOD';
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
				conditionToCreateState(objDevice: Smart, objChannel: Smart, adapter: ioBroker.myAdapter): boolean {
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
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return parseInt(val);
				},
			},
			poweronhours: {
				iobType: 'number',
				name: 'poweronhours',
				unit: 'h',
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return parseInt(val);
				},
			},
			rotationrate: {
				iobType: 'number',
				name: 'rotationrate',
				unit: 'rpm',
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
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
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			spin_retry_count: {
				iobType: 'number',
				name: 'spin retry count',
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return parseInt(val);
				},
			},
			spin_up_time: {
				iobType: 'number',
				name: 'spin uptime',
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return parseInt(val);
				},
			},
			start_stop_count: {
				iobType: 'number',
				name: 'start stopcount',
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return parseInt(val);
				},
			},
			temperature: {
				iobType: 'number',
				name: 'temperature',
				unit: '°C',
				conditionToCreateState(objDevice: Smart, objChannel: Smart, adapter: ioBroker.myAdapter): boolean {
					return objDevice.temperature > 0;
				},
				readVal: function (val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val * 10) / 10;
				},
			},
			total_lbas_written: {
				iobType: 'number',
				name: 'total lbas written',
				unit: 'TB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
				}
			},
			total_lbas_read: {
				iobType: 'number',
				name: 'total lbas read',
				unit: 'TB',
				readVal(val: any, adapter: ioBroker.myAdapter, device: Smart, channel: any, id: string): ioBroker.StateValue {
					return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
				}
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