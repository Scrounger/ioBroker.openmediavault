import _ from 'lodash';
import { IoBrokerObjectDefinitions, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
import * as myHelper from '../helper.js';
import { ShareMgmt } from "../types-shareMgmt.js";

export namespace shareMgmt {
    let keys: string[] | undefined = undefined;

    export const idChannel = 'shareMgmt'

    export const iobObjectDefintions: IoBrokerObjectDefinitions = {
        channelName: 'shared folders',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'name',
    }

    export function get(): { [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray } {
        return {
            name: {
                iobType: 'string',
                name: 'folder name',
            },
            comment: {
                iobType: 'string',
                name: 'comment',
            },
            device: {
                iobType: 'string',
                name: 'device of folder',
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