"use client"

import { InputBuilder, InputBindings, InputType, InputTracker } from "./input";
import { useMouse } from "./hooks/mouse";
import { CanvasMode, CanvasModeFunctions, useModes } from "./hooks/modes";
import { useStateRef } from "./usestateref";

import { MouseEvent, KeyboardEvent, WheelEvent, useEffect, useRef } from "react";
import { RGBColor } from 'react-color';
import { usePaths } from "./hooks/paths";
import { Intersection } from "./util/intersection";
import { useWindowSize } from "./hooks/window_size";
import { useTransform } from "./hooks/transformations";
import { useFocus } from "./hooks/focus";
import { Background } from "./components/background";
import { InfoBar } from "./components/info_bar";
import { useCanvasInput } from "./hooks/canvas_input";

export default function Canvas() {
    const [selectedStrokeWidth, setSelectedStrokeWidth, strokeWidthState] = useStateRef(1);
    const [sketchPickerColor, setSketchPickerColor, sketchPickerColorState] = useStateRef<RGBColor>({r: 0, g: 0, b: 0, a: 1});
    const [inputTracker, setInputTracker, inputTrackerState] = useStateRef(InputTracker.new());

    const { windowWidth, windowHeight } = useWindowSize();
    const mouseHook = useMouse();
    const transformHook = useTransform(mouseHook);
    const pathsHook = usePaths(
        mouseHook,
        selectedStrokeWidth,
        sketchPickerColor,
    );
    const svgRef = useFocus();

    const modesHook = useModes({
        [CanvasMode.PATH]: {
            sketchPickerColor: sketchPickerColorState, 
            setSketchPickerColor: setSketchPickerColor,
        },
        [CanvasMode.ERASE]: {
            primaryIsHeld: inputTrackerState.isHeld(InputBuilder.fromMouse(0).build()),
            diameter: Intersection.DIST,
            rawCursorX: mouseHook.rawCursorX.state,
            rawCursorY: mouseHook.rawCursorY.state,
        },
    });
    const CanvasModeImpl = {
        [CanvasMode.PATH]: {
            onMouseDown: (e) => {
                pathsHook.beginPath();
            },
            onMouseMove: (e) => {
                pathsHook.continuePath();
            },
            onMouseUp: (e) => {}
        } as CanvasModeFunctions,

        [CanvasMode.ERASE]: {
            onMouseDown: (e) => {},
            onMouseMove: (e) => {
                pathsHook.removePathsOnCursor();
            },
            onMouseUp: (e) => {}
        } as CanvasModeFunctions
    };

    const [inputBindings, setInputBindings, inputBindingsState] = useStateRef(
        InputBindings.new()
                .registerInputMouseMove({
                    input: InputBuilder.none(), 
                    callback: (e: MouseEvent) => {
                        mouseHook.updateRawMousePos(e);
                        mouseHook.updateMousePos();
                    }
                })
                .registerInputDown({
                    input: InputBuilder.fromWheel(-1).build(), 
                    callback: (e: WheelEvent) => transformHook.scrollZoom(e.deltaY)
                })
                .registerInputDown({
                    input: InputBuilder.fromWheel(1).build(), 
                    callback: (e: WheelEvent) => transformHook.scrollZoom(e.deltaY)
                })
                .registerInputDown({
                    input: InputBuilder.fromKey("ArrowLeft").build(),
                    callback: (e: KeyboardEvent) => modesHook.setToNext()
                })
                .registerInputDown({
                    input: InputBuilder.fromKey("ArrowRight").build(),
                    callback: (e: KeyboardEvent) => modesHook.setToPrev()
                })
    );

    useEffect(() => 
        setInputBindings(inputBindings => 
            inputBindings.registerInputDown({
                input: InputBuilder.fromMouse(0).build(), 
                callback: (e: MouseEvent) => CanvasModeImpl[modesHook.currModeData.mode].onMouseDown(e)
            })
            .registerInputMouseMove({
                input: InputBuilder.fromMouse(0).build(), 
                callback: (e: MouseEvent) => CanvasModeImpl[modesHook.currModeData.mode].onMouseMove(e)
            })
        )
    , [modesHook.currModeData.mode]);

    const canvasInputHook = useCanvasInput(
        inputTrackerState,
        setInputTracker,
        inputBindingsState,
        svgRef,
    );

    // Element
    return (<>
        <Background />
        <InfoBar 
            zoom={transformHook.zoom.state} 
            modeName={modesHook.currModeData.display_name} 
            cursorX={mouseHook.cursorX.state}
            cursorY={mouseHook.cursorY.state}
        />

        {modesHook.currModeData.mode_specific_element}
        
        <svg 
            className="absolute bg-transparent h-screen w-screen" 
            tabIndex={0}
            ref={svgRef}

            onMouseDown={canvasInputHook.onMouseDown} 
            onWheel={canvasInputHook.onWheel}
            onKeyDown={canvasInputHook.onKeyDown}

            onMouseUp={canvasInputHook.onMouseUp} 
            onKeyUp={canvasInputHook.onKeyUp}
            
            onMouseMove={canvasInputHook.onMouseMove}
            onMouseLeave={canvasInputHook.onMouseLeave}
            onMouseEnter={canvasInputHook.onMouseEnter}

            viewBox={`0 0 ${windowWidth} ${windowHeight}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <g transform={`matrix(${transformHook.transformMatrix.state})`} >
                {pathsHook.elements}
            </g>
        </svg>
    </>);
}