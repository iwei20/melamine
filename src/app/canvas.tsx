"use client"
import { MouseEvent, WheelEvent, useState } from "react";

export default function Canvas() {
    
    enum CanvasMode {
        PATH,
        ERASE
    };

    const [cursorX, setCursorX] = useState(0.0);
    const [cursorY, setCursorY] = useState(0.0);
    const [held, setHeld] = useState(false);
    const [pathPoints, setPathPoints] = useState(Array<Array<[number, number]>>);
    const [mode, setMode] = useState(CanvasMode.PATH);
    const [zoom, setZoom] = useState(1);

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

    function setMousePos(e: MouseEvent) {
        let g = document.getElementsByTagName("g")[0];
        let domToSVG = g.getScreenCTM()?.inverse();
        let point = new DOMPoint(e.pageX, e.pageY).matrixTransform(domToSVG);
        setCursorX(point.x);
        setCursorY(point.y);
    }

    function onMouseDown(e: MouseEvent) {
        setHeld(true);
        CanvasModeImpl[mode].onMouseDown(e);
    }

    function onMouseMove(e: MouseEvent) {
        setMousePos(e);
        if (held) CanvasModeImpl[mode].onMouseMove(e);
    }

    function onMouseUp(e: MouseEvent) {
        setHeld(false);
        CanvasModeImpl[mode].onMouseUp(e);
    }

    function clamp(n: number, min_range: number, max_range: number) {
        return Math.max(min_range, Math.min(n, max_range));
    }

    const SCROLL_MULTIPLIER = 0.001;
    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 5;
    function onWheel(e: WheelEvent) {
        setZoom(clamp(zoom - SCROLL_MULTIPLIER * e.deltaY, MIN_ZOOM, MAX_ZOOM));
    }

    return (
    <svg 
        className="bg-white h-screen w-screen" 
        onMouseMove={onMouseMove} 
        onMouseDown={onMouseDown} 
        onMouseUp={onMouseUp} 
        onWheel={onWheel}
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        xmlns="http://www.w3.org/2000/svg">
        <g transform={`scale(${zoom})`} transform-origin="50% 50%">
            {pathPoints.map((points) => <Path points={points} strokeWidth={1/zoom}/>)}
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

    return <path d={prop.points.map(pointToStr).join(' ')} stroke="black" stroke-width={prop.strokeWidth} fill="transparent" shape-rendering="geometricPrecision"/>
}