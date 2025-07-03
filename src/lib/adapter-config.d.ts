// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			url: string;
			user: string;
			password: string;
			ignoreSSLCertificate: boolean;

			hwInfoEnabled: boolean;
			hwInfoStatesIsWhiteList: boolean;
			hwInfoStatesBlackList: { id: string }[];

			diskEnabled: boolean;
			diskStatesIsWhiteList: boolean;
			diskStatesBlackList: { id: string }[];

			smartEnabled: boolean;
			smartStatesIsWhiteList: boolean;
			smartStatesBlackList: { id: string }[];

			fileSystemEnabled: boolean;
			fileSystemStatesIsWhiteList: boolean;
			fileSystemStatesBlackList: { id: string }[];

			shareMgmtEnabled: boolean;
			shareMgmtStatesIsWhiteList: boolean;
			shareMgmtStatesBlackList: { id: string }[];
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export { };