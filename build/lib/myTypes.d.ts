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
    params?: {
        [key: string]: any;
    } | null;
}
export interface IoBrokerObjectDefinitions {
    channelName: string;
    deviceIdProperty: string | undefined;
    deviceNameProperty: string | undefined;
    additionalRequest?: {
        endpoint: ApiEndpoints;
        conditionProperty: string;
        paramsProperty: string;
    };
}
