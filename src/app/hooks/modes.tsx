import { EraseCursor, EraseCursorProps } from "../components/erase_cursor";
import { PathMenu, PathMenuProps } from "../components/path_menu";

import { MouseEvent, useState } from "react";

export enum CanvasMode {
    PATH,
    ERASE
};

export interface CanvasModeFunctions {
    onMouseDown: (e: MouseEvent) => void;
    onMouseMove: (e: MouseEvent) => void;
    onMouseUp: (e: MouseEvent) => void;
}

interface ModeData {
    mode: CanvasMode,
    display_name: string,
    mode_specific_element: JSX.Element,
}

export interface ModeMenuProps {
    [CanvasMode.PATH]: PathMenuProps;
    [CanvasMode.ERASE]: EraseCursorProps;
}

export function useModes(props: ModeMenuProps) {
    const [modeIndex, setModeIndex] = useState(0);
    const SCROLL_ORDER: ModeData[] = [
        {
            mode: CanvasMode.PATH, 
            display_name: "Path", 
            mode_specific_element: (
                <PathMenu 
                    sketchPickerColor={props[CanvasMode.PATH].sketchPickerColor} 
                    setSketchPickerColor={props[CanvasMode.PATH].setSketchPickerColor} 
                />
            ),
            
        },
        {
            mode: CanvasMode.ERASE, 
            display_name: "Erase", 
            mode_specific_element: (
                <EraseCursor
                    primaryIsHeld={props[CanvasMode.ERASE].primaryIsHeld}
                    diameter={props[CanvasMode.ERASE].diameter}
                    rawCursorX={props[CanvasMode.ERASE].rawCursorX}
                    rawCursorY={props[CanvasMode.ERASE].rawCursorY}
                />
            )
        },
    ];

    const setToNext = () => {
        setModeIndex(modeIndex => {
            let result = modeIndex + 1;
            if (result >= SCROLL_ORDER.length) {
                result = 0;
            }
            return result;
        });
    };

    const setToPrev = () => {
        setModeIndex(modeIndex => {
            let result = modeIndex - 1;
            if (result < 0) {
                result = SCROLL_ORDER.length - 1;
            }
            return result;
        });
    };

    return {
        currModeData: SCROLL_ORDER[modeIndex],
        setToNext: setToNext,
        setToPrev: setToPrev,
    }
}