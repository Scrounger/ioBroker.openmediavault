import type { IoBrokerObjectDefinitions, myTreeDefinition } from '../myTypes.js';
export declare namespace hwInfo {
    const idChannel = "hwInfo";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myTreeDefinition;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
