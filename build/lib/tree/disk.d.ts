import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import type { Disk } from '../types-disk.js';
import type { myTreeDefinition } from '../myIob.js';
export declare namespace disk {
    const idChannel = "disk";
    const iobObjectDefintions: IoBrokerObjectDefinitions<Disk, ioBroker.myAdapter>;
    function get(): {
        [key: string]: myTreeDefinition<any, Disk, ioBroker.myAdapter>;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
