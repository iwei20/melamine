import { Chip } from "@mui/material";
import { RefObject, useEffect, useRef, useState } from "react";
import { useStateRef } from "../usestateref";
import { useMouseOverHide } from "../hooks/mouse_over_hide";

export interface InfoBarProps {
    zoom: number, 
    modeName: string,
    cursorX: number,
    cursorY: number,
    rawCursorX: number,
    rawCursorY: number,
}

export function InfoBar(props: InfoBarProps) {
    const [visible, setVisible] = useState(true);
    const divRef = useRef<HTMLDivElement>(null);

    useMouseOverHide(props.rawCursorX, props.rawCursorY, divRef, setVisible);

    return (<div ref={divRef} className={`absolute m-2 select-none pointer-events-none ${visible ? "z-10" : "opacity-0"}`} >
        <Chip label={`${Math.round(props.zoom * 100)}%`} className="m-1 bg-gray-200" />
        <Chip label={props.modeName} className="m-1 bg-gray-200" />
        <Chip label={`${props.cursorX.toFixed(2)} ${props.cursorY.toFixed(2)}`} className="m-1 bg-gray-200" />
    </div>);
}