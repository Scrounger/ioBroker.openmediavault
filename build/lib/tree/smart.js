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
var smart_exports = {};
__export(smart_exports, {
  smart: () => smart
});
module.exports = __toCommonJS(smart_exports);
var myHelper = __toESM(require("../helper.js"));
var import_omv_rpc = require("../omv-rpc.js");
var smart;
((smart2) => {
  let keys = void 0;
  smart2.idChannel = "smart";
  smart2.iobObjectDefintions = {
    channelName: "S.M.A.R.T info",
    deviceIdProperty: "uuid",
    deviceNameProperty: "devicename",
    additionalRequest: {
      endpoint: import_omv_rpc.ApiEndpoints.smartInfo,
      conditionProperty: "monitor",
      paramsProperty: "devicefile"
    }
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
      devicemodel: {
        iobType: "string",
        name: "devicemodel",
        conditionToCreateState(objDevice, adapter) {
          return objDevice.devicemodel !== void 0 && objDevice.devicemodel !== "";
        }
      },
      devicename: {
        id: "devicename",
        iobType: "string",
        name: "device name"
      },
      firmwareversion: {
        iobType: "string",
        name: "firmwareversion",
        conditionToCreateState(objDevice, adapter) {
          return objDevice.firmwareversion !== void 0 && objDevice.firmwareversion !== "";
        }
      },
      model: {
        iobType: "string",
        name: "model"
      },
      monitor: {
        iobType: "boolean",
        name: "is monitored"
      },
      modelfamily: {
        iobType: "string",
        name: "modelfamily",
        conditionToCreateState(objDevice, adapter) {
          return objDevice.modelfamily !== void 0 && objDevice.modelfamily !== "";
        }
      },
      overallstatus: {
        iobType: "string",
        name: "overall status"
      },
      powercycles: {
        iobType: "number",
        name: "powercycles"
      },
      poweronhours: {
        iobType: "number",
        name: "poweronhours",
        unit: "h"
      },
      rotationrate: {
        iobType: "number",
        name: "rotationrate",
        unit: "rpm",
        readVal(val, adapter, deviceOrClient, id) {
          return parseInt(val.replace(" rpm", ""));
        }
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
      uuid: {
        iobType: "string",
        name: "uuid"
      },
      vendor: {
        iobType: "string",
        name: "vendor"
      }
    };
  }
  smart2.get = get;
  function getKeys() {
    if (keys === void 0) {
      keys = myHelper.getAllKeysOfTreeDefinition(get());
    }
    return keys;
  }
  smart2.getKeys = getKeys;
  function getStateIDs() {
    return myHelper.getAllIdsOfTreeDefinition(get());
  }
  smart2.getStateIDs = getStateIDs;
})(smart || (smart = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  smart
});
//# sourceMappingURL=smart.js.map
