"use client"
import { MouseEvent, KeyboardEvent, WheelEvent, useEffect, useRef } from "react";
import { InputBuilder, InputBindings, InputType, InputTracker } from "./input";
import { useStateRef } from "./usestateref";
import { Chip } from "@mui/material";
import { RGBColor, SketchPicker } from 'react-color';

enum CanvasMode {
    PATH,
    ERASE
};

namespace CanvasMatrix {
    /**
     * Multiplies two matrices.
     * 
     * @param matrixA Left matrix, entries in column-major order, omit last row
     * @param matrixB Right matrix, entries in column-major order, omit last row
     */
    export const matmul = (matrixA: Array<number>, matrixB: Array<number>) => {
        return [
            matrixA[0] * matrixB[0] + matrixA[2] * matrixB[1], 
            matrixA[1] * matrixB[0] + matrixA[3] * matrixB[1], 
            matrixA[0] * matrixB[2] + matrixA[2] * matrixB[3], 
            matrixA[1] * matrixB[2] + matrixA[3] * matrixB[3], 
            matrixA[0] * matrixB[4] + matrixA[2] * matrixB[5] + matrixA[4], 
            matrixA[1] * matrixB[4] + matrixA[3] * matrixB[5] + matrixA[5], 
        ];
    }

    export const matmul_multiple = (...matrices: number[][]): number[] => {
        return matrices.reduceRight(
            (accumulator, current) => matmul(current, accumulator)
        );
    }

    export const scale = (factor: number) => {
        return [factor, 0, 0, factor, 0, 0];
    }

    export const translate = (offsetX: number, offsetY: number) => {
        return [1, 0, 0, 1, offsetX, offsetY];
    }
}

export default function Canvas() {
    // Cursor
    const [rawCursorX, setRawCursorX, rawCursorXState] = useStateRef(0);
    const [rawCursorY, setRawCursorY, rawCursorYState] = useStateRef(0);
    const [cursorX, setCursorX] = useStateRef(0);
    const [cursorY, setCursorY] = useStateRef(0);
    const [mouseHooked, setMouseHooked] = useStateRef(0);
    const [pathIsQueued, setPathIsQueued] = useStateRef(false);
    const MOUSE_HOOKED_COUNT = 2;
    const Mouse = {
        updateRawMousePos: (e: MouseEvent) => {
            setRawCursorX(e.pageX);
            setRawCursorY(e.pageY);
        },
        updateMousePos: () => {
            let g = document.getElementsByTagName("g")[0];
            let domToSVG = g.getScreenCTM()?.inverse();
            let point = new DOMPoint(rawCursorX.current, rawCursorY.current).matrixTransform(domToSVG);
            setCursorX(point.x);
            setCursorY(point.y);
        },
    };
    useEffect(() => setMouseHooked(status => status + 1), [rawCursorXState, rawCursorYState]);

    // Resizing/viewBox
    const [canvasWidth, setCanvasWidth] = useStateRef(0);
    const [canvasHeight, setCanvasHeight] = useStateRef(0);
    useEffect(() => {
        setCanvasWidth(window.innerWidth);
        setCanvasHeight(window.innerHeight);
    });
    
    // Input handling
    const [inputBindings, setInputBindings] = useStateRef(
          InputBindings.new()
                    .registerInputDown({
                        input: InputBuilder.fromMouse(0).build(), 
                        callback: (e: MouseEvent) => CanvasModeImpl[SCROLL_ORDER[modeIndex.current]].onMouseDown(e)
                    })
                    .registerInputMouseMove({
                        input: InputBuilder.fromMouse(0).build(), 
                        callback: (e: MouseEvent) => CanvasModeImpl[SCROLL_ORDER[modeIndex.current]].onMouseMove(e)
                    })
                    .registerInputMouseMove({
                        input: InputBuilder.none(), 
                        callback: (e: MouseEvent) => {
                            Mouse.updateRawMousePos(e);
                            Mouse.updateMousePos();
                        }
                    })
                    .registerInputDown({
                        input: InputBuilder.fromWheel(-1).build(), 
                        callback: (e: WheelEvent) => Transform.scrollZoom(e.deltaY)
                    })
                    .registerInputDown({
                        input: InputBuilder.fromWheel(1).build(), 
                        callback: (e: WheelEvent) => Transform.scrollZoom(e.deltaY)
                    })
                    .registerInputDown({
                        input: InputBuilder.fromKey("ArrowLeft").build(),
                        callback: (e: KeyboardEvent) => Mode.prev()
                    })
                    .registerInputDown({
                        input: InputBuilder.fromKey("ArrowRight").build(),
                        callback: (e: KeyboardEvent) => Mode.next()
                    })
    );
    const [inputTracker, setInputTracker, inputTrackerState] = useStateRef(InputTracker.new());

    // Modes
    const [modeIndex, setModeIndex, modeIndexState] = useStateRef(0);
    const SCROLL_ORDER = [
        CanvasMode.PATH,
        CanvasMode.ERASE,
    ];
    const MODE_STRINGS = [
        "Path",
        "Erase"
    ];
    const Mode = {
        next: () => {
            setModeIndex(modeIndex => {
                let result = modeIndex + 1;
                if (result >= SCROLL_ORDER.length) {
                    result = 0;
                }
                return result;
            });
        },
        prev: () => {
            setModeIndex(modeIndex => {
                let result = modeIndex - 1;
                if (result < 0) {
                    result = SCROLL_ORDER.length - 1;
                }
                return result;
            });
        },
    };

    interface CanvasModeFunctions {
        onMouseDown: (e: MouseEvent) => void;
        onMouseMove: (e: MouseEvent) => void;
        onMouseUp: (e: MouseEvent) => void;
    }

    // A small quirk of JS: the callback stored by inputBinding is not cached, 
    // but rather actively referenced from CanvasModeImpl[mode].method.
    // So no need to rebind on mode switch.
    const CanvasModeImpl = {
        [CanvasMode.PATH]: {
            onMouseDown: (e) => {
                Paths.beginPath();
            },
            onMouseMove: (e) => {
                Paths.continuePath();
            },
            onMouseUp: (e) => {}
        } as CanvasModeFunctions,

        [CanvasMode.ERASE]: {
            onMouseDown: (e) => {},
            onMouseMove: (e) => {
                Intersection.removePathsOnCursor();
            },
            onMouseUp: (e) => {}
        } as CanvasModeFunctions
    };

    // Paths
    interface PathData {
        points: Array<[number, number]>,
        color: [number, number, number],
        strokeWidth: number,
    };
    const [paths, setPaths] = useStateRef(Array<PathData>());
    const [selectedStrokeWidth, setSelectedStrokeWidth] = useStateRef(1);

    const Paths = {
        addNew: (paths: PathData[]) => {
            return paths.concat([{
                points: [[cursorX.current, cursorY.current]],
                color: [sketchPickerColor.current.r, sketchPickerColor.current.g, sketchPickerColor.current.b],
                strokeWidth: selectedStrokeWidth.current,
            }])
        },
        beginPath: () => {
            if (mouseHooked.current > MOUSE_HOOKED_COUNT) {
                setPaths(paths => Paths.addNew(paths));
            } else {
                setPathIsQueued(true);
            }
        },
        continuePath: () => {
            setPaths(paths => {
                let tempPathPoints = [...paths];
                if (pathIsQueued.current && mouseHooked.current > MOUSE_HOOKED_COUNT + 2) {
                    tempPathPoints = Paths.addNew(tempPathPoints);
                    setPathIsQueued(false);
                }
                tempPathPoints.at(-1)?.points.push([cursorX.current, cursorY.current]);
                return tempPathPoints;
            });
        }
    };

    const Intersection = {
        DIST: 20,
        distSquared: (pointA: [number, number], pointB: [number, number]) => {
            const deltaX = pointA[0] - pointB[0];
            const deltaY = pointA[1] - pointB[1];
            return deltaX * deltaX + deltaY * deltaY; 
        },
        withinDistance: (pointA: [number, number], pointB: [number, number], dist: number) => {
            return Intersection.distSquared(pointA, pointB) < dist * dist;
        },
        closestLinePoint: (linePointA: [number, number], linePointB: [number, number], soloPoint: [number, number]): [number, number] => {
            const lineVector = [linePointB[0] - linePointA[0], linePointB[1] - linePointA[1]];
            const pointVector = [soloPoint[0] - linePointA[0], soloPoint[1] - linePointA[1]];
            const dotprod = lineVector[0] * pointVector[0] + lineVector[1] * pointVector[1];
            const lineVectorNorm = lineVector[0] * lineVector[0] + lineVector[1] + lineVector[1];

            if (lineVectorNorm === 0) return linePointA;

            const t = dotprod / lineVectorNorm;
            if (t >= 0 && t <= 1) return [t * lineVector[0] + linePointA[0], t * lineVector[1] + linePointA[1]];
            else if (t < 0) return linePointA;
            else return linePointB;
        },
        isIntersecting: (point: [number, number], path: [number, number][]) => {
            return path.some((pathPoint, index) => {
                if (index + 1 >= path.length) return false;
                const closestPoint = Intersection.closestLinePoint(pathPoint, path[index + 1], point);
                return Intersection.withinDistance(closestPoint, point, Intersection.DIST);
            });
        },
        getIntersectingPaths: (point: [number, number]) => {
            return paths.current.filter((path) => Intersection.isIntersecting(point, path.points));
        },
        removePathsOnCursor: () => {
            setPaths(pathPoints => pathPoints.filter((path) => !Intersection.isIntersecting([cursorX.current, cursorY.current], path.points)));
        }
    };

    // Transformations
    const [zoom, setZoom, zoomState] = useStateRef(1);
    const [transformMatrix, setTransformMatrix] = useStateRef([1, 0, 0, 1, 0, 0]);
    const Transform = {
        SCROLL_MULTIPLIER: 3/2000,
        MIN_ZOOM: 0.1,
        MAX_ZOOM: 5,
        scrollZoom: (scrollAmount: number) => {
            const shouldZoomIn = zoom.current < Transform.MAX_ZOOM && scrollAmount < 0;
            const shouldZoomOut = zoom.current > Transform.MIN_ZOOM && scrollAmount > 0;
            if (shouldZoomIn || shouldZoomOut) {
                let newZoom = Number((zoom.current - Transform.SCROLL_MULTIPLIER * scrollAmount).toFixed(2));
                newZoom = Math.min(newZoom, Transform.MAX_ZOOM);
                newZoom = Math.max(newZoom, Transform.MIN_ZOOM);
                Transform.adjustZoom(newZoom);
            }
        },
        adjustZoom: (newZoom: number) => {
            const scaleFactor = newZoom / zoom.current;
            const moveToOriginMatrix = CanvasMatrix.translate(-rawCursorX.current, -rawCursorY.current);
            const scaleMatrix = CanvasMatrix.scale(scaleFactor);
            const moveBackMatrix = CanvasMatrix.translate(rawCursorX.current, rawCursorY.current);
            setTransformMatrix(transformMatrix => CanvasMatrix.matmul_multiple(
                moveBackMatrix,
                scaleMatrix, 
                moveToOriginMatrix,
                transformMatrix
            ));
            Mouse.updateMousePos();
            setZoom(newZoom);
        },
        reset: () => {
            const identity = [1, 0, 0, 1, 0, 0];
            setTransformMatrix(identity);
        }
    };

    // SVG Focus
    const svgRef = useRef<SVGSVGElement>(null);
    useEffect(() => {
        const whitelistFocusable = [
            ...document.querySelectorAll('input[id^=rc-editable-input]'),
        ];
        let activeIsWhitelisted = document.activeElement === null;
        if (document.activeElement !== null) {
            for (let element of whitelistFocusable) {
                activeIsWhitelisted ||= document.activeElement.isEqualNode(element);
            }
        }
        if (svgRef.current !== null && !activeIsWhitelisted) svgRef.current.focus();
    });

    const [sketchPickerColor, setSketchPickerColor] = useStateRef<RGBColor>({r: 0, g: 0, b: 0, a: 1});
    const modeToMenu = {
        [CanvasMode.PATH]: (<>
            <SketchPicker 
            color={sketchPickerColor.current} 
            onChange={(color) => setSketchPickerColor(color.rgb)} 
            className="select-none absolute m-1 right-0 text-black z-10" 
            disableAlpha={true}
            />
        </>),

        [CanvasMode.ERASE]: (<></>)
    }

    useEffect(() => {
        for (let element of document.querySelectorAll<HTMLElement>('input[id^=rc-editable-input]')) {
            element.style.width = "100%";
        }
    }, []);

    // Element
    return (<>
        <div className="bg-white h-screen w-screen absolute -z-50" />
        {/* Upper left info stub */}
        <div className="absolute m-2 select-none z-10">
            <Chip label={`${Math.round(zoomState * 100)}%`} className="m-1" />
            <Chip label={MODE_STRINGS[modeIndexState]} className="m-1" />
            <Chip label={`${cursorX.current.toFixed(2)} ${cursorY.current.toFixed(2)}`} className="m-1" />
        </div>

        {/* Bar select */}
        {modeToMenu[SCROLL_ORDER[modeIndex.current]]}
        <div
            style={{
                display: inputTrackerState.isHeld(InputBuilder.fromMouse(0).build()) && SCROLL_ORDER[modeIndex.current] === CanvasMode.ERASE ? "" : "none",
                width: `${Intersection.DIST}px`,
                height: `${Intersection.DIST}px`,
                left: `${rawCursorXState - Intersection.DIST / 2}px`,
                top: `${rawCursorYState - Intersection.DIST / 2}px`,
            }}
            className={"absolute rounded-full bg-yellow-500 select-none -z-10"} />

        {/* Main drawing area */}
        <svg 
            className="absolute bg-transparent h-screen w-screen" 
            tabIndex={0}
            ref={svgRef}

            onMouseDown={(e) => {
                e.preventDefault();
                if (svgRef.current !== null) svgRef.current.focus();
                inputBindings.current.onInputDown(e, InputType.MOUSE);
                setInputTracker(inputTracker => inputTracker.withEvent(e, InputType.MOUSE));
            }} 
            onWheel={(e) => {
                inputBindings.current.onInputDown(e, InputType.WHEEL);
            }}
            onKeyDown={(e) => {
                inputBindings.current.onInputDown(e, InputType.KEY);
                setInputTracker(inputTracker => inputTracker.withEvent(e, InputType.KEY));
            }}
            
            onMouseUp={(e) => {
                inputBindings.current.onInputUp(e, InputType.MOUSE);
                setInputTracker(inputTracker => inputTracker.withoutEvent(e, InputType.MOUSE));
            }} 
            onKeyUp={(e) => {
                inputBindings.current.onInputUp(e, InputType.KEY);
                setInputTracker(inputTracker => inputTracker.withoutEvent(e, InputType.KEY));
            }}
            
            onMouseMove={(e) => {
                inputBindings.current.onMouseMove(e, inputTracker.current);
            }}
            onMouseLeave={(e) => {
                inputBindings.current.onInputUp(e, InputType.MOUSE);
                setInputTracker(inputTracker => inputTracker.withoutEvent(e, InputType.MOUSE));
            }}
            onMouseEnter={(e) => {
                setInputTracker(inputTracker => inputTracker.updateMouseEnter(e));
            }}

            viewBox={`0 0 ${canvasWidth.current} ${canvasHeight.current}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <g transform={`matrix(${transformMatrix.current})`} >
                {paths.current.map((pathData, index) => <Path key={`path${index}`} color={pathData.color} points={pathData.points} strokeWidth={pathData.strokeWidth}/>)}
            </g>
        </svg>
    </>);
}

const MOVE = "M";
const LINE_TO = "L";

interface PathProps {
    points: Array<[number, number]>
    color: [number, number, number]
    strokeWidth: number
}

function Path(prop: PathProps) {
    // TODO: do not rebuild whole string on points update
    function pointToStr([x, y]: [number, number], index: number) {
        return `${index === 0 ? MOVE : LINE_TO} ${x} ${y}`;
    }

    return <path d={prop.points.map(pointToStr).join(' ')} stroke={`rgb(${prop.color})`} strokeWidth={prop.strokeWidth} fill="transparent" shapeRendering="geometricPrecision"/>
}