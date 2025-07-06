"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tree_exports = {};
__export(tree_exports, {
  disk: () => import_disk.disk,
  fileSystem: () => import_fileSystem.fileSystem,
  hwInfo: () => import_hwInfo.hwInfo,
  shareMgmt: () => import_shareMgmt.shareMgmt,
  smart: () => import_smart.smart,
  smb: () => import_smb.smb
});
module.exports = __toCommonJS(tree_exports);
var import_hwInfo = require("./hwInfo.js");
var import_disk = require("./disk.js");
var import_smart = require("./smart.js");
var import_fileSystem = require("./fileSystem.js");
var import_shareMgmt = require("./shareMgmt.js");
var import_smb = require("./smb.js");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  disk,
  fileSystem,
  hwInfo,
  shareMgmt,
  smart,
  smb
});
//# sourceMappingURL=index.js.map
