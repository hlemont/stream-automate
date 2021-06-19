import { response, Router } from "express";
import OBSWebSocket from "obs-websocket-js";

export type Config = {
	address: string;
	port: number;
	password: string;
	sceneAlias: { [name: string]: string };
};

export default class OBS {
	private config: Config;
	private isConnected: boolean;
	private obs: OBSWebSocket;
	public sceneRouter: Router;
	public streamRouter: Router;
	public recordRouter: Router;
	public router: Router;

	constructor(config: Config) {
		this.config = config;
		this.isConnected = false;
		this.obs = new OBSWebSocket();
		this.obs.on("ConnectionOpened", () => {
			this.isConnected = true;
			console.log("Server connected to OBS websocket");
		});
		this.obs.on("ConnectionClosed", () => {
			this.isConnected = false;
			console.log("Server disconnected from OBS websocket");
		});

		this.sceneRouter = this.initSceneRouter();
		this.streamRouter = this.initStreamRouter();
		this.recordRouter = this.initRecordRouter();
		this.router = Router();
		this.router.use("/scene", this.sceneRouter);
		this.router.use("/stream", this.streamRouter);
		this.router.use("/record", this.recordRouter);

		console.log(
			`obs.config: ${JSON.stringify(
				{
					...this.config,
					password: [...this.config.password].reduce(
						(prev, curr) => prev + "*",
						""
					),
					sceneAlias: undefined,
				},
				undefined,
				1
			)}`
		);
	}

	public setConfig(newConfig: Config) {
		this.config = newConfig;
	}

	private initSceneRouter() {
		const router = Router();

		router
			.route("")
			.get((req, res): void => {
				this.connect()
					.then(() => {
						return this.obs.send("GetSceneList");
					})
					.then((response) => {
						const names = response.scenes
							.map((scene) => scene.name)
							.map((name) => {
								if (Object.values(this.config.sceneAlias).includes(name)) {
									for (let alias in this.config.sceneAlias) {
										if (name == this.config.sceneAlias[alias]) {
											return alias;
										}
									}
								}
								return name;
							});
						console.log(
							`Successfully got Scene list: ${names.slice(0, 3).join(", ")}`
						);
						res.json({ list: names });
					})
					.catch((response) => {
						console.log(response);
						res.status(500).json({ error: response.error });
					});
			})
			.all((req, res) => {
				res.status(405).send();
			});

		router
			.route("/current")
			.get((req, res): void => {
				this.connect()
					.then(() => {
						return this.obs.send("GetCurrentScene");
					})
					.then((response) => {
						let { name } = response;
						if (Object.values(this.config.sceneAlias).includes(name)) {
							for (let alias in this.config.sceneAlias) {
								if (this.config.sceneAlias[alias] === name) {
									name = alias;
									break;
								}
							}
						}

						console.log(`Current scene is: ${name}`);
						res.json({
							name,
						});
					})
					.catch((response) => {
						console.log(response);
						res.status(500).json({ error: response.error });
					});
			})
			.post((req, res): void => {
				if (!req.is("application/json")) {
					res
						.status(400)
						.json({ error: "Content type should be application/json" });
					return;
				}
				const sceneName =
					req.body.name in this.config.sceneAlias
						? this.config.sceneAlias[req.body.name]
						: req.body.name;

				this.connect()
					.then(() => {
						return this.obs.send("SetCurrentScene", {
							"scene-name": sceneName,
						});
					})
					.then(() => {
						console.log(`Current scene successfully set to: ${sceneName}`);
						res.status(204).send();
					})
					.catch((response) => {
						console.log(response);
						if (response.error === "requested scene does not exist") {
							res.status(404).json({ error: response.error });
						} else {
							res.status(500).json({ error: response.error });
						}
					});
			})
			.all((req, res) => {
				res.status(405).send();
			});

		return router;
	}

	private initStreamRouter() {
		const router = Router();

		router
			.route("")
			.get((req, res) => {
				this.connect()
					.then(() => {
						return this.obs.send("GetStreamingStatus");
					})
					.then((response) => {
						console.log(
							`current streaming status: ${JSON.stringify(
								response,
								undefined,
								1
							)}`
						);
						res.json({ status: response });
					})
					.catch((response) => {
						console.log(response);
						res.json({ error: response.error });
					});
			})
			.post((req, res) => {
				if (!req.is("application/json")) {
					res
						.status(400)
						.json({ error: "Content type should be application/json" });
					return;
				}

				const action: "start" | "stop" | "toggle" = req.body.action;
				const request =
					action === "start"
						? "StartStreaming"
						: action === "stop"
						? "StopStreaming"
						: action === "toggle"
						? "StartStopStreaming"
						: undefined;

				this.connect()
					.then(() => {
						if (request) {
							return this.obs.send(request);
						} else {
							return Promise.reject({ error: `unknown action: ${action}` });
						}
					})
					.then(() => {
						console.log(`Stream [${action}]`);
						res.status(204).send();
					})
					.catch((response) => {
						console.log(response);
						if (response.error === `unknown action: ${action}`) {
							res.status(404).json({ error: response.error });
						} else {
							res.status(500).json({ error: response.error });
						}
					});
			})
			.all((req, res) => {
				res.status(405).send();
			});

		return router;
	}

	private initRecordRouter() {
		const router = Router();

		router
			.route("")
			.post((req, res) => {
				if (!req.is("application/json")) {
					res.status(400).send("bad request");
					return;
				}
				const action: "start" | "stop" | "toggle" = req.body.action;
				const request =
					action === "start"
						? "StartRecording"
						: action === "stop"
						? "StopRecording"
						: action === "toggle"
						? "StartStopRecording"
						: undefined;

				this.connect()
					.then(() => {
						if (request) {
							return this.obs.send(request);
						} else {
							return Promise.reject({ error: `unknown action: ${action}` });
						}
					})
					.then(() => {
						console.log(`Record [${action}]`);
						res.status(204).send();
					})
					.catch((response) => {
						console.log(response);
						if (response.error === `unknown action: ${action}`) {
							res.status(404).json({ error: response.error });
						} else {
							res.status(500).json({ error: response.error });
						}
					});
			})
			.all((req, res) => {
				res.status(405).send();
			});

		return router;
	}

	public connect() {
		return new Promise<boolean>((resolve, reject) => {
			if (this.isConnected) {
				resolve(true);
			} else {
				this.obs
					.connect({
						address: `${this.config.address}:${this.config.port}`,
						password: this.config.password,
					})
					.then(() => {
						resolve(false);
					})
					.catch((response) => {
						reject({ ...response, error: response.error});
					});
			}
		});
	}
}
