import * as myHelper from '../helper.js';
export var shareMgmt;
(function (shareMgmt) {
    let keys = undefined;
    shareMgmt.idChannel = 'shareMgmt';
    shareMgmt.iobObjectDefintions = {
        channelName: 'shared folders',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'name',
    };
    function get() {
        return {
            name: {
                iobType: 'string',
                name: 'folder name',
            },
            comment: {
                iobType: 'string',
                name: 'comment',
            },
            description: {
                iobType: 'string',
                name: 'description',
            },
            device: {
                iobType: 'string',
                name: 'device of folder',
            },
            mntent: {
                channelName(_objDevice, _objChannel, _adapter) {
                    return 'mntent';
                },
                object: {
                    devicefile: {
                        iobType: 'string',
                        name: 'device file',
                    },
                    fsname: {
                        iobType: 'string',
                        name: 'fsname',
                    },
                    dir: {
                        iobType: 'string',
                        name: 'dir',
                    },
                    type: {
                        iobType: 'string',
                        name: 'type',
                    },
                }
            },
            mntentref: {
                iobType: 'string',
                name: 'mntentref',
            },
            reldirpath: {
                iobType: 'string',
                name: 'reldirpath',
            },
            snapshots: {
                iobType: 'boolean',
                name: 'snapshots'
            },
            uuid: {
                iobType: 'string',
                name: 'uuid',
            },
        };
    }
    shareMgmt.get = get;
    function getKeys() {
        if (keys === undefined) {
            keys = myHelper.getAllKeysOfTreeDefinition(get());
        }
        return keys;
    }
    shareMgmt.getKeys = getKeys;
    function getStateIDs() {
        return myHelper.getAllIdsOfTreeDefinition(get());
    }
    shareMgmt.getStateIDs = getStateIDs;
})(shareMgmt || (shareMgmt = {}));
