import * as myHelper from '../helper.js';
export var smb;
(function (smb) {
    let keys = undefined;
    smb.idChannel = 'smb';
    smb.iobObjectDefintions = {
        channelName: 'smb folders',
        deviceIdProperty: 'uuid',
        deviceNameProperty: 'sharedfoldername',
    };
    function get() {
        return {
            browseable: {
                iobType: 'boolean',
                name: 'browseable'
            },
            comment: {
                iobType: 'string',
                name: 'comment',
            },
            enable: {
                iobType: 'boolean',
                name: 'enable'
            },
            guest: {
                iobType: 'boolean',
                name: 'enable',
                readVal(val, adapter, device) {
                    return val !== 'no';
                }
            },
            hidedotfiles: {
                iobType: 'boolean',
                name: 'readonly'
            },
            readonly: {
                iobType: 'boolean',
                name: 'readonly'
            },
            recyclebin: {
                iobType: 'boolean',
                name: 'recyclebin'
            },
            sharedfoldername: {
                iobType: 'string',
                name: 'sharedfoldername',
            },
        };
    }
    smb.get = get;
    function getKeys() {
        if (keys === undefined) {
            keys = myHelper.getAllKeysOfTreeDefinition(get());
        }
        return keys;
    }
    smb.getKeys = getKeys;
    function getStateIDs() {
        return myHelper.getAllIdsOfTreeDefinition(get());
    }
    smb.getStateIDs = getStateIDs;
})(smb || (smb = {}));
