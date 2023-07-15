"use client"
import { MouseEvent, useState, useRef } from "react";

export default function Canvas() {
    
    enum CanvasMode {
        PATH,
        ERASE
    };

    interface CanvasModeFunctions {
        onMouseDown: (e: MouseEvent) => void;
        onMouseMove: (e: MouseEvent) => void;
        onMouseUp: (e: MouseEvent) => void;
    }

    const CanvasModeImpl = {
        [CanvasMode.PATH]: {
            onMouseDown: function(e) {
                PathHelpers.continuePath();
            },
            onMouseMove: function(e) {
                PathHelpers.beginPath();
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

    const [cursorX, setCursorX] = useState(0.0);
    const [cursorY, setCursorY] = useState(0.0);
    const [held, setHeld] = useState(false);
    const [pathPoints, setPathPoints] = useState(Array<Array<[number, number]>>);
    const [mode, setMode] = useState(CanvasMode.PATH);

    function setMousePos(e: MouseEvent) {
        setCursorX(e.pageX);
        setCursorY(e.pageY);
    }

    function onMouseMove(e: MouseEvent) {
        setMousePos(e);
        if (held) CanvasModeImpl[mode].onMouseMove(e);
    }

    function onMouseDown(e: MouseEvent) {
        setHeld(true);
        CanvasModeImpl[mode].onMouseDown(e);
    }

    function onMouseUp(e: MouseEvent) {
        setHeld(false);
        CanvasModeImpl[mode].onMouseUp(e);
    }

    return (<svg className="bg-white h-screen w-screen" onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
        {pathPoints.map((points) => <Path points={points}/>)}
    </svg>);
}

const MOVE = "M";
const LINE_TO = "L";

interface PathProps {
    points: Array<[number, number]>
}

function Path(prop: PathProps) {
    // TODO: do not rebuild whole string on points update
    function pointToStr([x, y]: [number, number], index: number) {
        return `${index === 0 ? MOVE : LINE_TO} ${x} ${y}`;
    }

    return <path d={prop.points.map(pointToStr).join(' ')} stroke="black" fill="transparent" />
}