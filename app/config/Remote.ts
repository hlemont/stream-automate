import Joi from "joi";

export enum ControlType {
	keyTapping = "key",
	stringTyping = "string",
	delaying = "delay",
}

export const controlSchema = Joi.object().keys({
	type: Joi.string().required().valid(
		ControlType.keyTapping,
		ControlType.stringTyping,
		ControlType.delaying
	),
	modifiers: Joi.any().when("type", {
		is: ControlType.keyTapping,
		then: Joi.array().items(Joi.string()).default([]),
	}),
	key: Joi.string().when("type", {
		is: ControlType.keyTapping,
		then: Joi.required(),
	}),
	string: Joi.string().when("type", {
		is: ControlType.stringTyping,
		then: Joi.required(),
	}),
	delay: Joi.number().when("type", {
		is: ControlType.delaying,
		then: Joi.required(),
	}),
});

export const macroSchema = Joi.array().min(1).items(controlSchema);

export const configSchema = Joi.object().keys({
	allowed: Joi.boolean().required(),
	macros: Joi.array()
		.unique((a, b) => a.name === b.name)
		.items(Joi.object().keys({ name: Joi.string(), macro: macroSchema })),
});

export type Control =
	| {
			type: ControlType.keyTapping;
			key: string;
			modifiers: string[];
	  }
	| {
			type: ControlType.stringTyping;
			string: string;
	  }
	| {
			type: ControlType.delaying;
			delay: number;
	  };

export type Macro = Control[];

export interface Config {
	allowed: boolean;
	macros: {
		name: string;
		macro: Macro;
	}[];
}
