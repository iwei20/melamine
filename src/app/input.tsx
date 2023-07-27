"use client"
import { Map, Record, Set } from "immutable";
import { MouseEvent, WheelEvent, KeyboardEvent } from "react";

export const MOUSE_BUTTONS = Array(5).fill(0).map((_, i) => `Mouse${i + 1}`);
export const WHEEL_DIRECTIONS = ["WheelUp", "WheelInvalid", "WheelDown"];

export interface Input {
    alt: boolean;
    meta: boolean;
    ctrl: boolean;
    shift: boolean;
    button: string;
}
export class InputBuilder {
    buildResult: Input;

    private constructor(buildResult: Input) {
        this.buildResult = buildResult;
    }

    build(): Input {
        return this.buildResult as Input;
    }

    static fromKey(code: string): InputBuilder {
        return new InputBuilder({alt: false, meta: false, ctrl: false, shift: false, button: code});
    }

    static fromMouse(button: number): InputBuilder {
        return new InputBuilder({alt: false, meta: false, ctrl: false, shift: false, button: MOUSE_BUTTONS[button]});
    }

    static fromWheel(deltaSign: number): InputBuilder {
        return new InputBuilder({alt: false, meta: false, ctrl: false, shift: false, button: WHEEL_DIRECTIONS[deltaSign + 1]});
    }

    static none(): Input {
        return {alt: false, meta: false, ctrl: false, shift: false, button: "none"};
    }

    withAlt(hasAlt: boolean) {
        this.buildResult.alt = hasAlt;
        return this;
    }

    withMeta(hasMeta: boolean) {
        this.buildResult.meta = hasMeta;
        return this;
    }

    withCtrl(hasCtrl: boolean) {
        this.buildResult.ctrl = hasCtrl;
        return this;
    }

    withShift(hasShift: boolean) {
        this.buildResult.shift = hasShift;
        return this;
    }
}

export interface MouseInput extends Input {}
namespace MouseInput {
    export function fromEvent(e: MouseEvent): MouseInput {
        return {
            alt: e.altKey,
            meta: e.metaKey,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            button: MOUSE_BUTTONS[e.button]
        };
    }
}

export interface KeyInput extends Input {}
namespace KeyInput {
    export function fromEvent(e: KeyboardEvent) {
        return {
            alt: e.altKey,
            meta: e.metaKey,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            button: e.code
        };
    }
}

export interface WheelInput extends Input {}
namespace WheelInput {
    export function fromEvent(e: WheelEvent) {
        return {
            alt: e.altKey,
            meta: e.metaKey,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            button: WHEEL_DIRECTIONS[Math.sign(e.deltaY) + 1]
        };
    }
}

const factory = Record({alt: false, meta: false, ctrl: false, shift: false, button: "none"} as Input);

export interface MouseEntry {
    input: MouseInput;
    callback: (e: MouseEvent) => void;
}

export interface KeyEntry {
    input: KeyInput;
    callback: (e: KeyboardEvent) => void; 
}

export interface WheelEntry {
    input: WheelInput;
    callback: (e: WheelEvent) => void;
}

export interface MouseMoveEntry {
    input: Input;
    callback: (e: MouseEvent) => void; 
}

export type InputCallback = ((e: KeyboardEvent) => void) | ((e: MouseEvent) => void) | ((e: WheelEvent) => void);
export type InputEntry = MouseEntry | KeyEntry | WheelEntry;
export enum InputType {
    MOUSE,
    KEY,
    WHEEL
}

export class InputState {
    // NOTE: Custom immutable.js value-equality is provided only by immutable.js Maps
    readonly inputToDown: Map<Record<Input>, InputCallback>;
    readonly inputToMouseMove: Map<Record<Input>, (e: MouseEvent) => void>;
    readonly inputToUp: Map<Record<Input>, InputCallback>;
    readonly held: Set<Record<Input>>;

    private constructor  (
        inputToDown: Map<Record<Input>, InputCallback>, 
        inputToMouseMove: Map<Record<Input>, (e: MouseEvent) => void>, 
        inputToUp: Map<Record<Input>, InputCallback>,
        held: Set<Record<MouseInput | KeyInput>>
    ) {
        this.inputToDown = inputToDown;
        this.inputToMouseMove = inputToMouseMove;
        this.inputToUp = inputToUp;
        this.held = held;
    }

    static new() {
        return new InputState(
            Map<Record<Input>, InputCallback>(),
            Map<Record<Input>, (e: MouseEvent) => void>(),
            Map<Record<Input>, InputCallback>(),
            Set<Record<MouseInput | KeyInput>>([factory(InputBuilder.none())])
        );
    }

    static from(
        inputToDown: Map<Record<Input>, InputCallback>, 
        inputToMouseMove: Map<Record<Input>, (e: MouseEvent) => void>, 
        inputToUp: Map<Record<Input>, InputCallback>,
        held: Set<Record<MouseInput | KeyInput>>
    ) {
        return new InputState(inputToDown, inputToMouseMove, inputToUp, held);
    }

    registerInputDown(entry: InputEntry) {
        return InputState.from(
            this.inputToDown.set(factory(entry.input), entry.callback),
            this.inputToMouseMove,
            this.inputToUp,
            this.held
        );
    }

    registerInputMouseMove(entry: MouseMoveEntry) {
        return InputState.from(
            this.inputToDown,
            this.inputToMouseMove.set(factory(entry.input), entry.callback),
            this.inputToUp,
            this.held
        );
    }

    registerInputUp(entry: InputEntry) {
        return InputState.from(
            this.inputToDown,
            this.inputToMouseMove,
            this.inputToUp.set(factory(entry.input), entry.callback),
            this.held
        );
    }

    static isKeyboardEvent(e: KeyboardEvent | MouseEvent | WheelEvent, inputType: InputType): e is KeyboardEvent {
        return inputType === InputType.KEY;
    }

    static isMouseEvent(e: KeyboardEvent | MouseEvent | WheelEvent, inputType: InputType): e is MouseEvent {
        return inputType === InputType.MOUSE;
    }

    static isWheelEvent(e: KeyboardEvent | MouseEvent | WheelEvent, inputType: InputType): e is WheelEvent {
        return inputType === InputType.WHEEL;
    }

    onInputDown(e: KeyboardEvent | MouseEvent | WheelEvent, inputType: InputType, thisContext: any = null) {
        if (InputState.isKeyboardEvent(e, inputType)) {
            let input = KeyInput.fromEvent(e);
            let inputCallback = this.inputToDown.get(factory(input));
            if (inputCallback !== undefined) (inputCallback as (e: KeyboardEvent) => void).call(thisContext, e);
            return InputState.from(
                this.inputToDown,
                this.inputToMouseMove,
                this.inputToUp,
                this.held.add(factory(input))
            );
        } else if (InputState.isMouseEvent(e, inputType)) {
            let input = MouseInput.fromEvent(e);
            let inputCallback = this.inputToDown.get(factory(input));
            if (inputCallback !== undefined) (inputCallback as (e: MouseEvent) => void).call(thisContext, e);
            return InputState.from(
                this.inputToDown,
                this.inputToMouseMove,
                this.inputToUp,
                this.held.add(factory(input))
            );
        } else if (InputState.isWheelEvent(e, inputType)) {
            let input = WheelInput.fromEvent(e);
            let inputCallback = this.inputToDown.get(factory(input));
            if (inputCallback !== undefined) inputCallback.call(thisContext, e);
            return this;
        }
        return this;
    }

    onMouseMove = (e: MouseEvent) => {
        for (let heldInput of this.held) {
            this.inputToMouseMove.get(heldInput)?.call(null, e);
        }
    }

    onInputUp(e: KeyboardEvent | MouseEvent, inputType: InputType) {
        if (InputState.isKeyboardEvent(e, inputType)) {
            let input = KeyInput.fromEvent(e);
            let inputCallback = this.inputToUp.get(factory(input));
            if (inputCallback !== undefined) (inputCallback as (e: KeyboardEvent) => void).call(null, e);
            return InputState.from(
                this.inputToDown,
                this.inputToMouseMove,
                this.inputToUp,
                this.held.remove(factory(input))
            );  
        } else {
            let input = MouseInput.fromEvent(e);
            let inputCallback = this.inputToUp.get(factory(input));
            if (inputCallback !== undefined) (inputCallback as (e: MouseEvent) => void).call(null, e);
            return InputState.from(
                this.inputToDown,
                this.inputToMouseMove,
                this.inputToUp,
                this.held.remove(factory(input))
            );
        } 
    }
}