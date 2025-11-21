import type { ApiEndpoints } from './omv-rpc.js';
import type { Disk } from './types-disk.js';
import type { HwInfo } from './types-hwInfo.js';
import type { FileSystem } from './types-fileSystem.js';
import type { ShareMgmt } from './types-shareMgmt.js';
import type { Smart } from './types-smart.js';
import type { Smb } from './types-smb.js';

export type myTreeData = Disk | FileSystem | HwInfo | ShareMgmt | Smart | Smb;

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
		paramsProperty: string,
		converter?: (data: any, adapter: ioBroker.myAdapter) => myTreeData,
	}[];
}