import _ from 'lodash';
import { myCache, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import { FileSystem } from "../types-fileSystem.js";

export namespace fileSystem {
    let keys: string[] | undefined = undefined;

    export const idChannel = 'fileSystem'

    export function get(): { [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray } {
        return {
            devicename: {
                id: 'devicename',
                iobType: 'string',
                name: 'device name',
            },
            type: {
                id: 'type',
                iobType: 'string',
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