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
    robotjs.setKeyboardDelay(1);

    console.log(
      `remote.config: ${JSON.stringify(
        { ...this.config, macros: undefined },
        undefined,
        1
      )}`
    );
  }

  public initRemoteRouter() {
    const router = Router();

    
    router
      .route("/control")
      .post((req, res) => {
        if (!req.is("application/json")) {
          res
            .status(400)
            .json({ error: "Content type should be application/json" });
          return;
        }

        if (!this.config.allowed) {
          res.status(401).json({ error: "remote control not allowed" });
          return;
        }


        const control: Control = req.body.control;
        if(!control){
          res.status(400).json({ error: "missing request parameter: control"});
        }

        console.log(`remote control:${JSON.stringify(control, undefined, 1)}`);


        this.runControl(control)
          .then(() => res.status(204).send())
          .catch((error) =>
            (error.split(":")[0].split(" ")[0] === "invalid"
              ? res.status(400)
              : res.status(500)
            ).json({ error })
          );
      })
      .all((req, res) => {
        res.status(405).send();
      });


    router
      .route("/macro")
      .get((req, res) => {
        if (!this.config.allowed) {
          res.status(401).json({ error: "remote control not allowed" });
          return;
        }
        res.json({ macros: this.config.macros });
      })
      .post((req, res) => {
        if (!req.is("application/json")) {
          res
            .status(400)
            .json({ error: "Content type should be application/json" });
          return;
        }

        if (!this.config.allowed) {
          res.status(401).json({ error: "remote control not allowed" });
          return;
        }

        const macro: Control[] = req.body.macro;
        if(!macro){
          res.status(400).json({ error: "missing request parameters: macro"});
        }

        console.log(`remote macro:${JSON.stringify(macro, undefined, 1)}`);


        this.runMacro(macro)
          .then(() => res.status(204).send())
          .catch((error) =>
          (error.split(":")[0].split(" ")[0] === "invalid"
            ? res.status(400)
            : res.status(500)
          ).json({ error })
        );
      })
      .all((req, res) => {
        res.status(405).send();
      });

    router
      .route("/macro/:name")
      .get((req, res) => {
        if (!this.config.allowed) {
          res.status(401).json({ error: "remote control not allowed" });
          return;
        }

        const { name: macroName } = req.params;
        if (macroName in this.config.macros) {
          res.json({
            macro: this.config.macros[macroName],
          });
        } else {
          res.status(404).json({ error: `macro not found: ${macroName}` });
        }
      })
      .post((req, res) => {
        if (!this.config.allowed) {
          res.status(401).json({ error: "remote control not allowed" });
          return;
        }

        const { name: macroName } = req.params;
        if (req.params.name in this.config.macros) {
          const macro = this.config.macros[macroName];
          this.runMacro(macro)
            .then(() => res.status(204).send())
            .catch((error: Error) => res.status(500).json({ error }));
        }
      })
      .all((req, res) => {
        res.status(405).send();
      });

    return router;
  }

  private isValidControl(control: Control) {
    if (control.type === ControlType.keyTapping) {
      return control.key !== undefined && typeof control.key === "string" && control.key !== "";
    } else if (control.type === ControlType.stringTyping) {
      return control.string !== undefined && typeof control.string === "string";
    } else if (control.type === ControlType.delaying) {
      return control.delay !== undefined && !isNaN(control.delay);
    } else return false;
  }

  private isValidMacro(macro: Control[]) {
    if (!Array.isArray(macro)) {
      return false;
    }
    return macro.reduce((prev: boolean, curr: Control) => {
      return prev && this.isValidControl(curr);
    }, true);
  }

  private runMacro(macro: Control[]) {
    if (this.isValidMacro(macro)) {
      return macro.reduce(async (previous: Promise<any>, current) => {
        await previous;
        return this.runControl(current);
      }, Promise.resolve());
    } else {
      return Promise.reject(`invalid macro: ${JSON.stringify(macro)}`);
    }
  }

  private runControl(control: Control) {
    if (!this.isValidControl(control)) {
      return Promise.reject(`invalid control: ${JSON.stringify(control)}`);
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
