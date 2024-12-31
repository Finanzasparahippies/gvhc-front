import React, { useState } from "react";


const ColorPicker = ({ onChangeColor }) => {
    const [selectedColor, setSelectedColor] = useState("#ddd");

    const handleColorChange = (event) => {
        const newColor = event.target.value;
        setSelectedColor(newColor);
        onChangeColor(newColor);
    };

    return (
        <div className="absolute left-[550px] top-6 items-center">
            <input
                id="colorPicker"
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                className="w-10 h-10 border-none cursor-pointer"
            />
            {/* <span className="font-semibold text-gray-600">{selectedColor}</span> */}
        </div>
    );
};

export default ColorPicker;