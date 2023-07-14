"use client"
import { MouseEvent, useState, useRef } from "react";

export default function Canvas() {
    const [cursorX, setCursorX] = useState(0.0);
    const [cursorY, setCursorY] = useState(0.0);
    const [held, setHeld] = useState(false);

    // Indices correspond
    const [pathPoints, setPathPoints] = useState(Array<Array<[number, number]>>);

    function setMousePos(e: MouseEvent) {
        setCursorX(e.pageX);
        setCursorY(e.pageY);
    }

    function beginPath() {
        let pointsArray: Array<[number, number]> = [[cursorX, cursorY]];
        setPathPoints(pathPoints.concat([pointsArray]));
    }

    function continuePath() {
        if (held) {
            let tempPathPoints = [...pathPoints];
            tempPathPoints.at(-1)?.push([cursorX, cursorY]);
            setPathPoints(tempPathPoints);
        }
    }

    function onMouseMove(e: MouseEvent) {
        setMousePos(e);
        continuePath();
    }

    function onMouseDown(e: MouseEvent) {
        setHeld(true);
        beginPath();
    }

    function onMouseUp(e: MouseEvent) {
        setHeld(false);
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