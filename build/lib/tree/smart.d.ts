import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import type { Smart } from '../types-smart.js';
import type { myTreeDefinition } from '../myIob.js';
export declare namespace smart {
    const idChannel = "smart";
    const iobObjectDefintions: IoBrokerObjectDefinitions<Smart, ioBroker.myAdapter>;
    function get(): {
        [key: string]: myTreeDefinition<any, Smart, ioBroker.myAdapter>;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
