export { default as OBS } from "./OBS.service";
export { default as Remote } from "./Remote.service";

export namespace Service{
  export enum obs {
    all = "/obs",
    scene = "/obs/scene",
    stream = "/obs/stream",
    record = "/obs/record",
  }
  export enum remote {
    all = "/remote",
    control = "/remote/control",
    macro = "/remote/macro",
    _mouse = "__remote_mouse",
    _keyboard = "__remote_keyboard"
  }
  export const all = "/";
  export type service = obs | remote;
}