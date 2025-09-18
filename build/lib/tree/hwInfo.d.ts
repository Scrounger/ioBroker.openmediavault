import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import type { myTreeDefinition } from '../myIob.js';
export declare namespace hwInfo {
    const idChannel = "hwInfo";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myTreeDefinition;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
