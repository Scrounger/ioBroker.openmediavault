import type { IoBrokerObjectDefinitions, myTreeDefinition } from '../myTypes.js';
export declare namespace disk {
    const idChannel = "disk";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myTreeDefinition;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
