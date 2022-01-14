import { keyboard, Key } from "@nut-tree/nut-js";
import { build } from "joi";
import { Remote } from "../config";
import {
	ResourceDoesNotExistError,
	RemoteValidationError,
	RemoteExecutionError,
} from "../util/Error";

export default class Service {
	private macros: { [name: string]: {built: Macro, raw: Remote.Macro} };
	private controls: { [name: string]: { built: Control, raw: Remote.Control } };
	private eventHandler: (message: string) => void;
	readonly allowed: boolean;

	/**
	 * A service object for remote(robotjs)
	 * @param config a config to use in service
	 * @param eventHandler a function to process messages on event
	 */
	constructor(config: Remote.Config, eventHandler: (message: string) => void) {
		this.macros = config.macros.reduce(
			(prev, curr) => ({ ...prev, [curr.name]: {built: new Macro(curr.macro), raw: curr.macro}}),
			{}
		);
		// not implemented yet
		this.controls = {}
		this.eventHandler = eventHandler;
		this.allowed = config.allowed;
		keyboard.config.autoDelayMs = 1;
	}

	/**
	 * Get a specific macro added
	 * @param name a name
	 * @returns a macro
	 */
	public getMacro(name: string): Remote.Macro {
		if (!(name in this.macros)) {
			throw new ResourceDoesNotExistError("macro does not exist");
		}
		return this.macros[name].raw;
	}

	/**
	 * Get all loaded macros
	 * @returns a dictionary of all loaded macros
	 */
	public getMacros(): { [name: string]: Remote.Macro } {
		return Object.keys(this.macros).reduce((prev, name) => {
			prev[name] = this.macros[name].raw;
			return prev;
		}, <{[name:string]:Remote.Macro}>{})
	}

	/**
	 * Send an event message with eventhandler
	 * @param message an event message
	 */
	public handleEvent(message: string) {
		this.eventHandler(message);
	}

	/**
	 * Run a macro
	 * @param data a raw object representing the macro to run
	 * @returns Promise
	 */
	public async runMacro(data: Remote.Macro): Promise<any> {
		this.handleEvent(`Remote Macro: ${JSON.stringify(data, undefined, 1)}`);
		const macro = new Macro(data);
		if(macro.run)
			return await macro.run();
	}
	/**
	 * Run a control
	 * @param data a raw object representing the control to run
	 * @returns Promise
	 */
	public async runControl(data: Remote.Control): Promise<any> {
		this.handleEvent(
			`Remote Control: ${JSON.stringify(data, undefined, 1)}`
		);
		const control = new Control(data);
		if (control.run)
			return await control?.run();
	}
}

class Macro {
	private valid: boolean;
	run?: () => Promise<any>

	static validate(macro: any): boolean {
		const { error } = Remote.macroSchema.validate(macro);
		return error === undefined;
	}

	static build(data: Remote.Macro): () => Promise<void> {
		return ((data) => {
			const controls = data.controls.map((control) => Control.build(control));
			return async () => {
				for (const control of controls) {
					if(control)
						await control();
				}
			}
		})(data)
	}

	constructor(data: any) {
		if (!Macro.validate(data)) {
			this.valid = false;
			throw new RemoteValidationError("invalid Macro");
		} else {
			this.valid = true;
			this.run = Macro.build(data as Remote.Macro);
		}
	}
}

class Control {
	private valid: boolean;
	run?: () => Promise<any>

	static validate(control: any): boolean {
		const { error } = Remote.controlSchema.validate(control);
		return error === undefined;
	}

	static build(data: Remote.Control): (() => Promise<any>) | undefined {
		switch (data.type) {
			case Remote.ControlType.keyTapping:
				return ((data) => {
					const modifiers = data.modifiers?.map((modifier) => (<any>Key)[modifier]).filter((value) => value !== undefined);
					const key = (<any>Key)[data.key];
					if(key === undefined) {
						return undefined;
					}
					else if(modifiers) {
						return async () => {
							for (const modifier of modifiers)
								await keyboard.pressKey(modifier);
							await keyboard.type(key);
							for (const modifier of modifiers)
								await keyboard.releaseKey(modifier);
						}
					} else {
						return async () => {
							await keyboard.type(key);
						}
					}
				})(data);
			case Remote.ControlType.stringTyping:
				return async () => {
					await keyboard.type(data.string);
				}
			case Remote.ControlType.delaying:
				return async () => {
					await new Promise(resolve => setTimeout(resolve, data.delay));
				}
			default:
				return undefined;
		}
	}

	constructor(data: any) {
		if (!Control.validate(data)) {
			this.valid = false;
			throw new RemoteValidationError("invalid Macro");
		} else {
			this.valid = true;
			this.run = Control.build(data as Remote.Control);
		}
	}
}