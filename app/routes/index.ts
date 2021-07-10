import { NextFunction, Router, Request, Response } from "express";
import { Scene, Stream, Record } from "./OBS";
import { Control, Macro } from "./Remote";
import { OBS, Remote, Service } from "../services";
import { RequestContext, RequestUnauthourizedError, RequestValidationError } from "../util/Error";

export default function Route(services: { obs: OBS; remote: Remote }) {


	const router = Router();

	// initialize OBS routes
	router.use(
		"/obs",
		Router()
			.use("/scene", Scene(services.obs))
			.use("/stream", Stream(services.obs))
			.use("/record", Record(services.obs))
	);

	// initialize Remote routes
	router
			.use(
			"/remote",
			Router()
				.use((_, __, next)=> {
					if (!services.remote.allowed) 
						throw new RequestUnauthourizedError(Service.remote.all, "Remote request unauthorized");
					next();
				})
				.use("/control", Control(services.remote))
				.use("/macro", Macro(services.remote))
		);

	router.all("*", (req, res) => {
		throw new RequestValidationError(RequestContext.url);
	});

	return router;
}