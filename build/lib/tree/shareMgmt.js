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
var shareMgmt_exports = {};
__export(shareMgmt_exports, {
  shareMgmt: () => shareMgmt
});
module.exports = __toCommonJS(shareMgmt_exports);
var myHelper = __toESM(require("../helper.js"));
var shareMgmt;
((shareMgmt2) => {
  let keys = void 0;
  shareMgmt2.idChannel = "shareMgmt";
  function get() {
    return {
      name: {
        iobType: "string",
        name: "folder name"
      },
      comment: {
        iobType: "string",
        name: "comment"
      },
      device: {
        iobType: "string",
        name: "device of folder"
      }
    };
  }
  shareMgmt2.get = get;
  function getKeys() {
    if (keys === void 0) {
      keys = myHelper.getAllKeysOfTreeDefinition(get());
    }
    return keys;
  }
  shareMgmt2.getKeys = getKeys;
  function getStateIDs() {
    return myHelper.getAllIdsOfTreeDefinition(get());
  }
  shareMgmt2.getStateIDs = getStateIDs;
})(shareMgmt || (shareMgmt = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  shareMgmt
});
//# sourceMappingURL=shareMgmt.js.map
