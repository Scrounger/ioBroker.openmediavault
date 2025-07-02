import _ from 'lodash';
import { myCache, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import { Smart } from "../types-smart.js";

export namespace smart {
    let keys: string[] | undefined = undefined;

    export const idChannel = 'smart'

    export function get(): { [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray } {
        return {
            devicename: {
                id: 'devicename',
                iobType: 'string',
                name: 'device name',
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