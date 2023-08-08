export interface EraseCursorProps {
    primaryIsHeld: boolean,
    diameter: number,
    rawCursorX: number,
    rawCursorY: number,
}

export function EraseCursor(props: EraseCursorProps) {
    return <div
        style={{
            display: props.primaryIsHeld ? "" : "none",
            width: `${props.diameter}px`,
            height: `${props.diameter}px`,
            left: `${props.rawCursorX - props.diameter / 2}px`,
            top: `${props.rawCursorY - props.diameter / 2}px`,
        }}
        className={"absolute rounded-full bg-yellow-500 select-none -z-10"} 
    />
}