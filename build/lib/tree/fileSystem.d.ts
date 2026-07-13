import type { IoBrokerObjectDefinitions } from '../myTypes.js';
import type { FileSystem } from '../types-fileSystem.js';
import type { myTreeDefinition } from '../myIob.js';
export declare namespace fileSystem {
    const idChannel = "fileSystem";
    const iobObjectDefintions: IoBrokerObjectDefinitions<FileSystem, ioBroker.myAdapter>;
    function get(): {
        [key: string]: myTreeDefinition<any, FileSystem, ioBroker.myAdapter>;
    };
    function getKeys(): string[];
    function getStateIDs(): string[];
}
