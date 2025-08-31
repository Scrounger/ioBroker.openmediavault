import type { ApiEndpoints } from './omv-rpc.js';
import type { HwInfo } from './types-hwInfo.js';
export interface EndpointData {
    service: string;
    method: string;
    params?: {
        [key: string]: any;
    } | null;
}
export interface myCommonState {
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
    states?: {
        [key: string]: string;
    } | {
        [key: number]: string;
    };
    expert?: true;
    icon?: string;
    def?: ioBroker.StateValue;
    desc?: string;
    readVal?(val: ioBroker.StateValue, adapter: ioBroker.Adapter, deviceOrClient: any, id: string): ioBroker.StateValue | Promise<ioBroker.StateValue>;
    writeVal?(val: ioBroker.StateValue, adapter: ioBroker.Adapter): ioBroker.StateValue | Promise<ioBroker.StateValue>;
    valFromProperty?: string;
    statesFromProperty?: string;
    conditionToCreateState?(objDevice: any, adapter: ioBroker.Adapter): boolean;
    subscribeMe?: true;
    required?: true;
}
export interface myCommoneChannelObject {
    idChannel?: string;
    channelName?(objDevice: any, objChannel: any, adapter: ioBroker.Adapter): string;
    icon?: string;
    object: {
        [key: string]: myCommonState | myCommoneChannelObject;
    };
}
export interface myCommonChannelArray {
    idChannel?: string;
    channelName?(objDevice: any, objChannel: any, adapter: ioBroker.Adapter): string;
    icon?: string;
    arrayChannelIdPrefix?: string;
    arrayChannelIdZeroPad?: number;
    arrayChannelIdFromProperty?(objDevice: any, i: number, adapter: ioBroker.Adapter): string;
    arrayChannelNamePrefix?: string;
    arrayChannelNameFromProperty?(objDevice: any, adapter: ioBroker.Adapter): string;
    arrayStartNumber?: number;
    array: {
        [key: string]: myCommonState;
    };
}
export interface myCache {
    hwInfo: {
        [key: string]: HwInfo;
    };
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
