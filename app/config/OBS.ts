import Joi from "joi";

export const configSchema = Joi.object()
	.keys({
		address: Joi.string().default("localhost"),
		port: Joi.number().default(4444),
		password: Joi.string().default(null),
		sceneAliases: Joi.array()
			.unique((a, b) => a.name === b.name || a.alias === b.alias)
			.items(
				Joi.object().keys({
					name: Joi.string().required(),
					alias: Joi.string().required(),
				})
			),
	})
	.unknown();

export interface Config {
	address: string;
	port: number;
	password: string;
	sceneAliases: { name: string; alias: string }[];
}
