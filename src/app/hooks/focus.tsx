import { useEffect, useRef } from "react";

export const FOCUS_CLASSNAME = "whitelistFocusable";
export function useFocus() {
    // SVG Focus
    const svgRef = useRef<SVGSVGElement>(null);
    useEffect(() => {
        if (svgRef.current !== null) svgRef.current.focus();
    }, []);

    return svgRef;
}