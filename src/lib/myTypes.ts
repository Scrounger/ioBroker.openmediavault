import type { ApiEndpoints } from './omv-rpc.js';
import type { Disk } from './types-disk.js';
import type { HwInfo } from './types-hwInfo.js';
import type { FileSystem } from './types-fileSystem.js';
import type { ShareMgmt } from './types-shareMgmt.js';
import type { Smart } from './types-smart.js';
import type { Smb } from './types-smb.js';

export type myTreeData = Disk | FileSystem | HwInfo | ShareMgmt | Smart | Smb;

type ReadValFunction = (val: any, adapter: ioBroker.Adapter | ioBroker.myAdapter, device: myTreeData) => ioBroker.StateValue | Promise<ioBroker.StateValue>
export type WriteValFunction = (val: ioBroker.StateValue, id?: string, device?: myTreeData, adapter?: ioBroker.Adapter | ioBroker.myAdapter) => any | Promise<any>;
type ConditionToCreateStateFunction = (objDevice: myTreeData, objChannel: myTreeData, adapter: ioBroker.Adapter | ioBroker.myAdapter) => boolean;

export type myTreeDefinition = myTreeState | myTreeObject | myTreeArray;

export interface myTreeState {
	id?: string;
	iobType: ioBroker.CommonType;
	name?: string;
	role?: string;
	read?: boolean;
	write?: boolean;
	unit?: string;
	min?: number;
	max?: number;
	step?: number;
	states?: Record<string, string> | string[] | string;
	expert?: true;
	icon?: string;
	def?: ioBroker.StateValue;
	desc?: string;

	readVal?: ReadValFunction;
	writeVal?: WriteValFunction;

	valFromProperty?: string; // Take value from other property in the corresponding tree. If this property is an object, @link ./helper.ts [getAllKeysOfTreeDefinition] must added manual if they should be regoniczed
	statesFromProperty?(objDevice: myTreeData, objChannel: myTreeData, adapter: ioBroker.Adapter | ioBroker.myAdapter): Record<string, string> | string[] | string; // ToDo: perhaps can be removed

	conditionToCreateState?: ConditionToCreateStateFunction // condition to create state

	subscribeMe?: true; // subscribe
	required?: true; // required, can not be blacklisted
}

export interface myTreeObject {
	idChannel?: string;
	name?: string;
	icon?: string;
	object: { [key: string]: myTreeDefinition };
	conditionToCreateState?: ConditionToCreateStateFunction // condition to create state
}

export interface myTreeArray {
	idChannel?: string;
	name?: string;
	icon?: string;
	arrayChannelIdPrefix?: string; // Array item id get a prefix e.g. myPrefix_0
	arrayChannelIdZeroPad?: number; // Array item id get a padding for the number
	arrayChannelIdFromProperty?(objDevice: myTreeData, objChannel: myTreeData, i: number, adapter: ioBroker.Adapter | ioBroker.myAdapter): string; // Array item id is taken from a property in the corresponding tree
	arrayChannelNamePrefix?: string; // Array item common.name get a prefix e.g. myPrefix_0
	arrayChannelNameFromProperty?(objDevice: myTreeData, objChannel: myTreeData, adapter: ioBroker.Adapter | ioBroker.myAdapter): string; // Array item common.name is taken from a property in the corresponding tree
	arrayStartNumber?: number; // Array custom start number of array
	array: { [key: string]: myTreeDefinition };
}

export interface EndpointData {
	service: string;
	method: string;
	params?: { [key: string]: any } | null;
}

export interface IoBrokerObjectDefinitions {
	channelName: string,                        // Channel name attribute
	deviceIdProperty: string | undefined,       // channel id attribute, if source is an array and is avaiable in api data (see definitions in tree)
	deviceNameProperty: string | undefined,     // channel name attribute and is avaiable in api data (see definitions in tree)
	additionalRequest?: {
		endpoint: ApiEndpoints,
		conditionProperty: string,
		paramsProperty: string
	}
}