import type { IoBrokerObjectDefinitions, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import type { ShareMgmt } from '../types-shareMgmt.js';

export namespace shareMgmt {
	let keys: string[] | undefined = undefined;

	export const idChannel = 'shareMgmt'

	export const iobObjectDefintions: IoBrokerObjectDefinitions = {
		channelName: 'shared folders',
		deviceIdProperty: 'uuid',
		deviceNameProperty: 'name',
	}

	export function get(): { [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray } {
		return {
			name: {
				iobType: 'string',
				name: 'folder name',
			},
			comment: {
				iobType: 'string',
				name: 'comment',
			},
			description: {
				iobType: 'string',
				name: 'description',
			},
			device: {
				iobType: 'string',
				name: 'device of folder',
			},
			mntent: {
				channelName(_objDevice: ShareMgmt, _objChannel: any, _adapter: ioBroker.Adapter): string {
					return 'mntent'
				},
				object: {
					devicefile: {
						iobType: 'string',
						name: 'device file',
					},
					fsname: {
						iobType: 'string',
						name: 'fsname',
					},
					dir: {
						iobType: 'string',
						name: 'dir',
					},
					type: {
						iobType: 'string',
						name: 'type',
					},
				}
			},
			mntentref: {
				iobType: 'string',
				name: 'mntentref',
			},
			reldirpath: {
				iobType: 'string',
				name: 'reldirpath',
			},
			snapshots: {
				iobType: 'boolean',
				name: 'snapshots'
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