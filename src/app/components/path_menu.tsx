import { TextField } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import { RGBColor, SketchPicker } from "react-color";

export interface PathMenuProps {
    selectedColor: RGBColor,
    setSelectedColor: Dispatch<SetStateAction<RGBColor>>,
    strokeWidth: number,
    setStrokeWidth: Dispatch<SetStateAction<number>>,
}

export function PathMenu(props: PathMenuProps) {
    return (<div className="absolute select-none right-0 top-0 z-10 p-1 flex flex-col">
        <SketchPicker 
            color={props.selectedColor} 
            onChange={(color) => props.setSelectedColor(color.rgb)} 
            className="m-1 text-black" 
            disableAlpha={true}
        />
        <TextField 
            className="m-1 text-black"
            id="outlined-basic" 
            label="Stroke Width" 
            variant="outlined"
        />
    </div>);
}