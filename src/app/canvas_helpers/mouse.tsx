import { MouseEvent, useEffect } from "react";
import { useStateRef } from "../usestateref";

export function useMouse() {
    const [rawCursorX, setRawCursorX, rawCursorXState] = useStateRef(0);
    const [rawCursorY, setRawCursorY, rawCursorYState] = useStateRef(0);
    const [cursorX, setCursorX, cursorXState] = useStateRef(0);
    const [cursorY, setCursorY, cursorYState] = useStateRef(0);

    const updateRawMousePos = (e: MouseEvent) => {
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
            setter: setRawCursorX,
            state: rawCursorXState,
        },
        rawCursorY: {
            ref: rawCursorY,
            setter: setRawCursorY,
            state: rawCursorYState,
        },
        cursorX: {
            ref: cursorX,
            setter: setCursorX,
            state: cursorXState,
        },
        cursorY: {
            ref: cursorY,
            setter: setCursorY,
            state: cursorYState
        },
        updateRawMousePos: updateRawMousePos,
        updateMousePos: updateMousePos,
    };
}

const MOUSE_HOOKED_COUNT = 2;
export function useLoadMouseFix(mouseInfo: ReturnType<typeof useMouse>) {
    const [mouseHooked, setMouseHooked] = useStateRef(0);
    const [pathIsQueued, setPathIsQueued] = useStateRef(false);

    useEffect(() => setMouseHooked(status => status + 1), [mouseInfo.rawCursorX.state, mouseInfo.rawCursorY.state]);

    return {
        mouseHooked: {
            ref: mouseHooked,
            setter: setMouseHooked,
        },
        pathIsQueued: {
            ref: pathIsQueued,
            setter: setPathIsQueued,
        },
        MOUSE_HOOKED_COUNT: MOUSE_HOOKED_COUNT, 
    }
}
