// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			url: string;
			user: string;
			password: string;
			ignoreSSLCertificate: boolean;
			updateInterval: number;

			hwInfoEnabled: boolean;
			hwInfoStatesIsWhiteList: boolean;
			hwInfoStatesBlackList: { id: string }[];

			diskEnabled: boolean;
			diskIsWhiteList: boolean;
			diskBlackList: { id: string }[];
			diskStatesIsWhiteList: boolean;
			diskStatesBlackList: { id: string }[];

			smartEnabled: boolean;
			smartIsWhiteList: boolean;
			smartBlackList: { id: string }[];
			smartStatesIsWhiteList: boolean;
			smartStatesBlackList: { id: string }[];

			fileSystemEnabled: boolean;
			fileSystemIsWhiteList: boolean;
			fileSystemBlackList: { id: string }[];
			fileSystemStatesIsWhiteList: boolean;
			fileSystemStatesBlackList: { id: string }[];

			shareMgmtEnabled: boolean;
			shareMgmtIsWhiteList: boolean;
			shareMgmtBlackList: { id: string }[];
			shareMgmtStatesIsWhiteList: boolean;
			shareMgmtStatesBlackList: { id: string }[];

			smbEnabled: boolean;
			smbIsWhiteList: boolean;
			smbBlackList: { id: string }[];
			smbStatesIsWhiteList: boolean;
			smbStatesBlackList: { id: string }[];
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export { };