import { TextField } from "@mui/material";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { RGBColor, SketchPicker } from "react-color";
import { useMouseOverAndDownHide } from "../hooks/mouse_over_hide";

export interface PathMenuProps {
    selectedColor: RGBColor,
    setSelectedColor: Dispatch<SetStateAction<RGBColor>>,
    strokeWidth: number,
    setStrokeWidth: Dispatch<SetStateAction<number>>,
    rawCursorX: number,
    rawCursorY: number,
    isMouseDown: boolean,
}

export function PathMenu(props: PathMenuProps) {
    const [visible, setVisible] = useState(true);
    const divRef = useRef<HTMLDivElement>(null);

    useMouseOverAndDownHide(props.rawCursorX, props.rawCursorY, divRef, setVisible, props.isMouseDown);

    return (<div ref={divRef} className={`absolute select-none right-0 top-0 z-10 p-1 flex flex-col bg-white rounded-sm pointer-events-none ${visible ? "" : "invisible"}`}>
        <SketchPicker 
            color={props.selectedColor} 
            onChange={(color) => props.setSelectedColor(color.rgb)} 
            className="m-1 text-black bg-gray-200 shadow-none pointer-events-auto" 
            disableAlpha={true}
        />
        <TextField 
            className="m-1 text-black pointer-events-auto"
            id="filled-basic" 
            label="Stroke Width" 
            variant="filled"
            value={props.strokeWidth}
            onChange={(e) => {
                let textAsNumber = Number(e.target.value);
                if (!isNaN(textAsNumber)) {
                    props.setStrokeWidth(textAsNumber);
                }
            }}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />
    </div>);
}