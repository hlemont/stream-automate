import fs from "fs";
import Joi from "joi";
import {
	Config as GeneralConfig,
	configSchema as generalConfigSchema,
} from "./General";
import { Config as OBSConfig, configSchema as obsConfigSchema } from "./OBS";
import {
	Config as RemoteConfig,
	configSchema as remoteConfigSchema,
} from "./Remote";

interface Config {
	general: GeneralConfig;
	obs: OBSConfig;
	remote: RemoteConfig;
}

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

export let config: Config;
export { Config as OBSConfig } from "./OBS";
export {
	Config as RemoteConfig,
	ControlType as RemoteControlType,
	Control as RemoteControl,
	Macro as RemoteMacro,
	controlSchema as remoteControlSchema,
	macroSchema as remoteMacroSchema,
} from "./Remote";
