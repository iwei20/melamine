import { useEffect } from "react";
import { FOCUS_CLASSNAME } from "./focus";

export function useSketchPickerFix() {
    useEffect(() => {
        for (let element of document.querySelectorAll<HTMLElement>('input[id^=rc-editable-input]')) {
            element.style.width = "100%";
        }
    }, []);
}