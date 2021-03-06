import { Router } from "express";
import ash from "express-async-handler";
import { Remote } from "../../services";
import { RequestContext, RequestValidationError } from "../../util/Error";

export default function Route(remote: Remote) {
	const router = Router();

	router
		.route("")
		.get(
			ash(async (req, res) => {
				console.log(remote.getMacros());
				res.json(remote.getMacros());
			})
		)
		.post(
			ash(async (req, res) => {
				if (!req.is("application/json"))
					throw new RequestValidationError(
						RequestContext.contentType,
						"Content type should be 'application/json'"
					);
				const macro = req.body.macro;
				if (macro === undefined)
					throw new RequestValidationError(
						RequestContext.bodyFormat,
						"Missing request parameters: 'macro'"
					);
				try {
					await remote.runMacro(macro);
				} catch (error) {
					throw error;
				}

				res.status(204).send();
			})
		)
		.all((req, res) => {
			throw new RequestValidationError(RequestContext.method);
		});

	router
		.route("/:name")
		.get(
			ash(async (req, res) => {
				const { name } = req.params;
				const macro = remote.getMacro(name);
				res.json({ macro });
			})
		)
		.post(
			ash(async (req, res) => {
				const { name } = req.params;
				try {
					await remote.runMacro(name);
				} catch (error) {
					throw error;
				}

				res.status(204).send();
			})
		)
		.all((req, res) => {
			throw new RequestValidationError(RequestContext.method);
		});

	return router;
}
