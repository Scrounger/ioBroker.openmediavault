import * as myHelper from '../helper.js';
export var hwInfo;
(function (hwInfo) {
    let keys = undefined;
    hwInfo.idChannel = 'hwInfo';
    hwInfo.iobObjectDefintions = {
        channelName: 'hardware info',
        deviceIdProperty: undefined,
        deviceNameProperty: undefined,
    };
    function get() {
        return {
            availablePkgUpdates: {
                iobType: 'number',
                name: 'available package updates',
            },
            cpuModelName: {
                iobType: 'string',
                name: 'cpu model',
            },
            cpuUtilization: {
                iobType: 'number',
                name: 'cpu utilization',
                unit: '%',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val);
                }
            },
            cpuCores: {
                iobType: 'number',
                name: 'cpu cores',
            },
            cpuMhz: {
                iobType: 'number',
                name: 'cpu freqency',
            },
            hostname: {
                iobType: 'string',
                name: 'hostname',
            },
            kernel: {
                iobType: 'string',
                name: 'hostname',
            },
            loadAverage: {
                idChannel: 'loadAverage',
                channelName(_objDevice, _objChannel, _adapter) {
                    return 'load average';
                },
                object: {
                    '1min': {
                        iobType: 'number',
                        name: '1 minute',
                    },
                    '5min': {
                        iobType: 'number',
                        name: '5 minute',
                    },
                    '15min': {
                        iobType: 'number',
                        name: '15 minute',
                    },
                }
            },
            memTotal: {
                iobType: 'number',
                name: 'memory total',
                unit: 'GB',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            memFree: {
                iobType: 'number',
                name: 'memory free',
                unit: 'GB',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            memUsed: {
                iobType: 'number',
                name: 'memory used',
                unit: 'GB',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            memAvailable: {
                iobType: 'number',
                name: 'memory available',
                unit: 'GB',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            memUtilization: {
                iobType: 'number',
                name: 'memory utilization',
                unit: '%',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val * 100);
                }
            },
            rebootRequired: {
                iobType: 'boolean',
                name: 'restart required'
            },
            uptime: {
                iobType: 'number',
                name: 'uptime',
                unit: 's',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val);
                }
            },
            upgradeable: {
                id: 'upgradeable',
                iobType: 'boolean',
                name: 'upgradeable',
                valFromProperty: 'availablePkgUpdates',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return val > 0;
                }
            },
            version: {
                iobType: 'string',
                name: 'version',
            },
        };
    }
    hwInfo.get = get;
    function getKeys() {
        if (keys === undefined) {
            keys = myHelper.getAllKeysOfTreeDefinition(get());
        }
        return keys;
    }
    hwInfo.getKeys = getKeys;
    function getStateIDs() {
        return myHelper.getAllIdsOfTreeDefinition(get());
    }
    hwInfo.getStateIDs = getStateIDs;
})(hwInfo || (hwInfo = {}));
