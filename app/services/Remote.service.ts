import robotjs from "robotjs";
import {
	RemoteConfig,
	RemoteControlType,
	RemoteControl,
	RemoteMacro,
	remoteControlSchema,
	remoteMacroSchema,
} from "../config";
import {
	ResourceDoesNotExistError,
	RemoteValidationError,
	RemoteExecutionError,
} from "../util/Error";

export default class Remote {
	private macros: { [name: string]: Macro };
	private rawMacros: { [name: string]: RemoteMacro };
	private eventHandler: (message: string) => void;
	readonly allowed: boolean;

	constructor(config: RemoteConfig, eventHandler: (message: string) => void) {
		this.macros = config.macros.reduce(
			(prev, curr) => ({ ...prev, [curr.name]: new Macro(curr.macro, true) }),
			{}
		);
		this.rawMacros = config.macros.reduce(
			(prev, curr) => ({ ...prev, [curr.name]: curr.macro }),
			{}
		);
		this.eventHandler = eventHandler;
		this.allowed = config.allowed;

		robotjs.setKeyboardDelay(1);
	}

	public getMacro(name: string): RemoteMacro {
		if (!(name in this.rawMacros)) {
			throw new ResourceDoesNotExistError("macro does not exist");
		}
		return this.rawMacros[name];
	}

	public getMacros(): { [name: string]: RemoteMacro } {
		return this.rawMacros;
	}

	public handleEvent(message: string) {
		this.eventHandler(message);
	}

	public async runMacro(name: string): Promise<any>;
	public async runMacro(macro: RemoteMacro): Promise<any>;
	public async runMacro(arg: string | RemoteMacro): Promise<any> {
		if (typeof arg === "string") {
			if (!(arg in this.macros)) {
				throw new ResourceDoesNotExistError("macro does not exist");
			}
			this.handleEvent(`Remote Macro: ${arg}`);
			return await this.macros[arg].run();
		} else {
			this.handleEvent(`Remote Macro: ${JSON.stringify(arg, undefined, 1)}`);
			return await new Macro(arg).run();
		}
	}

	public async runControl(control: RemoteControl): Promise<any> {
		this.handleEvent(
			`Remote Control: ${JSON.stringify(control, undefined, 1)}`
		);
		return await new Control(control).run();
	}
}

class Control {
	readonly run: () => Promise<any>;

	constructor(control: RemoteControl, internal?: boolean) {
		const isInternal = internal !== undefined ? internal : false;
		this.run = Control.toFunction(control);
	}

	static validate(control: RemoteControl): boolean {
		const { error } = remoteControlSchema
			.prefs({ errors: { label: "key" } })
			.validate(control);
		return error === undefined;
	}

	static toFunction(
		control: RemoteControl,
		internal?: boolean
	): () => Promise<any> {
		const isInternal = internal !== undefined ? internal : false;

		if (!Control.validate(control)) {
			throw new RemoteValidationError("invalid control");
		}
		if (control.type === RemoteControlType.keyTapping) {
			return function () {
				console.log(control);
				console.log("keytapping");
				return new Promise((resolve, reject) => {
					try {
						if (control.modifiers) {
							robotjs.keyTap(control.key, control.modifiers);
						} else {
							robotjs.keyTap(control.key);
						}
					} catch (error) {
						reject(new RemoteExecutionError(isInternal, error.message));
					}
					resolve(undefined);
				});
			};
		} else if (control.type === RemoteControlType.stringTyping) {
			return function () {
				console.log(control);
				console.log("stringTyping");
				return new Promise((resolve, reject) => {
					try {
						robotjs.typeString(control.string);
					} catch (error) {
						reject(new RemoteExecutionError(isInternal, error.message));
					}
					resolve(undefined);
				});
			};
		} else if (control.type === RemoteControlType.delaying) {
			return function () {
				console.log(control);
				console.log("delaying");
				return new Promise((resolve) => setTimeout(resolve, control.delay));
			};
		} else {
			// will not be executed
			return function () {
				console.log(control);
				console.log("unknown");
				return new Promise((resolve) => resolve(undefined));
			};
		}
	}
}

class Macro {
	readonly run: () => Promise<any>;

	constructor(macro: RemoteMacro, internal?: boolean) {
		const isInternal = internal !== undefined ? internal : false;
		this.run = Macro.toFunction(macro, isInternal);
	}

	static validate(macro: RemoteMacro): boolean {
		const { error } = remoteMacroSchema
			.prefs({ errors: { label: "key" } })
			.validate(macro);
		return error === undefined;
	}

	static toFunction(
		macro: RemoteMacro,
		internal?: boolean
	): () => Promise<any> {
		const isInternal = internal !== undefined ? internal : false;
		if (!Macro.validate(macro)) {
			throw new RemoteValidationError("invalid Macro");
		}

		const functions = macro.map((control) =>
			Control.toFunction(control, isInternal)
		);
		return async function () {
			for (const func of functions) {
				await func();
			}
		};
	}
}
