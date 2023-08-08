import { Dispatch, KeyboardEvent, MouseEvent, MutableRefObject, SetStateAction, WheelEvent } from "react";
import { useStateRef } from "../usestateref";
import { InputBindings, InputTracker, InputType } from "../input";

export function useCanvasInput(
    inputTracker: InputTracker,
    setInputTracker: Dispatch<SetStateAction<InputTracker>>,
    inputBindings: InputBindings,
    svgRef: MutableRefObject<SVGSVGElement | null>
) {
    const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        if (svgRef.current !== null) svgRef.current.focus();
        inputBindings.onInputDown(e, InputType.MOUSE);
        setInputTracker(inputTracker => inputTracker.withEvent(e, InputType.MOUSE));
    };

    const onWheel = (e: WheelEvent) => {
        inputBindings.onInputDown(e, InputType.WHEEL);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        inputBindings.onInputDown(e, InputType.KEY);
        setInputTracker(inputTracker => inputTracker.withEvent(e, InputType.KEY));
    };
    
    const onMouseUp = (e: MouseEvent) => {
        inputBindings.onInputUp(e, InputType.MOUSE);
        setInputTracker(inputTracker => inputTracker.withoutEvent(e, InputType.MOUSE));
    };

    const onKeyUp = (e: KeyboardEvent) => {
        inputBindings.onInputUp(e, InputType.KEY);
        setInputTracker(inputTracker => inputTracker.withoutEvent(e, InputType.KEY));
    };
    
    const onMouseMove = (e: MouseEvent) => {
        inputBindings.onMouseMove(e, inputTracker);
    };

    const onMouseLeave = (e: MouseEvent) => {
        inputBindings.onInputUp(e, InputType.MOUSE);
        setInputTracker(inputTracker => inputTracker.withoutEvent(e, InputType.MOUSE));
    };

    const onMouseEnter = (e: MouseEvent) => {
        setInputTracker(inputTracker => inputTracker.updateMouseEnter(e));
    };

    return {
        onMouseDown: onMouseDown,
        onWheel: onWheel,
        onKeyDown: onKeyDown,
        onMouseUp: onMouseUp,
        onKeyUp: onKeyUp,
        onMouseMove: onMouseMove,
        onMouseLeave: onMouseLeave,
        onMouseEnter: onMouseEnter,
    }
}