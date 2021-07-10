import { response, Router } from "express";
import ash from "express-async-handler";
import {OBS} from "../../services";
import {
	OBSError,
	RequestContext,
	RequestValidationError,
} from "../../util/Error";

export default function Route(obs: OBS) {
	const router = Router();

	router
		.route("")
		.get(
			ash(async (req, res) => {
				try {
					await obs.connect();
					const { scenes } = await obs.websocket.send("GetSceneList");
					const names = scenes.map((x) => x.name);
					const aliased = names.map((name) => obs.reverseSceneAlias(name));
					obs.handleEvent(
						`Successfully got Scene list: ${aliased.slice(0, 3).join(", ")}`
					);
					res.json({ list: aliased });
				} catch (responseOrError) {
					if (responseOrError.error) throw new OBSError(responseOrError.error);
					throw responseOrError;
				}
			})
		)
		.all((req, res) => {
			throw new RequestValidationError(RequestContext.method);
		});

	router
		.route("/current")
		.get(
			ash(async (req, res) => {
				try {
					await obs.connect();
					const { name } = await obs.websocket.send("GetCurrentScene");
					const aliased = obs.reverseSceneAlias(name);
					obs.handleEvent(`current scene is: ${aliased}(${name})`);
					res.json({ name: aliased });
				} catch (responseOrError) {
					if (responseOrError.error) throw new OBSError(responseOrError.error);
					throw responseOrError;
				}
			})
		)
		.post(
			ash(async (req, res) => {
				if (!req.is("application/json"))
					throw new RequestValidationError(
						RequestContext.contentType,
						"Content type should be 'application/json'"
					);
				try {
					const name = obs.applySceneAlias(req.body.name);
					await obs.connect();
					await obs.websocket.send("SetCurrentScene", { "scene-name": name });
					obs.handleEvent(`Current scene successfully set to: ${name}`);
					res.status(204).send();
				} catch (responseOrError) {
					if (responseOrError.error) throw new OBSError(responseOrError.error);
					throw responseOrError;
				}
			})
		)
		.all((req, res) => {
			throw new RequestValidationError(RequestContext.method);
		});

	return router;
}
