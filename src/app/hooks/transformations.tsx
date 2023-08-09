import { useStateRef } from "../usestateref";
import { CanvasMatrix } from "../util/matrix";
import { useMouse } from "./mouse";

const SCROLL_MULTIPLIER = 3/2000;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const IDENTITY = [1, 0, 0, 1, 0, 0];

export function useTransform(mouseHook: ReturnType<typeof useMouse>) {
    // Transformations
    const [zoom, setZoom, zoomState] = useStateRef(1);
    const [transformMatrix, setTransformMatrix, transformMatrixState] = useStateRef([1, 0, 0, 1, 0, 0]);

    const move = (deltaX: number, deltaY: number) => {
        setTransformMatrix(matrix => CanvasMatrix.matmul(CanvasMatrix.translate(deltaX, deltaY), matrix));
    }

    const scrollZoom = (scrollAmount: number) => {
        const shouldZoomIn = zoom.current < MAX_ZOOM && scrollAmount < 0;
        const shouldZoomOut = zoom.current > MIN_ZOOM && scrollAmount > 0;
        if (shouldZoomIn || shouldZoomOut) {
            let newZoom = Number((zoom.current - SCROLL_MULTIPLIER * scrollAmount).toFixed(2));
            newZoom = Math.min(newZoom, MAX_ZOOM);
            newZoom = Math.max(newZoom, MIN_ZOOM);
            adjustZoom(newZoom);
        }
    };
    
    const adjustZoom = (newZoom: number) => {
        const scaleFactor = newZoom / zoom.current;
        const moveToOriginMatrix = CanvasMatrix.translate(-mouseHook.rawCursorX.ref.current, -mouseHook.rawCursorY.ref.current);
        const scaleMatrix = CanvasMatrix.scale(scaleFactor);
        const moveBackMatrix = CanvasMatrix.translate(mouseHook.rawCursorX.ref.current, mouseHook.rawCursorY.ref.current);
        setTransformMatrix(transformMatrix => CanvasMatrix.matmul_multiple(
            moveBackMatrix,
            scaleMatrix, 
            moveToOriginMatrix,
            transformMatrix
        ));
        mouseHook.updateMousePos();
        setZoom(newZoom);
    };

    const reset = () => {
        setTransformMatrix(IDENTITY);
    }
    
    return {
        zoom: {
            ref: zoom,
            setter: setZoom,
            state: zoomState
        },
        transformMatrix: {
            ref: transformMatrix,
            setter: setTransformMatrix,
            state: transformMatrixState,
        },
        scrollZoom: scrollZoom,
        move: move,
        reset: reset,
    }
}