"use client"
import { MouseEvent, KeyboardEvent, WheelEvent, useEffect, useRef } from "react";
import { InputBuilder, InputBindings, InputType, InputTracker } from "./input";
import { useStateRef } from "./usestateref";

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
    const [rawCursorX, setRawCursorX] = useStateRef(0);
    const [rawCursorY, setRawCursorY] = useStateRef(0);
    const [cursorX, setCursorX] = useStateRef(0);
    const [cursorY, setCursorY] = useStateRef(0);
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
    const [inputTracker, setInputTracker] = useStateRef(InputTracker.new());

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
    const [pathPoints, setPathPoints] = useStateRef(Array<Array<[number, number]>>());
    const Paths = {
        beginPath: () => {
            let pointsArray: Array<[number, number]> = [[cursorX.current, cursorY.current]];
            setPathPoints(pathPoints => pathPoints.concat([pointsArray]));
        },
        continuePath: () => {
            let tempPathPoints = [...pathPoints.current];
            tempPathPoints.at(-1)?.push([cursorX.current, cursorY.current]);
            setPathPoints(tempPathPoints);
        }
    };

    const Intersection = {
        DIST: 5,
        distSquared: (pointA: [number, number], pointB: [number, number]) => {
            let deltaX = pointA[0] - pointB[0];
            let deltaY = pointA[1] - pointB[1];
            return deltaX * deltaX + deltaY * deltaY; 
        },
        withinDistance: (pointA: [number, number], pointB: [number, number], dist: number) => {
            return Intersection.distSquared(pointA, pointB) < dist * dist;
        },
        isIntersecting: (point: [number, number], path: [number, number][]) => {
            return path.some((pathPoint) => Intersection.withinDistance(pathPoint, point, Intersection.DIST));
        },
        getIntersectingPaths: (point: [number, number]) => {
            return pathPoints.current.filter((path) => Intersection.isIntersecting(point, path));
        },
        removePathsOnCursor: () => {
            setPathPoints(pathPoints => pathPoints.filter((path) => !Intersection.isIntersecting([cursorX.current, cursorY.current], path)));
        }
    };

    // Transformations
    const [zoom, setZoom, zoomState] = useStateRef(1);
    const [transformMatrix, setTransformMatrix] = useStateRef([1, 0, 0, 1, 0, 0]);
    const Transform = {
        SCROLL_MULTIPLIER: 3/2000,
        MIN_ZOOM: 0.4,
        MAX_ZOOM: 5,
        scrollZoom: (scrollAmount: number) => {
            let shouldZoomIn = zoom.current < Transform.MAX_ZOOM && scrollAmount < 0;
            let shouldZoomOut = zoom.current > Transform.MIN_ZOOM && scrollAmount > 0;
            if (shouldZoomIn || shouldZoomOut) {
                let newZoom = Number((zoom.current - Transform.SCROLL_MULTIPLIER * scrollAmount).toFixed(2));
                newZoom = Math.min(newZoom, Transform.MAX_ZOOM);
                newZoom = Math.max(newZoom, Transform.MIN_ZOOM);
                Transform.adjustZoom(newZoom);
            }
        },
        adjustZoom: (newZoom: number) => {
            let scaleFactor = newZoom / zoom.current;
            let moveToOriginMatrix = CanvasMatrix.translate(-rawCursorX.current, -rawCursorY.current);
            let scaleMatrix = CanvasMatrix.scale(scaleFactor);
            let moveBackMatrix = CanvasMatrix.translate(rawCursorX.current, rawCursorY.current);
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
            let identity = [1, 0, 0, 1, 0, 0];
            setTransformMatrix(identity);
        }
    };

    // SVG Focus
    const svgRef = useRef<SVGSVGElement>(null);
    useEffect(() => {
        if (svgRef.current !== null) svgRef.current.focus();
    });

    // Element
    return (<>
        <div className="absolute m-2">
            <text className="text-black m-2">{`${Math.round(zoomState * 100)}%`}</text>
            <text className="text-black m-2">{MODE_STRINGS[modeIndexState]}</text>
            <text className="text-black m-2">{`${cursorX.current.toFixed(2)} ${cursorY.current.toFixed(2)}`}</text>
        </div>
        <svg 
            className="bg-white h-screen w-screen" 
            tabIndex={0}
            ref={svgRef}

            onMouseDown={(e) => {
                e.preventDefault();
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
                {pathPoints.current.map((points, index) => <Path key={`path${index}`} points={points} strokeWidth={1/zoom.current}/>)}
            </g>
        </svg>
    </>);
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