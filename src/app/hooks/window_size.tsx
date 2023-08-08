import { useEffect } from "react";
import { useStateRef } from "../usestateref";

export function useWindowSize() {
    const [windowWidth, setWindowWidth] = useStateRef(0);
    const [windowHeight, setWindowHeight] = useStateRef(0);
    
    useEffect(() => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
    });

    return {
        windowWidth: windowWidth.current,
        windowHeight: windowHeight.current,
    };
}