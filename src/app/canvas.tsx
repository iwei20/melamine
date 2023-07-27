"use client"
import { MouseEvent, WheelEvent, useEffect, useState, useRef, useReducer } from "react";
import { InputBuilder, InputState, InputType } from "./input";

enum CanvasMode {
    PATH,
    ERASE
};

/**
 * Multiplies two matrices.
 * 
 * @param matrixA Left matrix, entries in column-major order, omit last row
 * @param matrixB Right matrix, entries in column-major order, omit last row
 */
function matmul(matrixA: Array<number>, matrixB: Array<number>) {
    return [
        matrixA[0] * matrixB[0] + matrixA[2] * matrixB[1], 
        matrixA[1] * matrixB[0] + matrixA[3] * matrixB[1], 
        matrixA[0] * matrixB[2] + matrixA[2] * matrixB[3], 
        matrixA[1] * matrixB[2] + matrixA[3] * matrixB[3], 
        matrixA[0] * matrixB[4] + matrixA[2] * matrixB[5] + matrixA[4], 
        matrixA[1] * matrixB[4] + matrixA[3] * matrixB[5] + matrixA[5], 
    ];
}

function matmul_multiple(...matrices: number[][]): number[] {
    return matrices.reduceRight(
        (accumulator, current) => matmul(current, accumulator)
    );
}

function scale(factor: number) {
    return [factor, 0, 0, factor, 0, 0];
}

function translate(offsetX: number, offsetY: number) {
    return [1, 0, 0, 1, offsetX, offsetY];
}

export default function Canvas() {
    const useStateRef = <T extends unknown>(initialState: T) => {
        const [state, setState] = useState(initialState);
        const ref = useRef(initialState);
      
        useEffect(() => {
            ref.current = state;
        }, [state]);
      
        return [ref, setState, state] as const;
    };

    const [rawCursorX, setRawCursorX, rawCursorXState] = useStateRef(0.0);
    const [rawCursorY, setRawCursorY, rawCursorYState] = useStateRef(0.0);
    const [cursorX, setCursorX] = useStateRef(0.0);
    const [cursorY, setCursorY] = useStateRef(0.0);

    const [canvasWidth, setCanvasWidth] = useStateRef(0);
    const [canvasHeight, setCanvasHeight] = useStateRef(0);

    const [pathPoints, setPathPoints, pathPointsState] = useStateRef(Array<Array<[number, number]>>());
    const [mode, setMode] = useStateRef(CanvasMode.PATH);

    const [zoom, setZoom] = useStateRef(1);
    const [transformMatrix, setTransformMatrix] = useStateRef([1, 0, 0, 1, 0, 0]);
    
    const [inputState, setInputState] = useStateRef(
        InputState.new()
                  .registerInputDown({input: InputBuilder.fromMouse(0).build(), callback: (e: MouseEvent) => CanvasModeImpl[mode.current].onMouseDown(e)})
                  .registerInputMouseMove({input: InputBuilder.fromMouse(0).build(), callback: (e: MouseEvent) => {
                        CanvasModeImpl[mode.current].onMouseMove(e);
                  }})
                  .registerInputMouseMove({input: InputBuilder.none(), callback: (e: MouseEvent) => {
                        MouseHelpers.updateRawMousePos(e);
                  }})
                  .registerInputDown({input: InputBuilder.fromWheel(-1).build(), callback: (e: WheelEvent) => {
                        TransformHelpers.scrollZoom(e.deltaY);
                  }})
                  .registerInputDown({input: InputBuilder.fromWheel(1).build(), callback: (e: WheelEvent) => {
                        TransformHelpers.scrollZoom(e.deltaY);
                  }})
    );

    interface CanvasModeFunctions {
        onMouseDown: (e: MouseEvent) => void;
        onMouseMove: (e: MouseEvent) => void;
        onMouseUp: (e: MouseEvent) => void;
    } 

    const CanvasModeImpl = {
        [CanvasMode.PATH]: {
            onMouseDown: function(e) {
                PathHelpers.beginPath();
            },
            onMouseMove: function(e) {
                PathHelpers.continuePath();
            },
            onMouseUp: function(e) {
        
            }
        } as CanvasModeFunctions,

        [CanvasMode.ERASE]: {
            onMouseDown: function(e) {

            },
            onMouseMove: function(e) {

            },
            onMouseUp: function(e) {
        
            }
        } as CanvasModeFunctions
    };

    const PathHelpers = {
        beginPath: function() {
            let pointsArray: Array<[number, number]> = [[cursorX.current, cursorY.current]];
            setPathPoints(pathPoints.current.concat([pointsArray]));
        },
        continuePath: function() {
            let tempPathPoints = [...pathPoints.current];
            tempPathPoints.at(-1)?.push([cursorX.current, cursorY.current]);
            setPathPoints(tempPathPoints);
        }
    }

    const TransformHelpers = {
        SCROLL_MULTIPLIER: 3/2000,
        MIN_ZOOM: 0.3,
        MAX_ZOOM: 5,
        scrollZoom: function(scrollAmount: number) {
            let shouldZoomIn = zoom.current < this.MAX_ZOOM && scrollAmount < 0;
            let shouldZoomOut = zoom.current > this.MIN_ZOOM && scrollAmount > 0;
            if (shouldZoomIn || shouldZoomOut) {
                let newZoom = Number((zoom.current - this.SCROLL_MULTIPLIER * scrollAmount).toFixed(2));
                this.adjustZoom(newZoom);
            }
        },
        adjustZoom: function(newZoom: number) {
            let moveToOriginMatrix = translate(-cursorX.current, -cursorY.current);
            let scaleMatrix = scale(newZoom / zoom.current);
            let moveBackMatrix = translate(cursorX.current, cursorY.current);
            setTransformMatrix(matmul_multiple(
                moveBackMatrix, 
                scaleMatrix, 
                moveToOriginMatrix,
                transformMatrix.current
            ));
            setZoom(newZoom);
        },
        reset: function() {
            let identity = [1, 0, 0, 1, 0, 0];
            setTransformMatrix(identity);
        }
    }

    const MouseHelpers = {
        updateRawMousePos: function(e: MouseEvent) {
            setRawCursorX(e.pageX);
            setRawCursorY(e.pageY);
        },
        updateMousePos: function() {
            let g = document.getElementsByTagName("g")[0];
            let domToSVG = g.getScreenCTM()?.inverse();
            let point = new DOMPoint(rawCursorX.current, rawCursorY.current).matrixTransform(domToSVG);
            setCursorX(point.x);
            setCursorY(point.y);
        },
    };

    useEffect(() => {
        setCanvasWidth(window.innerWidth);
        setCanvasHeight(window.innerHeight);
    });

    useEffect(() => {
        MouseHelpers.updateMousePos();
    }, [rawCursorXState, rawCursorYState]);

    useEffect(() => {            
        console.log(pathPoints);
    }, [pathPointsState]);

    return (
    <svg 
        className="bg-white h-screen w-screen" 

        onMouseDown={(e) => {setInputState(inputState.current.onInputDown(e, InputType.MOUSE));}} 
        onWheel={(e) => setInputState(inputState.current.onInputDown(e, InputType.WHEEL))}
        onKeyDown={(e) => setInputState(inputState.current.onInputDown(e, InputType.KEY))}
        
        onMouseUp={(e) => setInputState(inputState.current.onInputUp(e, InputType.MOUSE))} 
        onKeyUp={(e) => setInputState(inputState.current.onInputUp(e, InputType.KEY))}
        
        onMouseMove={inputState.current.onMouseMove}

        viewBox={`0 0 ${canvasWidth.current} ${canvasHeight.current}`}
        xmlns="http://www.w3.org/2000/svg"
    >
        <g transform={`matrix(${transformMatrix.current})`} >
            {pathPoints.current.map((points, index) => <Path key={`path${index}`} points={points} strokeWidth={1/zoom.current}/>)}
        </g>
    </svg>
    );
}

const MOVE = "M";
const LINE_TO = "L";

interface PathProps {
    points: Array<[number, number]>
    strokeWidth: number
}

function Path(prop: PathProps) {
    // TODO: do not rebuild whole string on points update
    function pointToStr([x, y]: [number, number], index: number) {
        return `${index === 0 ? MOVE : LINE_TO} ${x} ${y}`;
    }

    return <path d={prop.points.map(pointToStr).join(' ')} stroke="black" strokeWidth={prop.strokeWidth} fill="transparent" shapeRendering="geometricPrecision"/>
}