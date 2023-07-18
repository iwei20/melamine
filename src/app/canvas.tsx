"use client"
import { MouseEvent, WheelEvent, useEffect, useState } from "react";

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

function matmul_multiple(...matrices: number[][]) {
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
    const [rawCursorX, setRawCursorX] = useState(0.0);
    const [rawCursorY, setRawCursorY] = useState(0.0);
    const [cursorX, setCursorX] = useState(0.0);
    const [cursorY, setCursorY] = useState(0.0);
    const [primaryHeld, setPrimaryHeld] = useState(false);

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);

    const [pathPoints, setPathPoints] = useState(Array<Array<[number, number]>>);
    const [mode, setMode] = useState(CanvasMode.PATH);

    const [zoom, setZoom] = useState(1);
    const [transformMatrix, setTransformMatrix] = useState([1, 0, 0, 1, 0, 0]);
    const [lastScroll, setLastScroll] = useState(0);

    const [offsetX, setOffsetX] = useState(0.0);
    const [offsetY, setOffsetY] = useState(0.0);
       
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
                PathHelpers.continuePath();
            },
            onMouseMove: function(e) {
                PathHelpers.beginPath();
            },
            onMouseUp: function(e) {
        
            }
        } as CanvasModeFunctions
    };

    const PathHelpers = {
        beginPath: function() {
            let pointsArray: Array<[number, number]> = [[cursorX, cursorY]];
            setPathPoints(pathPoints.concat([pointsArray]));
        },
        continuePath: function() {
            let tempPathPoints = [...pathPoints];
            tempPathPoints.at(-1)?.push([cursorX, cursorY]);
            setPathPoints(tempPathPoints);
        }
    }

    const SCROLL_MULTIPLIER = 3/2000;
    const MIN_ZOOM = 0.3;
    const MAX_ZOOM = 5;
    function adjustZoom(scrollAmount: number) {
        let shouldZoomIn = zoom < MAX_ZOOM && scrollAmount < 0;
        let shouldZoomOut = zoom > MIN_ZOOM && scrollAmount > 0;
        if (shouldZoomIn || shouldZoomOut) {
            let newZoom = Number((zoom - SCROLL_MULTIPLIER * scrollAmount).toFixed(2));

            let moveToOriginMatrix = translate(-cursorX, -cursorY);
            let scaleMatrix = scale(newZoom / zoom);
            let moveBackMatrix = translate(cursorX, cursorY);
            setTransformMatrix(matmul_multiple(
                moveBackMatrix, 
                scaleMatrix, 
                moveToOriginMatrix,
                transformMatrix
            ));
            setZoom(newZoom);
        }
    }

    function updateRawMousePos(e: MouseEvent) {
        setRawCursorX(e.pageX);
        setRawCursorY(e.pageY);
    }

    function updateMousePos() {
        let g = document.getElementsByTagName("g")[0];
        let domToSVG = g.getScreenCTM()?.inverse();
        let point = new DOMPoint(rawCursorX, rawCursorY).matrixTransform(domToSVG);
        setCursorX(point.x);
        setCursorY(point.y);
    }

    function updatePrimaryHeld(e: MouseEvent) {
        setPrimaryHeld(e.buttons % 2 === 1);
    }

    function onMouseDown(e: MouseEvent) {
        updatePrimaryHeld(e);
        CanvasModeImpl[mode].onMouseDown(e);
    }

    function onMouseMove(e: MouseEvent) {
        updateRawMousePos(e);
        if (primaryHeld) CanvasModeImpl[mode].onMouseMove(e);
    }

    function onMouseUp(e: MouseEvent) {
        updatePrimaryHeld(e);
        CanvasModeImpl[mode].onMouseUp(e);
    }

    function onMouseLeave(e: MouseEvent) {
        onMouseUp(e);
    }

    function onMouseEnter(e: MouseEvent) {
        onMouseDown(e);
    }

    function clamp(n: number, min_range: number, max_range: number) {
        return Math.max(min_range, Math.min(n, max_range));
    }

    function onWheel(e: WheelEvent) {
        adjustZoom(e.deltaY);
    }

    useEffect(() => {
        setCanvasWidth(window.innerWidth);
        setCanvasHeight(window.innerHeight);
    }, []);

    useEffect(() => {
        updateMousePos();
    }, [rawCursorX, rawCursorY]);

    return (
    <svg 
        className="bg-white h-screen w-screen" 
        onMouseMove={onMouseMove} 
        onMouseDown={onMouseDown} 
        onMouseUp={onMouseUp} 
        onMouseLeave={onMouseLeave}
        onMouseEnter={onMouseEnter}
        onWheel={onWheel}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        xmlns="http://www.w3.org/2000/svg">
        <g transform={`matrix(${transformMatrix})`} >
            {pathPoints.map((points, index) => <Path key={`path${index}`} points={points} strokeWidth={1/zoom}/>)}
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