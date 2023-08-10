import { Dispatch, RefObject, SetStateAction, useEffect, useState } from "react";

export function useMouseOverHide(rawCursorX: number, rawCursorY: number, elementRef: RefObject<HTMLElement>, setVisible: Dispatch<SetStateAction<boolean>>) {
    useEffect(() => {
        if (elementRef.current !== null) {
            if (
                rawCursorX >= elementRef.current.offsetLeft && 
                rawCursorX <= elementRef.current.offsetLeft + elementRef.current.offsetWidth &&
                rawCursorY >= elementRef.current.offsetTop &&
                rawCursorY <= elementRef.current.offsetTop + elementRef.current.offsetHeight
            ) setVisible(false);
            else setVisible(true);
        }
    }, [rawCursorX, rawCursorY]);
}

export function useMouseOverAndDownHide(rawCursorX: number, rawCursorY: number, elementRef: RefObject<HTMLElement>, setVisible: Dispatch<SetStateAction<boolean>>, isMouseDown: boolean) {
    const [previouslyInBox, setPreviouslyInBox] = useState(false);
    
    useEffect(() => {
        if (elementRef.current !== null) {
            if (
                rawCursorX >= elementRef.current.offsetLeft && 
                rawCursorX <= elementRef.current.offsetLeft + elementRef.current.offsetWidth &&
                rawCursorY >= elementRef.current.offsetTop &&
                rawCursorY <= elementRef.current.offsetTop + elementRef.current.offsetHeight
            ) {
                if (!previouslyInBox && isMouseDown) setVisible(false);
                setPreviouslyInBox(true);
            }
            else {
                setVisible(true);
                setPreviouslyInBox(false);
            }
        }
    }, [rawCursorX, rawCursorY, isMouseDown]);
}