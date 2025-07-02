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
var omv_rpc_exports = {};
__export(omv_rpc_exports, {
  ApiEndpoints: () => ApiEndpoints,
  OmvApi: () => OmvApi,
  iobObjectDef: () => iobObjectDef
});
module.exports = __toCommonJS(omv_rpc_exports);
var import_node_fetch = __toESM(require("node-fetch"));
var import_fetch_cookie = __toESM(require("fetch-cookie"));
var import_tough_cookie = require("tough-cookie");
var import_https = __toESM(require("https"));
var url = __toESM(require("url"));
class OmvApi {
  logPrefix = "OmvApi";
  isConnected = false;
  adapter;
  log;
  url;
  httpsAgent = void 0;
  jar;
  fetchWithCookies;
  constructor(adapter) {
    this.adapter = adapter;
    this.log = adapter.log;
    this.url = new url.URL(`${this.adapter.config.url}/rpc.php`);
    if (this.adapter.config.ignoreSSLCertificate && this.url.protocol === "https:") {
      this.httpsAgent = new import_https.default.Agent({
        rejectUnauthorized: false
      });
    }
    this.jar = new import_tough_cookie.CookieJar();
    this.fetchWithCookies = (0, import_fetch_cookie.default)(import_node_fetch.default, this.jar);
  }
  async login() {
    const logPrefix = `[${this.logPrefix}.login]:`;
    try {
      const response = await this.fetchWithCookies(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(this.getEndpointData("login" /* login */)),
        agent: this.httpsAgent
      });
      if (response.ok) {
        const result = await response.json();
        if (result && response) {
          if (result.response.authenticated) {
            this.log.debug(`${logPrefix} result: ${JSON.stringify(result)}`);
            this.log.info(`${logPrefix} login to OpenMediaVault successful`);
            await this.setConnectionStatus(true);
            return;
          } else {
            this.log.error(`${logPrefix} OpenMediaVault authenticated failed`);
          }
        } else {
          this.log.error(`${logPrefix} OpenMediaVault no data in repsonse`);
        }
      } else {
        this.log.error(`${logPrefix} HTTP error! Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
    await this.setConnectionStatus(false);
  }
  async retrievData(endpoint) {
    const logPrefix = `[${this.logPrefix}.retrievData]:`;
    try {
      const response = await this.fetchWithCookies(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.getEndpointData(endpoint)),
        agent: this.httpsAgent
      });
      if (response.ok) {
        const result = await response.json();
        if (result && result.response) {
          this.log.debug(`${logPrefix} reponse data for endpoint '${endpoint}': ${JSON.stringify(result)}`);
          if (result.response.data) {
            return result.response.data;
          } else {
            return result.response;
          }
        } else {
          if (result && result.error) {
            this.log.error(`${logPrefix} OpenMediaVault error: ${result.error}`);
          } else {
            this.log.error(`${logPrefix} OpenMediaVault no data in repsonse`);
          }
          return void 0;
        }
      } else {
        this.log.error(`${logPrefix} HTTP error! Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
    await this.setConnectionStatus(false);
    return void 0;
  }
  async logout() {
    const logPrefix = `[${this.logPrefix}.logout]:`;
    try {
      const response = await this.fetchWithCookies(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(this.getEndpointData("login" /* login */)),
        agent: this.httpsAgent
      });
      if (response.ok) {
        this.log.info(`${logPrefix} login from OpenMediaVault successful`);
        const result = await response.json();
        this.log.info(JSON.stringify(result));
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
    await this.setConnectionStatus(false);
  }
  getEndpointData(endpoint) {
    switch (endpoint) {
      case "login" /* login */:
        return {
          service: "session",
          method: "login",
          params: {
            username: this.adapter.config.user,
            password: this.adapter.config.password
          }
        };
      case "logout" /* logout */:
        return {
          service: "session",
          method: "logout",
          params: null
        };
      case "hwInfo" /* hwInfo */:
        return {
          service: "System",
          method: "getInformation",
          params: null
        };
      case "disk" /* disk */:
        return {
          service: "DiskMgmt",
          method: "enumerateDevices",
          params: null
        };
      case "smart" /* smart */:
        return {
          service: "Smart",
          method: "getList",
          params: {
            start: 0,
            limit: -1
          }
        };
      case "fileSystem" /* fileSystem */:
        return {
          service: "FileSystemMgmt",
          method: "enumerateMountedFilesystems"
        };
      case "service" /* service */:
        return {
          service: "Services",
          method: "getStatus"
        };
      case "plugin" /* plugin */:
        return {
          service: "Plugin",
          method: "enumeratePlugins"
        };
      case "network" /* network */:
        return {
          service: "Network",
          method: "enumerateDevices"
        };
      case "kvm" /* kvm */:
        return {
          service: "Kvm",
          method: "getVmList"
        };
      default:
        return {
          service: "System",
          method: "getInformation"
        };
    }
  }
  /** Set adapter info.connection state and internal var
  * @param {boolean} isConnected
  */
  async setConnectionStatus(isConnected) {
    const logPrefix = `[${this.logPrefix}.setConnectionStatus]:`;
    try {
      this.isConnected = isConnected;
      await this.adapter.setState("info.connection", isConnected, true);
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
  }
}
var ApiEndpoints = /* @__PURE__ */ ((ApiEndpoints2) => {
  ApiEndpoints2["login"] = "login";
  ApiEndpoints2["logout"] = "logout";
  ApiEndpoints2["hwInfo"] = "hwInfo";
  ApiEndpoints2["disk"] = "disk";
  ApiEndpoints2["smart"] = "smart";
  ApiEndpoints2["fileSystem"] = "fileSystem";
  ApiEndpoints2["service"] = "service";
  ApiEndpoints2["plugin"] = "plugin";
  ApiEndpoints2["network"] = "network";
  ApiEndpoints2["kvm"] = "kvm";
  return ApiEndpoints2;
})(ApiEndpoints || {});
const iobObjectDef = {
  hwInfo: {
    channelName: "hardware info",
    deviceIdProperty: void 0,
    deviceNameProperty: void 0
  },
  disk: {
    channelName: "disk info",
    deviceIdProperty: "devicename",
    deviceNameProperty: "devicename"
  },
  smart: {
    channelName: "S.M.A.R.T info",
    deviceIdProperty: "uuid",
    deviceNameProperty: "devicename"
  },
  fileSystem: {
    channelName: "file system info",
    deviceIdProperty: "uuid",
    deviceNameProperty: "comment"
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiEndpoints,
  OmvApi,
  iobObjectDef
});
//# sourceMappingURL=omv-rpc.js.map
