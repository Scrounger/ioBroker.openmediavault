import _ from 'lodash';
import { IoBrokerObjectDefinitions, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import { Smart } from "../types-smart.js";

export namespace smart {
    let keys: string[] | undefined = undefined;

    export const idChannel = 'smart'

    export const iobObjectDefintions: IoBrokerObjectDefinitions = {
        channelName: 'S.M.A.R.T info',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'devicename',
    }

    export function get(): { [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray } {
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
                readVal(val: string, adapter: ioBroker.Adapter, deviceOrClient: Smart, id: string): ioBroker.StateValue {
                    return JSON.stringify(val);
                }
            },
            devicename: {
                id: 'devicename',
                iobType: 'string',
                name: 'device name',
            },
            model: {
                iobType: 'string',
                name: 'model',
            },
            monitor: {
                iobType: 'boolean',
                name: 'is monitored'
            },
            overallstatus: {
                iobType: 'string',
                name: 'overall status',
            },
            serialnumber: {
                iobType: 'string',
                name: 'serialnumber',
            },
            size: {
                iobType: 'number',
                name: 'size',
                unit: 'TB',
                readVal(val: number, adapter: ioBroker.Adapter, deviceOrClient: Smart, id: string): ioBroker.StateValue {
                    return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            temperature: {
                iobType: 'number',
                name: 'temperature',
                unit: '°C',
                conditionToCreateState(objDevice: Smart, adapter: ioBroker.Adapter): boolean {
                    return objDevice.temperature > 0;
                },
                readVal: function (val: number, adapter: ioBroker.Adapter, deviceOrClient: Smart, id: string): ioBroker.StateValue {
                    return Math.round(val * 10) / 10;
                },
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