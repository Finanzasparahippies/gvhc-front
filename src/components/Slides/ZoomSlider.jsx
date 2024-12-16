import * as Slider from '@radix-ui/react-slider';
import { useReactFlow } from '@xyflow/react';

const ZoomSlider = () => {
    const { zoomIn, zoomOut, viewport } = useReactFlow(); 

    return (
        <div className="zoom-slider flex items-center space-x-2 p-2 bg-gray-200 rounded-md">
        <button onClick={zoomOut} className="btn">-</button>
        <Slider.Root
            className="slider"
            value={viewport}
            onValueChange={(value) => viewport.setZoom(value)}
        >
            <Slider.Thumb className="thumb" />
            <Slider.Track className="track" />
        </Slider.Root>
        <button onClick={zoomIn} className="btn">+</button>
        </div>
    );
};

export default ZoomSlider;
