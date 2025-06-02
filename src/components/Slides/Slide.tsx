import { Handle } from '@xyflow/react';

export const SLIDE_WIDTH = 300; // Tamaño reducido para mejor visualización
export const SLIDE_HEIGHT = 200;

// Slide.jsx
export const Slide = ({ data }) => {
  return (
    <div
      className="relative bg-gradient-to-r from-blue-500 to-blue-700 text-white border border-blue-800 rounded-lg shadow-lg p-4"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
        textAlign: 'center',
      }}
    >
      <Handle
        type="target"
        position="left"
        className="absolute bg-blue-300 border-none w-3 h-3 -left-2 top-1/2 transform -translate-y-1/2 rounded-full"
      />
      <Handle
        type="source"
        position="right"
        className="absolute bg-blue-300 border-none w-3 h-3 -right-2 top-1/2 transform -translate-y-1/2 rounded-full"
      />
      <div className="font-bold text-lg mb-2">{data.question}</div>
      <div className="text-sm text-blue-100 mb-4">
        Detailed Slide Information
      </div>
      <div className="text-sm bg-blue-800 bg-opacity-50 rounded-md p-2">
        {data.left && <div>← Left: Slide {data.left}</div>}
        {data.right && <div>→ Right: Slide {data.right}</div>}
        {data.up && <div>↑ Up: Slide {data.up}</div>}
        {data.down && <div>↓ Down: Slide {data.down}</div>}
      </div>
    </div>
  );
};

export default Slide;
