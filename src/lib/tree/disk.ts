import _ from 'lodash';
import { myCache, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import { Disk } from "../types-disk.js";

export namespace disk {
    let keys: string[] | undefined = undefined;

    export const idChannel = 'disk'

    export function get(): { [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray } {
        return {
            devicelinks: {
                id: 'devicelinks',
                iobType: 'string',
                name: 'hostname',
                readVal(val: string, adapter: ioBroker.Adapter, deviceOrClient: Disk, id: string): ioBroker.StateValue {
                    return JSON.stringify(val);
                }
            },
            devicename: {
                id: 'devicename',
                iobType: 'string',
                name: 'device name',
            },
            isreadonly: {
                id: 'isreadonly',
                iobType: 'boolean',
                name: 'is read only'
            },
            temperature: {
                id: 'temperature',
                iobType: 'number',
                name: 'temperature',
                unit: '°C',
                conditionToCreateState(objDevice: Disk, adapter: ioBroker.Adapter): boolean {
                    return objDevice.temperature > 0;
                },
                readVal: function (val: number, adapter: ioBroker.Adapter, deviceOrClient: Disk, id: string): ioBroker.StateValue {
                    return Math.round(val * 10) / 10;
                },
            }
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