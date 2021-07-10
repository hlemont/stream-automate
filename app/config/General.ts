import Joi from "joi";

export const configSchema = Joi.object()
	.keys({
		serverPort: Joi.number().default(4445),
	})
	.unknown();

export interface Config {
	serverPort: number;
}
