import { Router } from "express";
import ash from "express-async-handler";
import { Remote } from "../../services";
import { RequestContext, RequestValidationError } from "../../util/Error";

export default function Route(remote: Remote) {
	const router = Router();

	router
		.route("")
		.post(
			ash(async (req, res) => {
				if (!req.is("application/json")) {
					throw new RequestValidationError(
						RequestContext.contentType,
						"Content type should be 'application/json'"
					);
				}
				const { control } = req.body;
				if (!control)
					throw new RequestValidationError(
						RequestContext.bodyFormat,
						"missing request parameter: 'control'"
					);
				try{
					await remote.runControl(control);
				} catch(error) {
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
