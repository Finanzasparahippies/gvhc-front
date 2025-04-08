import React, { useEffect, useState } from "react";


const ColorPicker = ({ onChangeColor }) => {
    const [selectedColor, setSelectedColor] = useState("#ddd");

    const handleColorChange = (event) => {
        const newColor = event.target.value;
        setSelectedColor(newColor);
        onChangeColor(newColor);
        localStorage.setItem('preferedColor', newColor)
    };

    useEffect(() => {
        const lastColor = localStorage.getItem('preferedColor')
        if (lastColor) {
            setSelectedColor(lastColor)
        } 
    }, [])
    

    return (
        <>
            <input
                id="colorPicker"
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                className="w-10 h-10 border-none cursor-pointer rounded-lg"
            />
            {/* <span className="font-semibold text-gray-600">{selectedColor}</span> */}
        </>
    );
};

export default ColorPicker;