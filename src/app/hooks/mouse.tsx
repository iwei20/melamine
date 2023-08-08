import { MouseEvent, useEffect } from "react";
import { useStateRef } from "../usestateref";

export function useMouse() {
    const [rawCursorX, setRawCursorX, rawCursorXState] = useStateRef(0);
    const [rawCursorY, setRawCursorY, rawCursorYState] = useStateRef(0);
    const [cursorX, setCursorX, cursorXState] = useStateRef(0);
    const [cursorY, setCursorY, cursorYState] = useStateRef(0);
    const [rawDeltaX, setRawDeltaX, rawDeltaXState] = useStateRef(0);
    const [rawDeltaY, setRawDeltaY, rawDeltaYState] = useStateRef(0);

    const updateRawMousePos = (e: MouseEvent) => {
        setRawDeltaX(e.pageX - rawCursorX.current);
        setRawDeltaY(e.pageY - rawCursorY.current);
        setRawCursorX(e.pageX);
        setRawCursorY(e.pageY);
    };

    const updateMousePos = () => {
        let g = document.getElementsByTagName("g")[0];
        let domToSVG = g.getScreenCTM()?.inverse();
        let point = new DOMPoint(rawCursorX.current, rawCursorY.current).matrixTransform(domToSVG);
        setCursorX(point.x);
        setCursorY(point.y);
    };

    return {
        rawCursorX: {
            ref: rawCursorX,
            state: rawCursorXState,
        },
        rawCursorY: {
            ref: rawCursorY,
            state: rawCursorYState,
        },
        cursorX: {
            ref: cursorX,
            state: cursorXState,
        },
        cursorY: {
            ref: cursorY,
            state: cursorYState
        },
        rawDeltaX: {
            ref: rawDeltaX,
            state: rawDeltaXState,
        },
        rawDeltaY: {
            ref: rawDeltaY,
            state: rawDeltaYState,
        },
        updateRawMousePos: updateRawMousePos,
        updateMousePos: updateMousePos,
    };
}