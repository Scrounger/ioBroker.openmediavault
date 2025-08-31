import * as myHelper from '../helper.js';
export var fileSystem;
(function (fileSystem) {
    let keys = undefined;
    fileSystem.idChannel = 'fileSystem';
    fileSystem.iobObjectDefintions = {
        channelName: 'file system info',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'label',
    };
    function get() {
        return {
            available: {
                iobType: 'number',
                name: 'available',
                unit: 'TB',
                readVal(val, _adapter, _deviceOrClient, _id) {
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
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val);
                }
            },
            size: {
                iobType: 'number',
                name: 'size',
                unit: 'TB',
                readVal(val, _adapter, _deviceOrClient, _id) {
                    return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
                }
            },
            type: {
                iobType: 'string',
                name: 'type',
            },
            used: {
                iobType: 'number',
                name: 'used',
                unit: 'TB',
                readVal(val, _adapter, deviceOrClient, _id) {
                    return Math.round((deviceOrClient.size - deviceOrClient.available) / 1024 / 1024 / 1024 / 1024 * 1000) / 1000;
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
