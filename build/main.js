"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var utils = __toESM(require("@iobroker/adapter-core"));
var import_lodash = __toESM(require("lodash"));
var import_omv_rpc = require("./lib/omv-rpc.js");
var tree = __toESM(require("./lib/tree/index.js"));
var myHelper = __toESM(require("./lib/helper.js"));
var myI18n = __toESM(require("./lib/i18n.js"));
class Openmediavault extends utils.Adapter {
  omvApi = void 0;
  subscribedList = [];
  constructor(options = {}) {
    super({
      ...options,
      name: "openmediavault",
      useFormatDate: true
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  //#region adapter methods
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    await myI18n.init(`${utils.getAbsoluteDefaultDataDir().replace("iobroker-data/", "")}node_modules/iobroker.${this.name}/admin`, this);
    this.omvApi = new import_omv_rpc.OmvApi(this);
    await this.updateData(true);
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  async onUnload(callback) {
    var _a;
    try {
      await ((_a = this.omvApi) == null ? void 0 : _a.logout());
      callback();
    } catch (e) {
      callback();
    }
  }
  // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
  // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
  // /**
  //  * Is called if a subscribed object changes
  //  */
  // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
  // 	if (obj) {
  // 		// The object was changed
  // 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
  // 	} else {
  // 		// The object was deleted
  // 		this.log.info(`object ${id} deleted`);
  // 	}
  // }
  /**
   * Is called if a subscribed state changes
   */
  onStateChange(id, state) {
    if (state) {
      this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
  /**
   * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
   * Using this method requires "common.messagebox" property to be set to true in io-package.json
   */
  async onMessage(obj) {
    const logPrefix = "[onMessage]:";
    try {
      if (typeof obj === "object") {
        if (obj.command.endsWith("StateList")) {
          const states = tree[obj.command.replace("StateList", "")].getStateIDs();
          let list = [];
          if (states) {
            for (let i = 0; i <= states.length - 1; i++) {
              if (states[i + 1] && states[i] === myHelper.getIdWithoutLastPart(states[i + 1])) {
                list.push({
                  label: `[Channel]	 ${states[i]}`,
                  value: states[i]
                });
              } else {
                list.push({
                  label: `[State]		 ${states[i]}`,
                  value: states[i]
                });
              }
            }
          }
          list = import_lodash.default.orderBy(list, ["value"], ["asc"]);
          if (obj.callback) this.sendTo(obj.from, obj.command, list, obj.callback);
        }
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
  }
  //#endregion
  //#region updateData
  async updateData(isAdapterStart = false) {
    const logPrefix = "[updateData]:";
    try {
      if (this.omvApi) {
        if (!this.omvApi.isConnected) {
          await this.omvApi.login();
        }
        for (const endpoint in import_omv_rpc.ApiEndpoints) {
          if (import_omv_rpc.iobObjectDef[endpoint]) {
            await this.updateDataGeneric(
              endpoint,
              tree[endpoint],
              import_omv_rpc.iobObjectDef[endpoint].channelName,
              import_omv_rpc.iobObjectDef[endpoint].deviceIdProperty,
              import_omv_rpc.iobObjectDef[endpoint].deviceNameProperty,
              isAdapterStart
            );
          } else {
            if (this.log.level === "debug") {
              this.log.warn(`${logPrefix} no iob definitions for endpoint ${endpoint} exists!`);
            }
          }
        }
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
  }
  /**
   * 
   * @param endpoint 
   * @param treeType 
   * @param channelName 
   * @param propertyDeviceId property to be used as id of device
   * @param deviceName property to be used as name of device
   * @param configEnabled 
   * @param isAdapterStart 
   */
  async updateDataGeneric(endpoint, treeType, channelName, propertyDeviceId, deviceName, isAdapterStart = false) {
    var _a;
    const logPrefix = `[updateDataGeneric]: [${endpoint}]: `;
    try {
      if (this.connected && ((_a = this.omvApi) == null ? void 0 : _a.isConnected)) {
        if (this.config[`${endpoint}Enabled`]) {
          if (isAdapterStart) {
            await this.createOrUpdateChannel(treeType.idChannel, channelName, void 0, true);
          }
          const data = await this.omvApi.retrievData(endpoint);
          if (data) {
            if (Array.isArray(data)) {
              for (let device of data) {
                if (propertyDeviceId && device[propertyDeviceId]) {
                  const idDevice = `${treeType.idChannel}.${device[propertyDeviceId]}`;
                  await this.createOrUpdateDevice(idDevice, deviceName && device[deviceName] ? device[deviceName] : "unknown", void 0, void 0, void 0, isAdapterStart, true);
                  await this.createOrUpdateGenericState(idDevice, treeType.get(), device, this.config[`${endpoint}StatesBlackList`], this.config[`${endpoint}StatesIsWhiteList`], device, device, isAdapterStart);
                  this.log.debug(`${logPrefix} device '${device[propertyDeviceId]}' data successfully updated`);
                } else {
                  this.log.error(`${logPrefix} deviceName property '${propertyDeviceId}' not exists in device`);
                }
              }
            } else {
              await this.createOrUpdateGenericState(treeType.idChannel, treeType.get(), data, this.config[`${endpoint}StatesBlackList`], this.config[`${endpoint}StatesIsWhiteList`], data, data, isAdapterStart);
              this.log.debug(`${logPrefix} channel '${channelName}' data successfully updated`);
            }
            if (isAdapterStart) {
              this.log.info(`${logPrefix} data successfully updated`);
            }
          }
        } else {
          if (await this.objectExists(treeType.idChannel)) {
            await this.delObjectAsync(treeType.idChannel, { recursive: true });
            this.log.debug(`${logPrefix} '${treeType.idChannel}' deleted`);
          }
        }
      } else {
        this.log.error(`${logPrefix} no connection to OpenMediaVault!`);
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
  }
  /**
   * create or update a channel object, update will only be done on adapter start
   * @param id 
   * @param name 
   * @param onlineId 
   * @param icon 
   * @param isAdapterStart
   */
  async createOrUpdateChannel(id, name, icon = void 0, isAdapterStart = false) {
    const logPrefix = "[createOrUpdateChannel]:";
    try {
      const i18n = name ? myI18n.getTranslatedObject(name) : name;
      let common = {
        name: name && Object.keys(i18n).length > 1 ? i18n : name,
        icon
      };
      if (!await this.objectExists(id)) {
        this.log.debug(`${logPrefix} creating channel '${id}'`);
        await this.setObjectAsync(id, {
          type: "channel",
          common,
          native: {}
        });
      } else {
        if (isAdapterStart) {
          const obj = await this.getObjectAsync(id);
          if (obj && obj.common) {
            if (!myHelper.isChannelCommonEqual(obj.common, common)) {
              await this.extendObject(id, { common });
              let diff = myHelper.deepDiffBetweenObjects(common, obj.common, this);
              if (diff && diff.icon) diff.icon = import_lodash.default.truncate(diff.icon);
              this.log.debug(`${logPrefix} channel updated '${id}' (updated properties: ${JSON.stringify(diff)})`);
            }
          }
        }
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
  }
  /**
  * create or update a device object, update will only be done on adapter start
  * @param id 
  * @param name 
  * @param onlineId 
  * @param icon 
  * @param isAdapterStart
  */
  async createOrUpdateDevice(id, name, onlineId, errorId = void 0, icon = void 0, isAdapterStart = false, logChanges = true) {
    const logPrefix = "[createOrUpdateDevice]:";
    try {
      const i18n = name ? myI18n.getTranslatedObject(name) : name;
      let common = {
        name: name && Object.keys(i18n).length > 1 ? i18n : name,
        icon
      };
      if (onlineId) {
        common["statusStates"] = {
          onlineId
        };
      }
      if (errorId) {
        common["statusStates"]["errorId"] = errorId;
      }
      if (!await this.objectExists(id)) {
        this.log.debug(`${logPrefix} creating device '${id}'`);
        await this.setObject(id, {
          type: "device",
          common,
          native: {}
        });
      } else {
        if (isAdapterStart) {
          const obj = await this.getObjectAsync(id);
          if (obj && obj.common) {
            if (!myHelper.isDeviceCommonEqual(obj.common, common)) {
              await this.extendObject(id, { common });
              let diff = myHelper.deepDiffBetweenObjects(common, obj.common, this);
              if (diff && diff.icon) diff.icon = import_lodash.default.truncate(diff.icon);
              this.log.debug(`${logPrefix} device updated '${id}' ${logChanges ? `(updated properties: ${JSON.stringify(diff)})` : ""}`);
            }
          }
        }
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
  }
  async createOrUpdateGenericState(channel, treeDefinition, objValues, blacklistFilter, isWhiteList, objDevices, objChannel, isAdapterStart = false, filterId = "", isChannelOnWhitelist = false) {
    var _a, _b, _c, _d, _e;
    const logPrefix = "[createOrUpdateGenericState]:";
    try {
      if (this.connected && ((_a = this.omvApi) == null ? void 0 : _a.isConnected)) {
        for (const key in treeDefinition) {
          let logMsgState = (_c = (_b = `${channel}.${key}`.split(".")) == null ? void 0 : _b.slice(1)) == null ? void 0 : _c.join(".");
          let logDetails = `${(objDevices == null ? void 0 : objDevices.mac) ? `mac: ${objDevices == null ? void 0 : objDevices.mac}` : (objDevices == null ? void 0 : objDevices.ip) ? `ip: ${objDevices == null ? void 0 : objDevices.ip}` : (objDevices == null ? void 0 : objDevices._id) ? `id: ${objDevices == null ? void 0 : objDevices._id}` : ""}`;
          try {
            const valKey = Object.hasOwn(objValues, treeDefinition[key].valFromProperty) && treeDefinition[key].valFromProperty ? treeDefinition[key].valFromProperty : key;
            const cond1 = Object.hasOwn(objValues, valKey) && objValues[valKey] !== void 0 || Object.hasOwn(treeDefinition[key], "id") && !Object.hasOwn(treeDefinition[key], "valFromProperty");
            const cond2 = Object.hasOwn(treeDefinition[key], "iobType") && !Object.hasOwn(treeDefinition[key], "object") && !Object.hasOwn(treeDefinition[key], "array");
            const cond3 = Object.hasOwn(treeDefinition[key], "conditionToCreateState") && treeDefinition[key].conditionToCreateState(objChannel, this) === true || !Object.hasOwn(treeDefinition[key], "conditionToCreateState");
            if (key && cond1 && cond2 && cond3) {
              let stateId = key;
              if (Object.hasOwn(treeDefinition[key], "id")) {
                stateId = treeDefinition[key].id;
              }
              logMsgState = (_e = (_d = `${channel}.${stateId}`.split(".")) == null ? void 0 : _d.slice(1)) == null ? void 0 : _e.join(".");
              if (!isWhiteList && !import_lodash.default.some(blacklistFilter, { id: `${filterId}${stateId}` }) || isWhiteList && import_lodash.default.some(blacklistFilter, { id: `${filterId}${stateId}` }) || isChannelOnWhitelist || Object.hasOwn(treeDefinition[key], "required")) {
                if (!await this.objectExists(`${channel}.${stateId}`)) {
                  this.log.silly(`${logPrefix} ${objDevices == null ? void 0 : objDevices.name} - creating state '${logMsgState}'`);
                  const obj = {
                    type: "state",
                    common: await this.getCommonGenericState(key, treeDefinition, objDevices, logMsgState),
                    native: {}
                  };
                  await this.setObjectAsync(`${channel}.${stateId}`, obj);
                } else {
                  if (isAdapterStart) {
                    const obj = await this.getObjectAsync(`${channel}.${stateId}`);
                    const commonUpdated = await this.getCommonGenericState(key, treeDefinition, objDevices, logMsgState);
                    if (obj && obj.common) {
                      if (!myHelper.isStateCommonEqual(obj.common, commonUpdated)) {
                        await this.extendObject(`${channel}.${stateId}`, { common: commonUpdated });
                        this.log.debug(`${logPrefix} ${objDevices == null ? void 0 : objDevices.name} - updated common properties of state '${logMsgState}' (updated properties: ${JSON.stringify(myHelper.deepDiffBetweenObjects(commonUpdated, obj.common, this))})`);
                      }
                    }
                  }
                }
                if (!this.subscribedList.includes(`${channel}.${stateId}`) && (treeDefinition[key].write && treeDefinition[key].write === true || Object.hasOwn(treeDefinition[key], "subscribeMe"))) {
                  this.log.silly(`${logPrefix} ${objDevices == null ? void 0 : objDevices.name} - subscribing state '${logMsgState}'`);
                  await this.subscribeStatesAsync(`${channel}.${stateId}`);
                  this.subscribedList.push(`${channel}.${stateId}`);
                }
                if (objValues && (Object.hasOwn(objValues, key) || Object.hasOwn(objValues, treeDefinition[key].valFromProperty))) {
                  const val = treeDefinition[key].readVal ? await treeDefinition[key].readVal(objValues[valKey], this, objDevices, `${channel}.${stateId}`) : objValues[valKey];
                  let changedObj = void 0;
                  if (key === "last_seen" || key === "first_seen" || key === "rundate") {
                    changedObj = await this.setStateChangedAsync(`${channel}.${stateId}`, { val, lc: val * 1e3 }, true);
                  } else {
                    changedObj = await this.setStateChangedAsync(`${channel}.${stateId}`, val, true);
                  }
                  if (!isAdapterStart && changedObj && Object.hasOwn(changedObj, "notChanged") && !changedObj.notChanged) {
                    this.log.silly(`${logPrefix} value of state '${logMsgState}' changed to ${val}`);
                  }
                } else {
                  if (!Object.hasOwn(treeDefinition[key], "id")) {
                    this.log.debug(`${logPrefix} ${objDevices == null ? void 0 : objDevices.name} - property '${logMsgState}' not exists in bootstrap values (sometimes this option may first need to be activated / used in the Unifi Network application or will update by an event)`);
                  }
                }
              } else {
                if (await this.objectExists(`${channel}.${stateId}`)) {
                  await this.delObjectAsync(`${channel}.${stateId}`);
                  this.log.info(`${logPrefix} ${logDetails ? `(${logDetails}) ` : ""}state '${channel}.${stateId}' delete, ${isWhiteList ? "it's not on the whitelist" : "it's on the blacklist"}`);
                }
              }
            } else {
              if (Object.hasOwn(treeDefinition[key], "object") && Object.hasOwn(objValues, key)) {
                const idChannelAppendix = Object.hasOwn(treeDefinition[key], "idChannel") ? treeDefinition[key].idChannel : key;
                const idChannel = `${channel}.${idChannelAppendix}`;
                if (!isWhiteList && !import_lodash.default.some(blacklistFilter, { id: `${filterId}${idChannelAppendix}` }) || isWhiteList && import_lodash.default.some(blacklistFilter, (x) => x.id.startsWith(`${filterId}${idChannelAppendix}`)) || Object.hasOwn(treeDefinition[key], "required")) {
                  await this.createOrUpdateChannel(`${idChannel}`, Object.hasOwn(treeDefinition[key], "channelName") ? treeDefinition[key].channelName(objDevices, objChannel, this) : key, Object.hasOwn(treeDefinition[key], "icon") ? treeDefinition[key].icon : void 0, true);
                  await this.createOrUpdateGenericState(`${idChannel}`, treeDefinition[key].object, objValues[key], blacklistFilter, isWhiteList, objDevices, objChannel[key], isAdapterStart, `${filterId}${idChannelAppendix}.`, isWhiteList && import_lodash.default.some(blacklistFilter, { id: `${filterId}${idChannelAppendix}` }));
                } else {
                  if (await this.objectExists(idChannel)) {
                    await this.delObjectAsync(idChannel, { recursive: true });
                    this.log.info(`${logPrefix} ${logDetails ? `(${logDetails}) ` : ""}channel '${idChannel}' delete, ${isWhiteList ? "it's not on the whitelist" : "it's on the blacklist"}`);
                  }
                }
              }
              if (Object.hasOwn(treeDefinition[key], "array") && Object.hasOwn(objValues, key)) {
                if (objValues[key] !== null && objValues[key].length > 0) {
                  const idChannelAppendix = Object.hasOwn(treeDefinition[key], "idChannel") ? treeDefinition[key].idChannel : key;
                  const idChannel = `${channel}.${idChannelAppendix}`;
                  if (!isWhiteList && !import_lodash.default.some(blacklistFilter, { id: `${filterId}${idChannelAppendix}` }) || isWhiteList && import_lodash.default.some(blacklistFilter, (x) => x.id.startsWith(`${filterId}${idChannelAppendix}`)) || Object.hasOwn(treeDefinition[key], "required")) {
                    await this.createOrUpdateChannel(`${idChannel}`, Object.hasOwn(treeDefinition[key], "channelName") ? treeDefinition[key].channelName(objDevices, objChannel, this) : key, Object.hasOwn(treeDefinition[key], "icon") ? treeDefinition[key].icon : void 0, isAdapterStart);
                    const arrayNumberAdd = Object.hasOwn(treeDefinition[key], "arrayStartNumber") ? treeDefinition[key].arrayStartNumber : 0;
                    for (let i = 0; i <= objValues[key].length - 1; i++) {
                      let nr = i + arrayNumberAdd;
                      if (objValues[key][i] !== null && objValues[key][i] !== void 0) {
                        let idChannelArray = myHelper.zeroPad(nr, treeDefinition[key].arrayChannelIdZeroPad || 0);
                        if (Object.hasOwn(treeDefinition[key], "arrayChannelIdFromProperty")) {
                          idChannelArray = treeDefinition[key].arrayChannelIdFromProperty(objChannel[key][i], i, this);
                        } else if (Object.hasOwn(treeDefinition[key], "arrayChannelIdPrefix")) {
                          idChannelArray = treeDefinition[key].arrayChannelIdPrefix + myHelper.zeroPad(nr, treeDefinition[key].arrayChannelIdZeroPad || 0);
                        }
                        if (idChannelArray !== void 0) {
                          await this.createOrUpdateChannel(`${idChannel}.${idChannelArray}`, Object.hasOwn(treeDefinition[key], "arrayChannelNameFromProperty") ? treeDefinition[key].arrayChannelNameFromProperty(objChannel[key][i], this) : treeDefinition[key].arrayChannelNamePrefix + nr || nr.toString(), void 0, true);
                          await this.createOrUpdateGenericState(`${idChannel}.${idChannelArray}`, treeDefinition[key].array, objValues[key][i], blacklistFilter, isWhiteList, objDevices, objChannel[key][i], true, `${filterId}${idChannelAppendix}.`, isWhiteList && import_lodash.default.some(blacklistFilter, { id: `${filterId}${idChannelAppendix}` }));
                        }
                      }
                    }
                  } else {
                    if (await this.objectExists(idChannel)) {
                      await this.delObjectAsync(idChannel, { recursive: true });
                      this.log.info(`${logPrefix} ${logDetails ? `(${logDetails}) ` : ""}channel '${idChannel}' delete, ${isWhiteList ? "it's not on the whitelist" : "it's on the blacklist"}`);
                    }
                  }
                }
              }
            }
          } catch (error) {
            this.log.error(`${logPrefix} [id: ${key}, ${logDetails ? `${logDetails}, ` : ""}key: ${key}] error: ${error}, stack: ${error.stack}, data: ${JSON.stringify(objValues[key])}`);
          }
        }
      }
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
  }
  async getCommonGenericState(id, treeDefinition, objDevices, logMsgState) {
    const logPrefix = "[getCommonGenericState]:";
    try {
      const i18n = myI18n.getTranslatedObject(treeDefinition[id].name || id);
      const name = Object.keys(i18n).length > 1 ? i18n : treeDefinition[id].name || id;
      const common = {
        name,
        type: treeDefinition[id].iobType,
        read: treeDefinition[id].read !== void 0 ? treeDefinition[id].read : true,
        write: treeDefinition[id].write !== void 0 ? treeDefinition[id].write : false,
        role: treeDefinition[id].role ? treeDefinition[id].role : "state"
      };
      if (treeDefinition[id].unit) common.unit = treeDefinition[id].unit;
      if (treeDefinition[id].min || treeDefinition[id].min === 0) common.min = treeDefinition[id].min;
      if (treeDefinition[id].max || treeDefinition[id].max === 0) common.max = treeDefinition[id].max;
      if (treeDefinition[id].step) common.step = treeDefinition[id].step;
      if (treeDefinition[id].expert) common.expert = treeDefinition[id].expert;
      if (treeDefinition[id].def || treeDefinition[id].def === 0 || treeDefinition[id].def === false) common.def = treeDefinition[id].def;
      if (treeDefinition[id].states) {
        common.states = treeDefinition[id].states;
      } else if (Object.hasOwn(treeDefinition[id], "statesFromProperty")) {
        const statesFromProp = myHelper.getAllowedCommonStates(treeDefinition[id].statesFromProperty, objDevices);
        common.states = statesFromProp;
        this.log.debug(`${logPrefix} ${objDevices == null ? void 0 : objDevices.name} - set allowed common.states for '${logMsgState}' (from: ${treeDefinition[id].statesFromProperty})`);
      }
      if (treeDefinition[id].desc) common.desc = treeDefinition[id].desc;
      return common;
    } catch (error) {
      this.log.error(`${logPrefix} error: ${error}, stack: ${error.stack}`);
    }
    return void 0;
  }
  //#endregion
}
if (require.main !== module) {
  module.exports = (options) => new Openmediavault(options);
} else {
  (() => new Openmediavault())();
}
//# sourceMappingURL=main.js.map
