import fs from "fs";
import Joi from "joi";
import { Remote } from "../services";
import {
	Config as GeneralConfig,
	configSchema as generalConfigSchema,
} from "./General";
import { Config as OBSConfig, configSchema as obsConfigSchema } from "./OBS";
import {
	Config as RemoteConfig,
	configSchema as remoteConfigSchema,
} from "./Remote";

export interface Config {
	general: GeneralConfig;
	obs: OBSConfig;
	remote: RemoteConfig;
}

export let config: Config;

function validateConfig(config: any, name: string, schema: Joi.Schema) {
	const { error, value } = schema
		.prefs({ errors: { label: "key" } })
		.validate(config);
	if (error)
		throw new Error(`error on validating '${name}' config: ${error.message}`);
	return value;
}

export function loadConfig() {
	const newConfig = JSON.parse(fs.readFileSync("./config.json", "utf8"));

	const general = validateConfig(
		newConfig.general,
		"general",
		generalConfigSchema
	);
	const obs = validateConfig(newConfig.obs, "obs", obsConfigSchema);
	const remote = validateConfig(newConfig.remote, "remote", remoteConfigSchema);

	config = {
		general,
		obs,
		remote,
	};
	return config;
}

export * as Remote from "./Remote";
export * as OBS from "./OBS";