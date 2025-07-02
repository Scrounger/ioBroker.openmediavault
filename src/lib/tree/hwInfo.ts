import _ from 'lodash';
import { myCache, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import { HwInfo } from "../types-hwInfo.js";

export namespace hwInfo {
    let keys: string[] | undefined = undefined;

    export const idChannel = 'hwInfo'

    export function get(): { [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray } {
        return {
            hostname: {
                id: 'hostname',
                iobType: 'string',
                name: 'hostname',
            },
            uptime: {
                iobType: 'number',
                name: 'uptime',
                unit: 's',
                readVal(val: number, adapter: ioBroker.Adapter, deviceOrClient: HwInfo, id: string): ioBroker.StateValue {
                    return Math.round(val);
                }
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