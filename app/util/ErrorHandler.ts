import { Request, Response, NextFunction } from "express";
import {
	HttpError,
	RequestContext,
	NonHttpError,
	RequestValidationError,
} from "./Error";

export function httpErrorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) {
	res.status(err.code);
	if (err.code === 500) {
		console.log(err.original);
		res.send({ error: "internal server error" });
	} else {
		if (err.original.name === "RequestValidationError") {
			console.log(
				`${err.original.name}<${err.original.context}>: ${err.message}`
			);
		}
		res.send({ error: err.message });
	}
}

export function requestErrorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) {
	console.log(`${err.name}: ${err.message}`);
	if (err.name === "RequestValidationError") {
		if (err.context === RequestContext.url) {
			next(new HttpError(404, err));
		} else if (err.context === RequestContext.method) {
			next(new HttpError(405, err));
		} else if (
			err.context === RequestContext.contentType ||
			err.context === RequestContext.bodyFormat ||
			err.context === RequestContext.bodyContent
		) {
			next(new HttpError(400, err));
		}
	} else if (err.name === "RequestUnauthourizedError") {
		next(new HttpError(401, err));
	} else if (err.name === "ResourceDoesNotExistError") {
		next(new HttpError(404, err));
	} else if (err.name === "RemoteValidationError") {
		next(new HttpError(400, err));
	} else if (err.name === "RemoteExecutionError") {
		if(err.isInternal) {
			next(new HttpError(500, err));
		} else {
			next(new HttpError(400, err));
		}
	} else if (err.name === "OBSError") {
		// handle some user-fault errors here
		next(new HttpError(500, err));
	} else if (err.name === "SyntaxError") {
		next(
			new HttpError(
				400,
				new RequestValidationError(
					RequestContext.bodyFormat,
					"invalid json format"
				)
			)
		);
	} else {
		next(new HttpError(500, err));
	}
}
