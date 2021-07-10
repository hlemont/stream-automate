import { OBSConfig } from "../config";
import OBSWebSocket from "obs-websocket-js";

export default class OBS {
	private config: OBSConfig;
	private isConnected: boolean;
	private sceneAliases: { [name: string]: string };
	private reversedSceneAliases: { [alias: string]: string };
	private eventHandler: (message: string) => void;
	public websocket: OBSWebSocket;

	constructor(config: OBSConfig, eventHandler: (message: string) => void) {
		this.config = config;
		this.isConnected = false;
		this.sceneAliases = config.sceneAliases.reduce(
			(prev, curr) => ({ ...prev, [curr.name]: curr.alias }),
			{}
		);
		this.reversedSceneAliases = config.sceneAliases.reduce(
			(prev, curr) => ({...prev, [curr.alias]: curr.name}), {}
		);
		this.eventHandler = eventHandler;
		this.websocket = new OBSWebSocket();

		this.addEventHandler();
	}

	private addEventHandler() {
		this.websocket.on("ConnectionOpened", () => {
			this.isConnected = true;
			this.eventHandler(
				`Server connected to OBS websocket: ${this.config.address}:${this.config.port}`
			);
		});
		this.websocket.on("ConnectionClosed", () => {
			this.isConnected = false;
			this.eventHandler(`Server disconnected from OBS websocket: `);
		});
		return;
	}

	public connect() {
		return new Promise<boolean>((resolve, reject) => {
			if (this.isConnected) {
				resolve(true);
			} else {
				this.websocket
					.connect({
						address: `${this.config.address}:${this.config.port}`,
						password: this.config.password,
					})
					.then(() => {
						resolve(false);
					})
					.catch((response) => {
						reject({ ...response, error: response.error });
					});
			}
		});
	}

	public handleEvent(message: string): void {
		this.eventHandler(message);
	}

	public applySceneAlias(name: string) {
		if (name in this.sceneAliases) {
			return this.sceneAliases[name];
		} else {
			return name;
		}
	}

	public reverseSceneAlias(alias: string) {
		if(alias in this.reversedSceneAliases) {
			return this.reversedSceneAliases[alias]
		} else {
			return alias;
		}
	}
}
