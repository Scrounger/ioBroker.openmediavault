import type { ApiEndpoints } from './omv-rpc.js';
import type { HwInfo } from './types-hwInfo.js';

export interface EndpointData {
	service: string;
	method: string;
	params?: { [key: string]: any } | null;
}

export interface myCommonState {
	id?: string,
	iobType: ioBroker.CommonType,
	name?: string,
	role?: string,
	read?: boolean,
	write?: boolean,
	unit?: string,
	min?: number,
	max?: number,
	step?: number,
	states?: { [key: string]: string } | { [key: number]: string },
	expert?: true,
	icon?: string,
	def?: ioBroker.StateValue,
	desc?: string,

	readVal?(val: ioBroker.StateValue, adapter: ioBroker.Adapter, deviceOrClient: any, id: string): ioBroker.StateValue | Promise<ioBroker.StateValue>,
	writeVal?(val: ioBroker.StateValue, adapter: ioBroker.Adapter): ioBroker.StateValue | Promise<ioBroker.StateValue>,

	valFromProperty?: string                                        // Take value from other property in the corresponding tree. If this property is an object, @link ./helper.ts [getAllKeysOfTreeDefinition] must added manual if they should be regoniczed
	statesFromProperty?: string                                     // ToDo: perhaps can be removed

	conditionToCreateState?(objDevice: any, adapter: ioBroker.Adapter): boolean     // condition to create state

	subscribeMe?: true                                              // subscribe
	required?: true                                                 // required, can not be blacklisted
}

export interface myCommoneChannelObject {
	idChannel?: string;
	channelName?(objDevice: any, objChannel: any, adapter: ioBroker.Adapter): string;
	icon?: string;
	object: { [key: string]: myCommonState | myCommoneChannelObject; };
}

export interface myCommonChannelArray {
	idChannel?: string;
	channelName?(objDevice: any, objChannel: any, adapter: ioBroker.Adapter): string;
	icon?: string,
	arrayChannelIdPrefix?: string,                                                                  // Array item id get a prefix e.g. myPrefix_0
	arrayChannelIdZeroPad?: number,                                                                 // Array item id get a padding for the number
	arrayChannelIdFromProperty?(objDevice: any, i: number, adapter: ioBroker.Adapter): string,      // Array item id is taken from a property in the corresponding tree
	arrayChannelNamePrefix?: string,                                                                // Array item common.name get a prefix e.g. myPrefix_0
	arrayChannelNameFromProperty?(objDevice: any, adapter: ioBroker.Adapter): string,               // Array item common.name is taken from a property in the corresponding tree
	arrayStartNumber?: number,                                                                      // Array custom start number of array
	array: { [key: string]: myCommonState; },
}

export interface myCache {
	hwInfo: { [key: string]: HwInfo; },
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