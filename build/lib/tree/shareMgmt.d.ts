import type { IoBrokerObjectDefinitions, myTreeDefinition } from '../myTypes.js';
export declare namespace shareMgmt {
    const idChannel = "shareMgmt";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myTreeDefinition;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
