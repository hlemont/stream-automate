import express, { Express, Router } from "express";
import OBS, { Config as OBSConfig } from "./OBS";
import Remote, { Config as RemoteConfig } from "./Remote";
export class Server {
	private app: Express;
	private obs: OBS;
	private remote: Remote;

	constructor(app: Express, config: { obs: OBSConfig; remote: RemoteConfig }) {
		this.app = app;
		this.app.use(express.json());
		const { obs: obsConfig, remote: remoteConfig } = config;

		this.obs = new OBS(obsConfig);
		this.remote = new Remote(remoteConfig);

		this.app.use("/obs", this.obs.router);
		this.app.use("/remote", this.remote.remoteRouter);
	}

	public start(port: number) {
		this.app
			.listen(port, () => {
				console.log(`Server listening on port ${port}!`);
				// connect to obs websocket
				this.obs.connect().catch((response) => console.log(response.error)
			)})
			.on("error", (error) => {
				console.log(error);
				console.log('Press any key to exit');

				process.stdin.once('data', function() {
					process.exit(1);
				});
			});
	}
}
