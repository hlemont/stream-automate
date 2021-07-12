import { Request, Response, NextFunction } from "express";
import {
	HttpError,
	RequestContext,
	NonHttpError,
	RequestValidationError,
	ResourceDoesNotExistError,
	OBSError,
} from "./Error";

export function httpErrorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) {
	res.status(err.code);
	if (err.code === 500) {
		res.send({ error: "internal server error" });
	} else {
		res.send({ error: err.message });
	}
}

export function requestErrorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) {
	// log events
	if (err.name === "RequestValidationError") {
		console.log(
			`${err.name}<${err.context as RequestContext}>: ${err.message}`
		);
	} else {
		console.log(`${err.name}: ${err.message}`);
	}

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
		if (err.isInternal) {
			next(new HttpError(500, err));
		} else {
			next(new HttpError(400, err));
		}
	} else if (err.name === "OBSError") {
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

export function obsErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
	if(err.name !== "OBSError") 
		next(err);

	// handle user-fault obs errors here
	if(err.message === "requested scene does not exist") {
		next(new ResourceDoesNotExistError(err.message));
	} else {
		next(err);
	}
}