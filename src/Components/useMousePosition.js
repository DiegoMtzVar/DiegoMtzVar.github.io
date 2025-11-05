import { useState, useEffect } from "react";

export default function useMousePosition() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
        function handleMouseMove(e) {
        setPosition({ x: e.clientX, y: e.clientY });
        }
    
        window.addEventListener("mousemove", handleMouseMove);
    
        return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);
    
    return position;
}