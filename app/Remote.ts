import { Router } from "express";
import robotjs from "robotjs";

export enum ControlType {
	keyTapping = "key",
	stringTyping = "string",
	delaying = "delay",
}

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

export type Config = {
	allowed: boolean;
	macros: {
		[macroName: string]: Control[];
	};
};

export default class Remote {
	private config: Config;
	public remoteRouter: Router;

	constructor(config: Config) {
		this.config = config;
		this.remoteRouter = this.initRemoteRouter();

		console.log(`remote.config: ${JSON.stringify({...this.config, macros: undefined}, undefined, 1)}`)
	}

	public initRemoteRouter() {
		const router = Router();

		router.route("/macro")
		.get((req, res) => {
			if(this.config.allowed){
				res.json({ success: true, macros: this.config.macros });
			} else {
				res.json({ success: false, error: "remote control not allowed"});
			}
		})
		.post((req, res) => {
			if(!req.is("application/json")) {
				res.status(400).send('bad request');
			}

			if(!this.config.allowed){
				res.json({ success: false, error: "remote control not allowed"});
				return;
			}

			const macro: Control[] = req.body;
			this.runMacro(macro)
			.then(() => res.json({ success: true }))
			.catch((error: Error) => res.json({ success: false, error }));
		})

		router
			.route("/macro/:name")
			.get((req, res) => {
				if(!this.config.allowed) {
					res.json({ success: false, error: "remote control not allowed"});
					return;
				}

				const { name: macroName } = req.params;
				if (macroName in this.config.macros) {
					res.json({
						success: true,
						macro: this.config.macros[macroName],
					});
				} else {
					res.json({ success: false, error: `macro not found: ${macroName}` });
				}
			})
			.post((req, res) => {
				if(!this.config.allowed) {
					res.json({ success: false, error: "remote control not allowed"});
					return;
				}

				const { name: macroName } = req.params;
				if (req.params.name in this.config.macros) {
					const macro = this.config.macros[macroName];
					this.runMacro(macro)
						.then(() => res.json({ success: true }))
						.catch((error: Error) => res.json({ success: false, error }));
				}
			});

		router.route("").post((req, res) => {
			if (!req.is("application/json")) {
				res.status(400).send("bad request");
				return;
			}

			if(!this.config.allowed) {
				res.json({ success: false, error: "remote control not allowed"});
				return;	
			}

			console.log(`remote control:${JSON.stringify(req.body, undefined, 1)}`);

			const control: Control = req.body;
			this.runControl(control)
				.then(() => res.json({ success: true }))
				.catch((error: Error) => res.json({ success: false, error }));
		});

		return router;
	}

	private isValidControl(control: Control) {
		if (control.type === ControlType.keyTapping) {
			return control.key !== undefined && control.key !== "";
		} else if (control.type === ControlType.stringTyping) {
			return control.string !== undefined;
		} else if (control.type === ControlType.delaying) {
			return control.delay !== undefined && !isNaN(control.delay);
		} else return false;
	}

	private isValidMacro(macro: Control[]) {
		return macro.reduce((prev: boolean, curr: Control) => {
			return prev && this.isValidControl(curr);
		}, true);
	}

	private runMacro(macro: Control[]) {
		if(this.isValidMacro(macro)) {
			return macro.reduce(async (previous: Promise<any>, current) => {
				await previous;
				return this.runControl(current);
			}, Promise.resolve());
		} else {
			return Promise.reject(`invalid macro: ${macro.map((control) => control.type).join(', ')}, in ${macro.filter((control) => !this.isValidControl(control)).map((control) => control.type).join(', ')}`);
		}


	}

	private runControl(control: Control) {
		if(!this.isValidControl(control)){
			return Promise.reject(`invalid control: ${control}`);
		} else if (control.type === ControlType.keyTapping) {
			return new Promise((resolve) => {
				robotjs.keyTap(control.key, control.modifiers);
				resolve(undefined);
			});
		} else if (control.type === ControlType.stringTyping) {
			return new Promise((resolve) => {
				robotjs.typeString(control.string);
				resolve(undefined);
			});
		} else {
			return new Promise((resolve) => setTimeout(resolve, control.delay));
		}
	}
}
