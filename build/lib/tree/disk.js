import * as myHelper from '../helper.js';
export var disk;
(function (disk) {
    let keys = undefined;
    disk.idChannel = 'disk';
    disk.iobObjectDefintions = {
        channelName: 'disk info',
        deviceIdProperty: (objDevice, adapter) => {
            if (objDevice.devicelinks) {
                const find = objDevice.devicelinks.find(x => x.includes('/dev/disk/by-uuid/'));
                if (find) {
                    return find.replace('/dev/disk/by-uuid/', '');
                }
            }
            return objDevice.devicename;
        },
        deviceNameProperty: 'devicename'
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
            devicename: {
                iobType: 'string',
                name: 'device name',
            },
            hotpluggable: {
                iobType: 'boolean',
                name: 'hot pluggable'
            },
            israid: {
                iobType: 'boolean',
                name: 'is raid'
            },
            isreadonly: {
                iobType: 'boolean',
                name: 'is read only'
            },
            isroot: {
                iobType: 'boolean',
                name: 'is root'
            },
            model: {
                iobType: 'string',
                name: 'model',
            },
            powermode: {
                iobType: 'string',
                name: 'powermode',
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
            vendor: {
                iobType: 'string',
                name: 'vendor',
            },
        };
    }
    disk.get = get;
    function getKeys() {
        if (keys === undefined) {
            keys = myHelper.getAllKeysOfTreeDefinition(get());
        }
        return keys;
    }
    disk.getKeys = getKeys;
    function getStateIDs() {
        return myHelper.getAllIdsOfTreeDefinition(get());
    }
    disk.getStateIDs = getStateIDs;
})(disk || (disk = {}));
