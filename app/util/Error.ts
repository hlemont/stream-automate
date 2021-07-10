import { Service } from "../Services";

export enum RequestContext {
	url,
	method,
	contentType,
	bodyFormat,
	bodyContent,
}

export type NonHttpError =
	| RequestValidationError
	| RequestUnauthourizedError
	| ResourceDoesNotExistError
	| RemoteValidationError
	| RemoteExecutionError
	| OBSError
	| Error;

export class RequestValidationError extends Error {
	public readonly name = "RequestValidationError";
	public readonly context: RequestContext;
	constructor(context: RequestContext, message?: string) {
		super(message);
		this.context = context;
		Object.setPrototypeOf(this, RequestValidationError);
	}
}

export class RequestUnauthourizedError extends Error {
	public readonly name = "RequestUnauthourizedError";
	public readonly service: Service.service;
	constructor(service: Service.service, message?: string) {
		super(message);
		this.service = service;
		Object.setPrototypeOf(this, RequestUnauthourizedError);
	}
}

export class ResourceDoesNotExistError extends Error {
	public readonly name = "ResourceDoesNotExistError";

	constructor(message?: string) {
		super(message);
		Object.setPrototypeOf(this, ResourceDoesNotExistError);
	}
}

export class RemoteValidationError extends Error {
	public readonly name = "RemoteValidationError";

	constructor(message?: string) {
		super(message);
		Object.setPrototypeOf(this, RemoteValidationError);
	}
}

export class RemoteExecutionError extends Error {
	public readonly name = "RemoteExecutionError";
	public readonly isInternal: boolean;

	constructor(isInternal: boolean, message?: string) {
		super(message);
		this.isInternal = isInternal;
		Object.setPrototypeOf(this, RemoteExecutionError);
	}
}

export class OBSError extends Error {
	public readonly name = "OBSError";

	constructor(message?: string) {
		super(message);
		Object.setPrototypeOf(this, OBSError);
	}
}

export class HttpError extends Error {
	public readonly name = "HttpError";
	public readonly code: number;
	public readonly original: NonHttpError;
	constructor(code: number, error: NonHttpError) {
		super(error.message);
		this.original = error;
		this.code = code;
		Object.setPrototypeOf(this, HttpError);
	}
}
