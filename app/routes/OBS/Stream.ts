import { Router } from "express";
import ash from "express-async-handler";
import { OBS } from "../../services";
import {
	OBSError,
	RequestContext,
	RequestValidationError,
} from "../../util/Error";

enum Action {
	start = "StartStreaming",
	stop = "StopStreaming",
	toggle = "StartStopStreaming",
}

export default function Route(obs: OBS) {
	const router = Router();

	router
		.route("")
		.get(
			ash(async (req, res) => {
				try {
					await obs.connect();
					const response: any = await obs.websocket.send("GetStreamingStatus");
					obs.handleEvent(
						`Current streaming status: ${JSON.stringify(
							response,
							undefined,
							1
						)}`
					);
					res.json({
						status: response.status,
						streaming: response.streaming,
						recording: response.recording,
						recordingPaused: response.recordingPaused,
						previewOnly: response.previewOnly,
					});
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
				const action: Action | undefined = (<any>Action)[req.body.action];
				if (action === undefined)
					throw new RequestValidationError(
						RequestContext.bodyContent,
						`Unknown action: ${req.body.action}`
					);

				try {
					await obs.websocket.send(action);
					obs.handleEvent(`Stream ${req.body.action}`);
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
