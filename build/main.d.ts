import * as utils from '@iobroker/adapter-core';
import * as schedule from 'node-schedule';
import { OmvApi } from './lib/omv-rpc.js';
import { myIob } from './lib/myIob.js';
declare class Openmediavault extends utils.Adapter {
    omvApi: OmvApi | undefined;
    myIob: myIob;
    updateSchedule: schedule.Job | undefined;
    subscribedList: string[];
    statesUsingValAsLastChanged: any[];
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
}
export default function startAdapter(options: Partial<utils.AdapterOptions> | undefined): Openmediavault;
export {};
