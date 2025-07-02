import React, { ChangeEvent, useRef, useEffect, useState } from "react";

interface ColorPickerProps {
    onChangeColor: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ onChangeColor }) => {
    const [selectedColor, setSelectedColor] = useState<string>("#09c07a");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newColor = event.target.value;
        setSelectedColor(newColor);
        onChangeColor(newColor);
        localStorage.setItem('preferedColor', newColor)
    };

    const openColorPicker = () => {
        inputRef.current?.click();
    };

    useEffect(() => {
        const lastColor = localStorage.getItem('preferedColor')
        if (lastColor) {
            setSelectedColor(lastColor)
        } 
    }, [])
    

    return (
        <div>
            <input  
                ref={inputRef}
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                className="hidden"
            />
            <button
                onClick={openColorPicker}
                className="w-10 h-10 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: selectedColor }}
                title="Pick a color"
            />
            {/* <span className="font-semibold text-gray-600">{selectedColor}</span> */}
        </div>
    );
};

export default ColorPicker;