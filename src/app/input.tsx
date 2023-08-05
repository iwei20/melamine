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

export const inputFactory = Record({alt: false, meta: false, ctrl: false, shift: false, button: "none"} as Input);

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

function isKeyboardEvent(e: KeyboardEvent | MouseEvent | WheelEvent, inputType: InputType): e is KeyboardEvent {
    return inputType === InputType.KEY;
}

function isMouseEvent(e: KeyboardEvent | MouseEvent | WheelEvent, inputType: InputType): e is MouseEvent {
    return inputType === InputType.MOUSE;
}

function isWheelEvent(e: KeyboardEvent | MouseEvent | WheelEvent, inputType: InputType): e is WheelEvent {
    return inputType === InputType.WHEEL;
}

export class InputBindings {
    // NOTE: Custom immutable.js value-equality is provided only by immutable.js Maps
    readonly inputToDown: Map<Record<Input>, InputCallback>;
    readonly inputToMouseMove: Map<Record<Input>, (e: MouseEvent) => void>;
    readonly inputToUp: Map<Record<Input>, InputCallback>;

    private constructor(
        inputToDown: Map<Record<Input>, InputCallback>, 
        inputToMouseMove: Map<Record<Input>, (e: MouseEvent) => void>, 
        inputToUp: Map<Record<Input>, InputCallback>,
    ) {
        this.inputToDown = inputToDown;
        this.inputToMouseMove = inputToMouseMove;
        this.inputToUp = inputToUp;
    }

    static readonly new = () => {
        return new InputBindings(
            Map<Record<Input>, InputCallback>(),
            Map<Record<Input>, (e: MouseEvent) => void>(),
            Map<Record<Input>, InputCallback>(),
        );
    }

    static readonly from = (
        inputToDown: Map<Record<Input>, InputCallback>, 
        inputToMouseMove: Map<Record<Input>, (e: MouseEvent) => void>, 
        inputToUp: Map<Record<Input>, InputCallback>,
    ) => {
        return new InputBindings(inputToDown, inputToMouseMove, inputToUp);
    }

    readonly registerInputDown = (entry: InputEntry) => {
        return InputBindings.from(
            this.inputToDown.set(inputFactory(entry.input), entry.callback),
            this.inputToMouseMove,
            this.inputToUp,
        );
    }

    readonly registerInputMouseMove = (entry: MouseMoveEntry) => {
        return InputBindings.from(
            this.inputToDown,
            this.inputToMouseMove.set(inputFactory(entry.input), entry.callback),
            this.inputToUp,
        );
    }

    readonly registerInputUp = (entry: InputEntry) => {
        return InputBindings.from(
            this.inputToDown,
            this.inputToMouseMove,
            this.inputToUp.set(inputFactory(entry.input), entry.callback),
        );
    }

    readonly onInputDown = (e: KeyboardEvent | MouseEvent | WheelEvent, inputType: InputType) => {
        if (isKeyboardEvent(e, inputType)) {
            let input = KeyInput.fromEvent(e);
            let inputCallback = this.inputToDown.get(inputFactory(input));
            if (inputCallback !== undefined) (inputCallback as (e: KeyboardEvent) => void).call(null, e);
        } else if (isMouseEvent(e, inputType)) {
            let input = MouseInput.fromEvent(e);
            let inputCallback = this.inputToDown.get(inputFactory(input));
            if (inputCallback !== undefined) (inputCallback as (e: MouseEvent) => void).call(null, e);
        } else if (isWheelEvent(e, inputType)) {
            let input = WheelInput.fromEvent(e);
            let inputCallback = this.inputToDown.get(inputFactory(input));
            if (inputCallback !== undefined) inputCallback.call(null, e);
        }
    }

    readonly onMouseMove = (e: MouseEvent, heldTracker: InputTracker) => {
        for (let heldInput of heldTracker.held) {
            let inputCallback = this.inputToMouseMove.get(heldInput);
            if (inputCallback !== undefined) inputCallback.call(null, e);
        }
    }

    readonly onInputUp = (e: KeyboardEvent | MouseEvent, inputType: InputType) => {
        if (isKeyboardEvent(e, inputType)) {
            let input = KeyInput.fromEvent(e);
            let inputCallback = this.inputToUp.get(inputFactory(input));
            if (inputCallback !== undefined) (inputCallback as (e: KeyboardEvent) => void).call(null, e);
        } else if (isMouseEvent(e, inputType)) {
            let input = MouseInput.fromEvent(e);
            let inputCallback = this.inputToUp.get(inputFactory(input));
            if (inputCallback !== undefined) (inputCallback as (e: MouseEvent) => void).call(null, e);
        } 
    }
}

export class InputTracker {
    readonly held: Set<Record<Input>>;

    private constructor(held: Set<Record<Input>>) {
        this.held = held;
    }

    static new() {
        return new InputTracker(Set<Record<MouseInput | KeyInput>>([inputFactory(InputBuilder.none())]))
    }

    static from(held: Set<Record<Input>>) {
        return new InputTracker(held);
    }

    isHeld(input: Input) {
        return this.held.has(inputFactory(input));
    }

    with(input: Input) {
        return InputTracker.from(this.held.add(inputFactory(input)));
    }

    without(input: Input) {
        return InputTracker.from(this.held.remove(inputFactory(input)));
    }

    withEvent(inputEvent: KeyboardEvent | MouseEvent, inputType: InputType) {
        if (isKeyboardEvent(inputEvent, inputType)) {
            return this.with(KeyInput.fromEvent(inputEvent));
        } else {
            return this.with(MouseInput.fromEvent(inputEvent));
        }
    }

    withoutEvent(inputEvent: KeyboardEvent | MouseEvent, inputType: InputType) {
        if (isKeyboardEvent(inputEvent, inputType)) {
            return this.without(KeyInput.fromEvent(inputEvent));
        } else {
            return this.without(MouseInput.fromEvent(inputEvent));
        }
    }

    updateMouseEnter(inputEvent: MouseEvent) {
        let result: InputTracker = this;
        let buttonCode = inputEvent.buttons;
        for (let i = 0; i < 5; ++i, buttonCode /= 2) {
            let isPressed = buttonCode % 2 === 1;
            if (isPressed) {
                result = result.with({
                    alt: inputEvent.altKey, 
                    meta: inputEvent.metaKey, 
                    ctrl: inputEvent.ctrlKey, 
                    shift: inputEvent.shiftKey, 
                    button: MOUSE_BUTTONS[i]
                });
            } else {
                result = result.without({
                    alt: inputEvent.altKey, 
                    meta: inputEvent.metaKey, 
                    ctrl: inputEvent.ctrlKey, 
                    shift: inputEvent.shiftKey, 
                    button: MOUSE_BUTTONS[i]
                });
            }
        }
        return result;
    }
}