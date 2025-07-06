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
var fileSystem_exports = {};
__export(fileSystem_exports, {
  fileSystem: () => fileSystem
});
module.exports = __toCommonJS(fileSystem_exports);
var myHelper = __toESM(require("../helper.js"));
var fileSystem;
((fileSystem2) => {
  let keys = void 0;
  fileSystem2.idChannel = "fileSystem";
  fileSystem2.iobObjectDefintions = {
    channelName: "file system info",
    deviceIdProperty: "uuid",
    deviceNameProperty: "label"
  };
  function get() {
    return {
      available: {
        iobType: "number",
        name: "available",
        unit: "TB",
        readVal(val, adapter, deviceOrClient, id) {
          return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1e3) / 1e3;
        }
      },
      comment: {
        iobType: "string",
        name: "comment"
      },
      devicefile: {
        iobType: "string",
        name: "device file"
      },
      description: {
        iobType: "string",
        name: "description"
      },
      devicename: {
        iobType: "string",
        name: "device name"
      },
      label: {
        iobType: "string",
        name: "device name"
      },
      mounted: {
        iobType: "boolean",
        name: "monted"
      },
      mountpoint: {
        iobType: "string",
        name: "mountpoint"
      },
      percentage: {
        iobType: "number",
        name: "percentage",
        unit: "%",
        readVal(val, adapter, deviceOrClient, id) {
          return Math.round(val);
        }
      },
      size: {
        iobType: "number",
        name: "size",
        unit: "TB",
        readVal(val, adapter, deviceOrClient, id) {
          return Math.round(val / 1024 / 1024 / 1024 / 1024 * 1e3) / 1e3;
        }
      },
      type: {
        iobType: "string",
        name: "type"
      },
      used: {
        iobType: "number",
        name: "used",
        unit: "TB",
        readVal(val, adapter, deviceOrClient, id) {
          return Math.round((deviceOrClient.size - deviceOrClient.available) / 1024 / 1024 / 1024 / 1024 * 1e3) / 1e3;
        }
      },
      uuid: {
        iobType: "string",
        name: "uuid"
      }
    };
  }
  fileSystem2.get = get;
  function getKeys() {
    if (keys === void 0) {
      keys = myHelper.getAllKeysOfTreeDefinition(get());
    }
    return keys;
  }
  fileSystem2.getKeys = getKeys;
  function getStateIDs() {
    return myHelper.getAllIdsOfTreeDefinition(get());
  }
  fileSystem2.getStateIDs = getStateIDs;
})(fileSystem || (fileSystem = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fileSystem
});
//# sourceMappingURL=fileSystem.js.map
