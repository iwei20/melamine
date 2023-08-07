import { TextField } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import { RGBColor, SketchPicker } from "react-color";

export interface PathMenuProps {
    sketchPickerColor: RGBColor,
    setSketchPickerColor: Dispatch<SetStateAction<RGBColor>>,
}

export function PathMenu(props: PathMenuProps) {
    return (<>
        <TextField id="outlined-basic" label="Outlined" variant="outlined" />
        <SketchPicker 
        color={props.sketchPickerColor} 
        onChange={(color) => props.setSketchPickerColor(color.rgb)} 
        className="select-none absolute m-1 right-0 text-black z-10" 
        disableAlpha={true}
        />
    </>);
}