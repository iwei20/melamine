import { Chip } from "@mui/material";

export interface InfoBarProps {
    zoom: number, 
    modeName: string,
    cursorX: number,
    cursorY: number,
}

export function InfoBar(props: InfoBarProps) {
    return (<div className="absolute m-2 select-none z-10">
        <Chip label={`${Math.round(props.zoom * 100)}%`} className="m-1" />
        <Chip label={props.modeName} className="m-1" />
        <Chip label={`${props.cursorX.toFixed(2)} ${props.cursorY.toFixed(2)}`} className="m-1" />
    </div>);
}