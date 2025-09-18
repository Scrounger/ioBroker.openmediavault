import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import type { myTreeDefinition } from '../myIob.js';
export declare namespace shareMgmt {
    const idChannel = "shareMgmt";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myTreeDefinition;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
