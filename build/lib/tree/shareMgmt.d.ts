import type { IoBrokerObjectDefinitions, myCommonChannelArray, myCommonState, myCommoneChannelObject } from '../myTypes.js';
export declare namespace shareMgmt {
    const idChannel = "shareMgmt";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myCommonState | myCommoneChannelObject | myCommonChannelArray;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
