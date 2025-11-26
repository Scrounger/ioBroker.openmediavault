import * as myHelper from '../helper.js';
export var fileSystem;
(function (fileSystem) {
    let keys = undefined;
    fileSystem.idChannel = 'fileSystem';
    fileSystem.iobObjectDefintions = {
        channelName: 'file system info',
        deviceIdProperty: (objDevice, adapter) => {
            if (objDevice.uuid) {
                return objDevice.uuid;
            }
            else {
                if (objDevice.devicefile && objDevice.devicefile.startsWith('/dev/disk/by-uuid/')) {
                    return objDevice.devicefile.replace('/dev/disk/by-uuid/', '');
                }
            }
            return undefined;
        },
        deviceNameProperty: (objDevice, adapter) => {
            return objDevice.label || objDevice.comment;
        },
        deviceIsOnlineState: 'isOnline',
        deviceHasErrorsState: 'hasErrors',
    };
    function get() {
        return {
            available: {
                iobType: 'number',
                name: 'available',
                unit: 'TB',
                readVal(val, adapter, device, channel, id) {
                    return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            comment: {
                iobType: 'string',
                name: 'comment',
            },
            devicefile: {
                iobType: 'string',
                name: 'device file',
            },
            description: {
                iobType: 'string',
                name: 'description',
            },
            devicename: {
                iobType: 'string',
                name: 'device name',
            },
            isOnline: {
                id: 'isOnline',
                iobType: 'boolean',
                name: 'is online',
                valFromProperty: 'status',
                required: true,
                readVal(val, adapter, device, channel, id) {
                    return parseInt(val) === 1;
                },
            },
            hasErrors: {
                id: 'hasErrors',
                iobType: 'boolean',
                name: 'has errors',
                valFromProperty: 'status',
                required: true,
                readVal(val, adapter, device, channel, id) {
                    return parseInt(val) === 3;
                },
            },
            label: {
                iobType: 'string',
                name: 'device name',
            },
            mounted: {
                iobType: 'boolean',
                name: 'monted'
            },
            mountpoint: {
                iobType: 'string',
                name: 'mountpoint',
            },
            percentage: {
                iobType: 'number',
                name: 'percentage',
                unit: '%',
                readVal(val, adapter, device, channel, id) {
                    return Math.round(val);
                }
            },
            size: {
                iobType: 'number',
                name: 'size',
                unit: 'TB',
                readVal(val, adapter, device, channel, id) {
                    return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            status: {
                iobType: 'number',
                name: 'status',
                states: {
                    1: 'online',
                    2: 'initializing',
                    3: 'missing',
                },
                readVal(val, adapter, device, channel, id) {
                    return parseInt(val);
                },
            },
            type: {
                iobType: 'string',
                name: 'type',
            },
            used: {
                iobType: 'number',
                name: 'used',
                unit: 'TB',
                readVal(val, adapter, device, channel, id) {
                    return Math.round((device.size - device.available) / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            uuid: {
                iobType: 'string',
                name: 'uuid',
            },
        };
    }
    fileSystem.get = get;
    function getKeys() {
        if (keys === undefined) {
            keys = myHelper.getAllKeysOfTreeDefinition(get());
        }
        return keys;
    }
    fileSystem.getKeys = getKeys;
    function getStateIDs() {
        return myHelper.getAllIdsOfTreeDefinition(get());
    }
    fileSystem.getStateIDs = getStateIDs;
})(fileSystem || (fileSystem = {}));
