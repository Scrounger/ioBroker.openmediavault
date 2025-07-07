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
var helper_exports = {};
__export(helper_exports, {
  deepDiffBetweenObjects: () => deepDiffBetweenObjects,
  getAllIdsOfTreeDefinition: () => getAllIdsOfTreeDefinition,
  getAllKeysOfTreeDefinition: () => getAllKeysOfTreeDefinition,
  getAllowedCommonStates: () => getAllowedCommonStates,
  getIdLastPart: () => getIdLastPart,
  getIdWithoutLastPart: () => getIdWithoutLastPart,
  getObjectByString: () => getObjectByString,
  isChannelCommonEqual: () => isChannelCommonEqual,
  isDeviceCommonEqual: () => isDeviceCommonEqual,
  isStateCommonEqual: () => isStateCommonEqual,
  radioToFrequency: () => radioToFrequency,
  radio_nameToFrequency: () => radio_nameToFrequency,
  zeroPad: () => zeroPad
});
module.exports = __toCommonJS(helper_exports);
var import_lodash = __toESM(require("lodash"));
function isDeviceCommonEqual(objCommon, myCommon) {
  return (!myCommon.name || import_lodash.default.isEqual(objCommon.name, myCommon.name)) && (!myCommon.icon || objCommon.icon === myCommon.icon) && objCommon.desc === myCommon.desc && objCommon.role === myCommon.role && import_lodash.default.isEqual(objCommon.statusStates, myCommon.statusStates);
}
function isChannelCommonEqual(objCommon, myCommon) {
  return (!myCommon.name || import_lodash.default.isEqual(objCommon.name, myCommon.name)) && (!myCommon.icon || objCommon.icon === myCommon.icon) && objCommon.desc === myCommon.desc && objCommon.role === myCommon.role;
}
function getObjectByString(path, obj, separator = ".") {
  const properties = Array.isArray(path) ? path : path.split(separator);
  return properties.reduce((prev, curr) => prev == null ? void 0 : prev[curr], obj);
}
function getAllowedCommonStates(path, obj, separator = ".") {
  const objByString = getObjectByString(path, obj, separator);
  const states = {};
  if (objByString) {
    for (const str of objByString) {
      states[str] = str;
    }
    return states;
  }
  return void 0;
}
function isStateCommonEqual(objCommon, myCommon) {
  return import_lodash.default.isEqual(objCommon.name, myCommon.name) && import_lodash.default.isEqual(objCommon.type, myCommon.type) && import_lodash.default.isEqual(objCommon.read, myCommon.read) && import_lodash.default.isEqual(objCommon.write, myCommon.write) && import_lodash.default.isEqual(objCommon.role, myCommon.role) && import_lodash.default.isEqual(objCommon.def, myCommon.def) && import_lodash.default.isEqual(objCommon.unit, myCommon.unit) && import_lodash.default.isEqual(objCommon.icon, myCommon.icon) && import_lodash.default.isEqual(objCommon.desc, myCommon.desc) && import_lodash.default.isEqual(objCommon.max, myCommon.max) && import_lodash.default.isEqual(objCommon.min, myCommon.min) && import_lodash.default.isEqual(objCommon.states, myCommon.states);
}
function zeroPad(source, places) {
  const zero = places - source.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + source;
}
function getIdWithoutLastPart(id) {
  const lastIndex = id.lastIndexOf(".");
  return id.substring(0, lastIndex);
}
function getIdLastPart(id) {
  const result = id.split(".").pop();
  return result ? result : "";
}
const deepDiffBetweenObjects = (object, base, adapter, allowedKeys = void 0, prefix = "") => {
  const logPrefix = "[deepDiffBetweenObjects]:";
  try {
    const changes = (object2, base2, prefixInner = "") => {
      return import_lodash.default.transform(object2, (result, value, key) => {
        const fullKey = prefixInner ? `${prefixInner}.${key}` : key;
        try {
          if (!import_lodash.default.isEqual(value, base2[key]) && (allowedKeys && allowedKeys.includes(fullKey) || allowedKeys === void 0)) {
            if (import_lodash.default.isArray(value)) {
              if (import_lodash.default.some(value, (item) => import_lodash.default.isObject(item))) {
                const tmp = [];
                let empty = true;
                for (let i = 0; i <= value.length - 1; i++) {
                  const res = deepDiffBetweenObjects(value[i], base2[key] && base2[key][i] ? base2[key][i] : {}, adapter, allowedKeys, fullKey);
                  if (!import_lodash.default.isEmpty(res) || res === 0 || res === false) {
                    tmp.push(res);
                    empty = false;
                  } else {
                    tmp.push(null);
                  }
                }
                if (!empty) {
                  result[key] = tmp;
                }
              } else {
                adapter.log.warn(`${key.toString()}: pure Array (base: ${base2[key]}, val: ${value})`);
                if (!import_lodash.default.isEqual(value, base2[key])) {
                  result[key] = value;
                }
              }
            } else if (import_lodash.default.isObject(value) && import_lodash.default.isObject(base2[key])) {
              const res = changes(value, base2[key] ? base2[key] : {}, fullKey);
              if (!import_lodash.default.isEmpty(res) || res === 0 || res === false) {
                result[key] = res;
              }
            } else {
              result[key] = value;
            }
          }
        } catch (error) {
          adapter.log.error(`${logPrefix} transform error: ${error}, stack: ${error.stack}, fullKey: ${fullKey}, object: ${JSON.stringify(object2)}, base: ${JSON.stringify(base2)}`);
        }
      });
    };
    return changes(object, base, prefix);
  } catch (error) {
    adapter.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}, object: ${JSON.stringify(object)}, base: ${JSON.stringify(base)}`);
  }
  return object;
};
function getAllKeysOfTreeDefinition(treefDefintion) {
  const keys = [];
  function recurse(currentObj, prefix = "") {
    import_lodash.default.forOwn(currentObj, (value, key) => {
      const fullKey = (prefix ? `${prefix}.${key}` : key).replace(".array", "").replace(".object", "");
      if (import_lodash.default.isObject(value) && typeof value !== "function" && key !== "states") {
        keys.push(fullKey);
        if (import_lodash.default.isArray(value) || import_lodash.default.isObject(value)) {
          recurse(value, fullKey);
        }
      } else {
        if (key === "valFromProperty") {
          const prefixCleared = getIdWithoutLastPart(prefix);
          keys.push(`${prefixCleared ? `${prefixCleared}.` : ""}${value}`);
        }
      }
    });
  }
  recurse(treefDefintion);
  return import_lodash.default.uniq(keys);
}
function getAllIdsOfTreeDefinition(treefDefintion) {
  const keys = [];
  function recurse(currentObj, prefix = "") {
    import_lodash.default.forOwn(currentObj, (value, key) => {
      let fullKey = prefix ? `${prefix}.${key}` : key;
      if (Object.hasOwn(value, "idChannel") && !import_lodash.default.isObject(value.idChannel)) {
        fullKey = prefix ? `${prefix}.${value.idChannel}` : value.idChannel;
      } else if (Object.hasOwn(value, "id") && !import_lodash.default.isObject(value.id)) {
        fullKey = prefix ? `${prefix}.${value.id}` : value.id;
      }
      fullKey = fullKey.replace(".array", "").replace(".object", "");
      if (import_lodash.default.isObject(value) && typeof value !== "function" && key !== "states") {
        if (!import_lodash.default.has(value, "required")) {
          keys.push(fullKey);
        }
        if (import_lodash.default.isArray(value) || import_lodash.default.isObject(value)) {
          recurse(value, fullKey);
        }
      }
    });
  }
  recurse(treefDefintion);
  return import_lodash.default.uniq(keys);
}
function radioToFrequency(radioVal, adapter) {
  if (radioVal === "ng") {
    return "2.4 GHz";
  } else if (radioVal === "na") {
    return "5 GHz";
  } else {
    adapter.log.warn(`radio ${radioVal} interpreter not implemented! Please create an issue on github.`);
    return radioVal;
  }
}
function radio_nameToFrequency(radio_nameVal, adapter) {
  if (radio_nameVal === "wifi0" || radio_nameVal === "ra0") {
    return "2.4 GHz";
  } else if (radio_nameVal === "wifi1" || radio_nameVal === "rai0") {
    return "5 GHz";
  } else {
    adapter.log.warn(`radio ${radio_nameVal} interpreter not implemented! Please create an issue on github.`);
    return "n/a";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deepDiffBetweenObjects,
  getAllIdsOfTreeDefinition,
  getAllKeysOfTreeDefinition,
  getAllowedCommonStates,
  getIdLastPart,
  getIdWithoutLastPart,
  getObjectByString,
  isChannelCommonEqual,
  isDeviceCommonEqual,
  isStateCommonEqual,
  radioToFrequency,
  radio_nameToFrequency,
  zeroPad
});
//# sourceMappingURL=helper.js.map
