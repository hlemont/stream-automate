import express from "express";
import process from "process";
import { loadConfig } from "./app/config";
import Server from "./app/Server";
import readline from "readline";

const rl = readline.createInterface(process.stdin);
const app = express();
let server: Server;

process.title = "StreamAutomate";
startServer();

rl.on("line", (input) => {
	const _input = input.trim();
	if (_input === "restart") {
		console.log("server is rebooting...");
		server.stop();
		startServer();
	} else if (_input === "stop") {
		console.log("server is closing...");
		server.stop();
		console.log("press enter to exit");
		rl.once("line", () => process.exit(0));
	}
});

function startServer() {
	try {
		// load config
		const config = loadConfig();
		console.log(
			JSON.stringify(
				{
					...config,
					obs: {
						...config.obs,
						password: [...config.obs.password].map(() => "*").join(""),
					},
				},
				undefined,
				1
			)
		);

		// initialize and start server
		server = new Server(app, config.general.serverPort);
		server.start();
	} catch (error) {
		console.log(`failed to start server: ${error.name}: ${error.message}`);
		console.log("press enter to exit");
		rl.once("line", () => process.exit(0));
	}
}
