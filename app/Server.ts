import express, { Express } from "express";
import http from "http";
import Route from "./routes";
import { httpErrorHandler, requestErrorHandler } from "./util/ErrorHandler";
import { config } from "./config";
import { OBS, Remote } from "./services";

export default class Server {
	private app: Express;
	private port: number;
	private server: http.Server;
	private obs: OBS;
	private remote: Remote;

	constructor(app: Express, port: number) {
		this.app = app;
		this.port = port;
		this.server = new http.Server();

		// initialize services
		const { obs: obsConfig, remote: remoteConfig } = config;
		this.obs = new OBS(obsConfig, console.log);
		this.remote = new Remote(remoteConfig, console.log);

		// use json middleware
		this.app.use(express.json());

		// route
		this.app.use(Route({ obs: this.obs, remote: this.remote }));

		// use error handlers
		this.app.use(requestErrorHandler);
		this.app.use(httpErrorHandler);
	}
	private listen() {
		return this.app.listen(this.port, async () => {
			console.log(`Server listening on port ${this.port}!`);

			// connect to obs websocket
			try {
				await this.obs.connect();
			} catch (response) {
				console.log(response.error);
			}
		});
	}

	public start() {
		this.server = this.listen();
		this.server.on("error", (error) => {
			console.log(error);
			console.log("Press any key to exit");

			process.stdin.once("data",() => {
				process.exit(1);
			});
		});
	}

	public stop() {
		this.server.close();
	}
}
