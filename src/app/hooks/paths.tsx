import { RGBColor } from "react-color";
import { useStateRef } from "../usestateref";
import { useMouse } from "./mouse";
import { Intersection } from "../util/intersection";
import { Dispatch, MutableRefObject, SetStateAction, useEffect } from "react";

const MOVE = "M";
const LINE_TO = "L";

export interface PathProps {
    points: Array<[number, number]>
    color: [number, number, number]
    strokeWidth: number
}

export function Path(prop: PathProps) {
    function pointToStr([x, y]: [number, number], index: number) {
        return `${index === 0 ? MOVE : LINE_TO} ${x} ${y}`;
    }

    return <path d={prop.points.map(pointToStr).join(' ')} stroke={`rgb(${prop.color})`} strokeWidth={prop.strokeWidth} fill="transparent" shapeRendering="geometricPrecision"/>
}

export interface PathData {
    points: Array<[number, number]>,
    color: [number, number, number],
    strokeWidth: number,
};

const MOUSE_HOOKED_COUNT = 3;
export function usePaths(
    mouseHook: ReturnType<typeof useMouse>,
    selectedStrokeWidth: MutableRefObject<number>, // Ref required because callbacks here are bound
    sketchPickerColor: MutableRefObject<RGBColor>, // Ref required because callbacks here are bound
) {
    // Paths
    const [paths, setPaths] = useStateRef(Array<PathData>());
    const [mouseHooked, setMouseHooked] = useStateRef(0);

    useEffect(() => setMouseHooked(status => status + 1), [mouseHook.rawCursorX.state, mouseHook.rawCursorY.state]);

    const addNew = (paths: PathData[]) => {
        return paths.concat([{
            points: [[mouseHook.cursorX.ref.current, mouseHook.cursorY.ref.current]],
            color: [sketchPickerColor.current.r, sketchPickerColor.current.g, sketchPickerColor.current.b],
            strokeWidth: selectedStrokeWidth.current,
        }])
    };

    const beginPath = () => {
        if (mouseHooked.current > MOUSE_HOOKED_COUNT) {
            setPaths(paths => addNew(paths));
        }
    };
    
    const continuePath = () => {
        setPaths(paths => {
            let tempPathPoints = [...paths];
            tempPathPoints.at(-1)?.points.push([mouseHook.cursorX.ref.current, mouseHook.cursorY.ref.current]);
            return tempPathPoints;
        });
    }

    const removePathsOnCursor = () => {
        setPaths(pathPoints => pathPoints.filter((path) => !Intersection.isIntersecting([mouseHook.cursorX.ref.current, mouseHook.cursorY.ref.current], path.points)));
    };

    return {
        paths: paths,
        beginPath: beginPath,
        continuePath: continuePath,
        removePathsOnCursor: removePathsOnCursor,
        elements: paths.current.map((pathData, index) => <Path key={`path${index}`} color={pathData.color} points={pathData.points} strokeWidth={pathData.strokeWidth}/>),
    };
}