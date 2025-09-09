import type { IoBrokerObjectDefinitions, myTreeDefinition } from '../myTypes.js';
export declare namespace smart {
    const idChannel = "smart";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myTreeDefinition;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
