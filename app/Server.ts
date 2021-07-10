import express, { Express } from "express";
import Route from "./routes";
import { httpErrorHandler, requestErrorHandler } from "./util/ErrorHandler";
import { config } from "./config";
import { OBS, Remote } from "./services";

export default class Server {
	private app: Express;
	private obs: OBS;
	private remote: Remote;

	constructor(app: Express) {
		this.app = app;

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

	public start(port: number) {
		this.app
			.listen(port, async () => {
				console.log(`Server listening on port ${port}!`);

				// connect to obs websocket
				try {
					await this.obs.connect();
				} catch (response) {
					console.log(response.error);
				}
			})
			.on("error", (error) => {
				console.log(error);
				console.log("Press any key to exit");

				process.stdin.once("data", function () {
					process.exit(1);
				});
			});
	}
}
