import * as myHelper from '../helper.js';
import { ApiEndpoints } from '../omv-rpc.js';
export var smart;
(function (smart) {
    let keys = undefined;
    smart.idChannel = 'smart';
    smart.iobObjectDefintions = {
        channelName: 'S.M.A.R.T info',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'devicename',
        additionalRequest: [
            {
                endpoint: ApiEndpoints.smartInfo,
                conditionProperty: 'monitor',
                paramsProperty: 'devicefile'
            },
            {
                endpoint: ApiEndpoints.smartAttributes,
                conditionProperty: 'monitor',
                paramsProperty: 'devicefile',
                converter: (data, adapter) => {
                    const logPrefix = `[smart.getAttributes.converter]:`;
                    try {
                        if (data) {
                            const result = {};
                            data.forEach((item) => {
                                const cleanAttrname = item.attrname.replace(/[-]/g, '_').toLowerCase();
                                result[cleanAttrname] = item.rawvalue;
                            });
                            return result;
                        }
                    }
                    catch (error) {
                        adapter.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
                    }
                    return {};
                }
            },
        ]
    };
    function get() {
        return {
            canonicaldevicefile: {
                iobType: 'string',
                name: 'canonical device file',
            },
            description: {
                iobType: 'string',
                name: 'description',
            },
            devicefile: {
                iobType: 'string',
                name: 'device file',
            },
            devicelinks: {
                iobType: 'string',
                name: 'hostname',
                readVal(val, adapter, device, channel, id) {
                    return JSON.stringify(val);
                }
            },
            devicemodel: {
                iobType: 'string',
                name: 'devicemodel',
                conditionToCreateState(objDevice, objChannel, adapter) {
                    return objDevice.devicemodel !== undefined && objDevice.devicemodel !== '';
                },
            },
            devicename: {
                id: 'devicename',
                iobType: 'string',
                name: 'device name',
            },
            firmwareversion: {
                iobType: 'string',
                name: 'firmwareversion',
                conditionToCreateState(objDevice, objChannel, adapter) {
                    return objDevice.firmwareversion !== undefined && objDevice.firmwareversion !== '';
                },
            },
            model: {
                iobType: 'string',
                name: 'model',
            },
            monitor: {
                iobType: 'boolean',
                name: 'is monitored'
            },
            modelfamily: {
                iobType: 'string',
                name: 'modelfamily',
                conditionToCreateState(objDevice, objChannel, adapter) {
                    return objDevice.modelfamily !== undefined && objDevice.modelfamily !== '';
                },
            },
            overallstatus: {
                iobType: 'string',
                name: 'overall status',
            },
            powercycles: {
                iobType: 'number',
                name: 'powercycles',
                readVal(val, adapter, device, channel, id) {
                    return parseInt(val);
                },
            },
            poweronhours: {
                iobType: 'number',
                name: 'poweronhours',
                unit: 'h',
                readVal(val, adapter, device, channel, id) {
                    return parseInt(val);
                },
            },
            rotationrate: {
                iobType: 'number',
                name: 'rotationrate',
                unit: 'rpm',
                readVal(val, adapter, device, channel, id) {
                    return parseInt(val.replace(' rpm', ''));
                }
            },
            serialnumber: {
                iobType: 'string',
                name: 'serialnumber',
            },
            size: {
                iobType: 'number',
                name: 'size',
                unit: 'TB',
                readVal(val, adapter, device, channel, id) {
                    return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            spin_retry_count: {
                iobType: 'number',
                name: 'spin retry count',
            },
            spin_up_time: {
                iobType: 'number',
                name: 'spin uptime',
            },
            start_stop_count: {
                iobType: 'number',
                name: 'start stopcount',
            },
            temperature: {
                iobType: 'number',
                name: 'temperature',
                unit: '°C',
                conditionToCreateState(objDevice, objChannel, adapter) {
                    return objDevice.temperature > 0;
                },
                readVal: function (val, adapter, device, channel, id) {
                    return Math.round(val * 10) / 10;
                },
            },
            total_lbas_written: {
                iobType: 'number',
                name: 'total lbas written',
                unit: 'TB',
                readVal(val, adapter, device, channel, id) {
                    return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            total_lbas_read: {
                iobType: 'number',
                name: 'total lbas read',
                unit: 'TB',
                readVal(val, adapter, device, channel, id) {
                    return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            uuid: {
                iobType: 'string',
                name: 'uuid',
            },
            vendor: {
                iobType: 'string',
                name: 'vendor',
            },
        };
    }
    smart.get = get;
    function getKeys() {
        if (keys === undefined) {
            keys = myHelper.getAllKeysOfTreeDefinition(get());
        }
        return keys;
    }
    smart.getKeys = getKeys;
    function getStateIDs() {
        return myHelper.getAllIdsOfTreeDefinition(get());
    }
    smart.getStateIDs = getStateIDs;
})(smart || (smart = {}));
