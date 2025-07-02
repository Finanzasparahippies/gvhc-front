import { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { BasePayload } from '../../types/nodes';



export const NonResizableNode: React.FC<NodeProps<Node<BasePayload>>> = ({ id, data }) => {

    const { imageUrl, excel_file, borderColor, keywords, response_type, questionText, answerText, template, NodeType, steps, onTemplateChange, onChange} = data

    const [imageSize, setImageSize] = useState<{ width: number | string; height: number | string}>({ width: 'auto', height: 'auto' });

    useEffect(() => {
        if (imageUrl) {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const maxDimension = 750; // Tamaño máximo del nodo
                const width = aspectRatio >= 1 ? maxDimension : maxDimension * aspectRatio;
                const height = aspectRatio >= 1 ? maxDimension / aspectRatio : maxDimension;
                setImageSize({ width, height });
            };
            img.src = imageUrl;
        }
    }, [data.imageUrl]);

    return (
        <div
            style={{ 
                width: imageSize.width, 
                height: imageSize.height,
                minWidth: '250px',
                minHeight: '100px',
            }}
        >
            <Handle type="source" position={Position.Bottom} id={'question'}/>
            
            <Handle 
                type="target" 
                position={Position.Top}
                id={'answerNodeId'}
                />
            <div
                className='text-center w-full h-full overflow-hidden'
            >
                <strong 
                    className={`absolute top-0 left-0 w-full h-8 flex items-center justify-center`}
                    style={{ backgroundColor: borderColor || '#6C757D'}}
                >
                    {questionText}
                </strong>
                {response_type === 'Process' && imageUrl ? (
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
                ) :
                response_type === 'Url' && imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Node related"
                        className='w-full h-full object-cover mx-auto my-auto'
                    />
                ) : response_type === 'Image' && excel_file ? (
                    <img
                        src={imageUrl}
                        alt="Node related"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover', // Asegura que la imagen ocupe el nodo completo
                        }}
                    />
                ) : response_type === 'Text' && imageUrl ? (
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
                ) : (
                    <div
                        className="
                            whitespace-pre-wrap 
                            nowheel 
                            scrollbar-thin 
                            scrollbar-thumb-gray-400 
                            scrollbar-track-gray-100 
                            overflow-y-auto 
                            text-left 
                            max-w-lg 
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
                )}
            </div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default memo(NonResizableNode);
