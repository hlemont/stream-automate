import { OBSConfig } from "../config";
import OBSWebSocket from "obs-websocket-js";

export default class OBS {
	private config: OBSConfig;
	private isConnected: boolean;
	private sceneAliases: { [name: string]: string };
	private reversedSceneAliases: { [alias: string]: string };
	private eventHandler: (message: string) => void;
	public websocket: OBSWebSocket;

	/**
	 * A service object for obs websocket
	 * @param config a config to use in service
	 * @param eventHandler a function to process messages on event
	 */
	constructor(config: OBSConfig, eventHandler: (message: string) => void) {
		this.config = config;
		this.isConnected = false;
		this.sceneAliases = config.sceneAliases.reduce(
			(prev, curr) => ({ ...prev, [curr.alias]: curr.name }),
			{}
		);
		this.reversedSceneAliases = config.sceneAliases.reduce(
			(prev, curr) => ({...prev, [curr.name]: curr.alias}), {}
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

	/**
	 * Connect to obs websocket server 
	 * @returns Promise that resolves when connection established
	 */
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

	/**
	 * Send an event message with eventhandler
	 * @param message an event message
	 */
	public handleEvent(message: string): void {
		this.eventHandler(message);
	}

	/**
	 * Translate alias to actual scene name
	 * @param alias an alias to translate into scene name
	 * @returns actual scene name
	 */
	public applySceneAlias(alias: string) {
		if (alias in this.sceneAliases) {
			return this.sceneAliases[alias];
		} else {
			return alias;
		}
	}

	/**
	 * Translate name to scene alias
	 * @param name a name to translate into alias
	 * @returns alias
	 */
	public reverseSceneAlias(name: string) {
		if(name in this.reversedSceneAliases) {
			return this.reversedSceneAliases[name]
		} else {
			return name;
		}
	}
}
