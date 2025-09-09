import type { IoBrokerObjectDefinitions, myTreeDefinition } from '../myTypes.js';
export declare namespace fileSystem {
    const idChannel = "fileSystem";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myTreeDefinition;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
