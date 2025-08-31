import * as utils from '@iobroker/adapter-core';
import { OmvApi } from './lib/omv-rpc.js';
import type { myCommonState } from './lib/myTypes.js';
declare class Openmediavault extends utils.Adapter {
    omvApi: OmvApi | undefined;
    subscribedList: string[];
    updateTimeout: ioBroker.Timeout | undefined;
    configDevicesCache: {
        [key: string]: {
            label: string;
            value: string;
        }[];
    };
    constructor(options?: Partial<utils.AdapterOptions>);
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private onReady;
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param callback
     */
    private onUnload;
    /**
     * Is called if a subscribed state changes
     *
     * @param id
     * @param state
     */
    private onStateChange;
    /**
     * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
     * Using this method requires 'common.messagebox' property to be set to true in io-package.json
     *
     * @param obj
     */
    private onMessage;
    private updateData;
    /**
     * update data gerneric
     *
     * @param endpoint
     * @param treeType
     * @param iobObjectDefintions
     * @param isAdapterStart
     */
    private updateDataGeneric;
    /**
     * create or update a channel object, update will only be done on adapter start
     *
     * @param id
     * @param name
     * @param icon
     * @param isAdapterStart
     */
    private createOrUpdateChannel;
    /**
     * create or update a device object, update will only be done on adapter start
     *
     * @param id
     * @param name
     * @param onlineId
     * @param errorId
     * @param icon
     * @param isAdapterStart
     * @param logChanges
     */
    private createOrUpdateDevice;
    createOrUpdateGenericState(channel: string, treeDefinition: any, objValues: any, blacklistFilter: {
        id: string;
    }[], isWhiteList: boolean, objDevices: any, objChannel: any, isAdapterStart?: boolean, filterId?: string, isChannelOnWhitelist?: boolean): Promise<void>;
    getCommonGenericState(id: string, treeDefinition: {
        [key: string]: myCommonState;
    }, objDevices: any, logMsgState: string): any;
}
export default function startAdapter(options: Partial<utils.AdapterOptions> | undefined): Openmediavault;
export {};
