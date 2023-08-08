import { useEffect, useRef } from "react";

export function useFocus() {
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

    useEffect(() => {
        for (let element of document.querySelectorAll<HTMLElement>('input[id^=rc-editable-input]')) {
            element.style.width = "100%";
        }
    }, []);

    return svgRef;
}