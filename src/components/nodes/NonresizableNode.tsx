import { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, Node, useUpdateNodeInternals  } from '@xyflow/react';
import { BasePayload } from '../../types/nodes';
import { getCombinedNodeStyle, getGroupDimensionsByType } from '../../utils/nodeStyles';



export const NonResizableNode: React.FC<NodeProps<Node<BasePayload>>> = ({ id, data, isConnectable }) => {

    const { imageUrl, excel_file, borderColor, keywords, response_type, questionText, answerText, title, template, NodeType, steps, onTemplateChange, onChange} = data
    const nodeStyle = getCombinedNodeStyle(data.response_data, data.pinned);
    // const [imageSize, setImageSize] = useState<{ width: number | string; height: number | string}>({ width: 'auto', height: 'auto' });
    const updateNodeInternals = useUpdateNodeInternals();
    const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    useEffect(() => {
        if (imageUrl) {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const maxDimension = 850; // Tamaño máximo del nodo
                let calculatedWidth = 0;
                let calculatedHeight = 0;
                if (aspectRatio >= 1) { // Imagen ancha
                    calculatedWidth = maxDimension;
                    calculatedHeight = maxDimension / aspectRatio;
                } else { // Imagen alta
                    calculatedWidth = maxDimension * aspectRatio;
                    calculatedHeight = maxDimension;
                }
                
                // Si la imagen es más pequeña que el tamaño del nodo por defecto, usa su tamaño real
                const defaultDimensions = getGroupDimensionsByType('NonResizableNode');
                const finalWidth = Math.min(calculatedWidth, img.width, defaultDimensions.width);
                const finalHeight = Math.min(calculatedHeight, img.height, defaultDimensions.height);

                setImageSize({ width: finalWidth, height: finalHeight });
                updateNodeInternals(id);
            };
            img.src = imageUrl;
        }
    }, [imageUrl, id, updateNodeInternals]);

    const nodeDimensionsStyle = imageSize.width > 0 && imageSize.height > 0
        ? { width: imageSize.width, height: imageSize.height }
        : {};

    const renderContent = () => {
    switch (data.response_type) {
        case 'Process':
            return (
                <div className="relative">
                        <p className="absolute top-2 left-0 w-full bg-black bg-opacity-60 text-white italic text-center rounded-t-lg">
                            {data.answerText?.split('\n').map((line: string, index: number) => (
                                <span key={index} className="block">{line}<br /></span>
                            ))}
                        </p>

                        {/* Imagen */}
                        <img
                            src={imageUrl}
                            alt="Process"
                            className="rounded-lg w-full h-full object-cover mt-5"
                        />
                </div>
            );
        case 'Url':
            return (
                <img
                    src={imageUrl}
                    alt="Node related"
                    className='w-full h-full object-cover mx-auto my-auto'
                />
            );
        // ... otros casos
        case 'Text':
            if (imageUrl) {
                return (
                    <>
                        <p className="italic mt-6 max-w-[200px] flex text-center text-gray-700 mb-5">
                            {answerText}
                        </p>
                    <img
                        src={imageUrl}
                        alt="Node related"
                        className='w-full h-full object-cover mx-auto my-auto'
                        />
                    </>
                );
            }
            // Si 'Text' no tiene imagen
            return (
                <div
                    className="
                        whitespace-pre-wrap 
                        nowheel 
                        scrollbar-thin 
                        scrollbar-thumb-gray-400 
                        scrollbar-track-gray-100 
                        overflow-y-auto 
                        text-left 
                        max-w-[calc(100%-1rem)]
                        max-h-[450px] 
                        mt-3 
                        text-sm 
                        leading-relaxed 
                        font-sans 
                        text-gray-800 
                        border 
                        border-gray-300 
                        p-4 
                        rounded-lg 
                        bg-gray-50 
                        shadow-md
                    "
                >
                    {answerText}
                </div>
            );
        default:
            return (
                <div
                    className="
                        whitespace-pre-wrap 
                        nowheel 
                        scrollbar-thin 
                        scrollbar-thumb-gray-400 
                        scrollbar-track-gray-100 
                        overflow-y-auto 
                        text-left 
                        max-w-[calc(100%-1rem)]
                        max-h-[450px] 
                        mt-3 
                        text-sm 
                        leading-relaxed 
                        font-sans 
                        text-gray-800 
                        border 
                        border-gray-300 
                        p-4 
                        rounded-lg 
                        bg-gray-50 
                        shadow-md
                    "
                >
                        {answerText}
                </div>  
            );
    }
};

    return (
        <div style={{...nodeDimensionsStyle, position: 'relative' }}>
            <Handle 
                type="source"
                position={Position.Bottom}
                id="output-handle"
                isConnectable={isConnectable}
                className="!bg-green-500 !w-3 !h-3" // Estilos Tailwind para el handle
            />
            
            <Handle 
                type="target"
                position={Position.Top}
                id="input-handle"
                isConnectable={isConnectable}
                className="!bg-blue-500 !w-3 !h-3" // Estilos Tailwind para el handle
                />
            <div
                className='text-center w-full h-full overflow-hidden'
                style={nodeStyle}
            >
                <strong 
                    className={`absolute top-0 left-0 w-full h-8 flex items-center justify-center`}
                    style={{ backgroundColor:'#eefb9a'}}
                >
                    {title}
                </strong>
                {renderContent()}
            </div>
        </div>
    );
};

export default memo(NonResizableNode);
