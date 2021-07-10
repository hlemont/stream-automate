import { Router } from "express";
import ash from "express-async-handler";
import { OBS } from "../../services";
import {
	RequestValidationError,
	RequestContext,
	OBSError,
} from "../../util/Error";

enum Action {
	start = "StartRecording",
	stop = "StopRecording",
	toggle = "StartStopRecording",
}

export default function Route(obs: OBS) {
	const router = Router();

	router
		.route("")
		.post(
			ash(async (req, res) => {
				if (!req.is("application/json"))
					throw new RequestValidationError(
						RequestContext.contentType,
						"Content type should be 'application/json'"
					);

				const action: Action | undefined = (<any>Action)[req.body.action];
				if (action === undefined)
					throw new RequestValidationError(
						RequestContext.bodyContent,
						`Unknown action: '${req.body.action}`
					);

				try {
					await obs.connect();
					await obs.websocket.send(action);
				} catch (responseOrError) {
					if (responseOrError.error) throw new OBSError(responseOrError.error);
					throw responseOrError;
				}

				obs.handleEvent(`Record ${req.body.action}`);
				res.status(204).send();
			})
		)
		.all((req, res) => {
			throw new RequestValidationError(RequestContext.method);
		});

	return router;
}
