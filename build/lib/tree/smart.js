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
        additionalRequest: {
            endpoint: ApiEndpoints.smartInfo,
            conditionProperty: 'monitor',
            paramsProperty: 'devicefile'
        }
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
                readVal(val, adapter, device, id) {
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
                readVal(val, adapter, device, id) {
                    return parseInt(val);
                },
            },
            poweronhours: {
                iobType: 'number',
                name: 'poweronhours',
                unit: 'h',
                readVal(val, adapter, device, id) {
                    return parseInt(val);
                },
            },
            rotationrate: {
                iobType: 'number',
                name: 'rotationrate',
                unit: 'rpm',
                readVal(val, adapter, device, id) {
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
                readVal(val, adapter, device, id) {
                    return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            temperature: {
                iobType: 'number',
                name: 'temperature',
                unit: '°C',
                conditionToCreateState(objDevice, objChannel, adapter) {
                    return objDevice.temperature > 0;
                },
                readVal: function (val, adapter, device, id) {
                    return Math.round(val * 10) / 10;
                },
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
