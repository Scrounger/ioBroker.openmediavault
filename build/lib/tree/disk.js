"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var disk_exports = {};
__export(disk_exports, {
  disk: () => disk
});
module.exports = __toCommonJS(disk_exports);
var myHelper = __toESM(require("../helper.js"));
var disk;
((disk2) => {
  let keys = void 0;
  disk2.idChannel = "disk";
  disk2.iobObjectDefintions = {
    channelName: "disk info",
    deviceIdProperty: "devicename",
    deviceNameProperty: "devicename"
  };
  function get() {
    return {
      canonicaldevicefile: {
        iobType: "string",
        name: "canonical device file"
      },
      description: {
        iobType: "string",
        name: "description"
      },
      devicefile: {
        iobType: "string",
        name: "device file"
      },
      devicelinks: {
        iobType: "string",
        name: "hostname",
        readVal(val, adapter, deviceOrClient, id) {
          return JSON.stringify(val);
        }
      },
      devicename: {
        iobType: "string",
        name: "device name"
      },
      hotpluggable: {
        iobType: "boolean",
        name: "hot pluggable"
      },
      israid: {
        iobType: "boolean",
        name: "is raid"
      },
      isreadonly: {
        iobType: "boolean",
        name: "is read only"
      },
      isroot: {
        iobType: "boolean",
        name: "is root"
      },
      model: {
        iobType: "string",
        name: "model"
      },
      powermode: {
        iobType: "string",
        name: "powermode"
      },
      serialnumber: {
        iobType: "string",
        name: "serialnumber"
      },
      size: {
        iobType: "number",
        name: "size",
        unit: "TB",
        readVal(val, adapter, deviceOrClient, id) {
          return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1e3) / 1e3;
        }
      },
      temperature: {
        iobType: "number",
        name: "temperature",
        unit: "\xB0C",
        conditionToCreateState(objDevice, adapter) {
          return objDevice.temperature > 0;
        },
        readVal: function(val, adapter, deviceOrClient, id) {
          return Math.round(val * 10) / 10;
        }
      },
      vendor: {
        iobType: "string",
        name: "vendor"
      }
    };
  }
  disk2.get = get;
  function getKeys() {
    if (keys === void 0) {
      keys = myHelper.getAllKeysOfTreeDefinition(get());
    }
    return keys;
  }
  disk2.getKeys = getKeys;
  function getStateIDs() {
    return myHelper.getAllIdsOfTreeDefinition(get());
  }
  disk2.getStateIDs = getStateIDs;
})(disk || (disk = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  disk
});
//# sourceMappingURL=disk.js.map
