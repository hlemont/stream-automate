import { Router } from "express";
import ash from "express-async-handler";
import ObsWebSocket from "obs-websocket-js";
import { OBS } from "../../services";
import {
	RequestValidationError,
	RequestContext,
	OBSError,
} from "../../util/Error";

enum playlistAction {
	next = "NextMedia",
	prev = "PreviousMedia",
}

enum playbackAction {
	play = "PlayPauseMedia",
	pause = "PlayPauseMedia",
	toggle = "PlayPauseMedia",
	stop = "StopMedia",
	seek = "SetMediaTime",
}

function Media(obs: OBS) {
	const router = Router();

	router
		.route("")
		.get(
			ash(async (req, res) => {
				try {
					await obs.connect();
					const { mediaSources } = await obs.websocket.send(
						"GetMediaSourcesList"
					);
					res.json({ sources: mediaSources });
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
		.route("/:sourceName")
		.get(
			ash(async (req, res) => {
				const { sourceName } = req.params;
				try {
					await obs.connect();
					const { mediaState } = await obs.websocket.send("GetMediaState", {
						sourceName,
					});
					const { timestamp: mediaTimestamp } = await obs.websocket.send(
						"GetMediaTime",
						{
							sourceName,
						}
					);
					const { mediaDuration } = await obs.websocket.send(
						"GetMediaDuration",
						{
							sourceName,
						}
					);
					res.json({
						state: mediaState,
						time: mediaTimestamp,
						duration: mediaDuration,
					});
				} catch (responseOrError) {
					if (responseOrError) throw new OBSError(responseOrError.error);
					throw responseOrError;
				}
			})
		)
		.post(
			ash(async (req, res) => {
				if (!req.is("application/json")) {
					throw new RequestValidationError(
						RequestContext.contentType,
						"Content type should be 'application/json'"
					);
				}
				const { sourceName } = req.params;
				const action: playbackAction | playlistAction | undefined =
					(<any>playbackAction)[req.body.action] ||
					(<any>playlistAction)[req.body.action];
				let args: {
					sourceName: string;
					timestamp?: number;
					playPause?: boolean;
				} = { sourceName };

				if (req.body.action === playbackAction.seek) {
					if (req.body.timestamp === undefined)
						throw new RequestValidationError(
							RequestContext.bodyFormat,
							"Missing request parameters: 'timestamp'"
						);
					args.timestamp = parseInt(req.body.timestamp);
				} else if (
					req.body.action === playbackAction.play ||
					req.body.action === playbackAction.pause
				) {
					// false when play, true when pause
					args.playPause = req.body.action === playbackAction.pause;
				}

				if (action === undefined)
					throw new RequestValidationError(
						RequestContext.bodyContent,
						`Unknown action: '${req.body.action}`
					);

				try {
					await obs.connect();
					await obs.websocket.send(action, args);
					res.status(204).send();
				} catch (responseOrError) {
					if (responseOrError) throw new OBSError(responseOrError.error);
					throw responseOrError;
				}
			})
		)
		.all((req, res) => {
			throw new RequestValidationError(RequestContext.method);
		});

	return router;
}

function General(obs: OBS) {
	const router = Router();

	router.route("").get(
		ash(async (req, res) => {
			const { type } = req.query;
			try {
				await obs.connect();
				const { sources } = await obs.websocket.send("GetSourcesList");
				const filtered = sources.filter((value) => {
					return type ? value.type === type : true;
				});
				res.json({ sources: filtered });
			} catch (responseOrError) {
				if (responseOrError.error) throw new OBSError(responseOrError.error);
				throw responseOrError;
			}
		})
	);

	return router;
}

export default function Route(obs: OBS) {
	const router = Router();

	router.use("/general", General(obs));
	router.use("/media", Media(obs));

	return router;
}
