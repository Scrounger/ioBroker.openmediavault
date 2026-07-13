import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import type { Smb } from '../types-smb.js';
import type { myTreeDefinition } from '../myIob.js';
export declare namespace smb {
    const idChannel = "smb";
    const iobObjectDefintions: IoBrokerObjectDefinitions;
    function get(): {
        [key: string]: myTreeDefinition<any, Smb, ioBroker.myAdapter>;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
