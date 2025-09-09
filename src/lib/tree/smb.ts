import type { IoBrokerObjectDefinitions, myTreeDefinition } from '../myTypes.js';
import * as myHelper from '../helper.js';
import type { Smb } from '../types-smb.js';

export namespace smb {
	let keys: string[] | undefined = undefined;

	export const idChannel = 'smb'

	export const iobObjectDefintions: IoBrokerObjectDefinitions = {
		channelName: 'smb folders',
		deviceIdProperty: 'uuid',
		deviceNameProperty: 'sharedfoldername',
	}

	export function get(): { [key: string]: myTreeDefinition } {
		return {
			browseable: {
				iobType: 'boolean',
				name: 'browseable'
			},
			comment: {
				iobType: 'string',
				name: 'comment',
			},
			enable: {
				iobType: 'boolean',
				name: 'enable'
			},
			guest: {
				iobType: 'boolean',
				name: 'enable',
				readVal(val: any, adapter: ioBroker.Adapter, device: Smb): ioBroker.StateValue {
					return val !== 'no'
				}
			},
			hidedotfiles: {
				iobType: 'boolean',
				name: 'readonly'
			},
			readonly: {
				iobType: 'boolean',
				name: 'readonly'
			},
			recyclebin: {
				iobType: 'boolean',
				name: 'recyclebin'
			},
			sharedfoldername: {
				iobType: 'string',
				name: 'sharedfoldername',
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