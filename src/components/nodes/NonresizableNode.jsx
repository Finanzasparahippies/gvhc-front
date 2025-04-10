import { memo, useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import TemplateNode from './TemplateNode';

const NonResizableNode = ({ data }) => {

    const [imageSize, setImageSize] = useState({ width: 'auto', height: 'auto' });

    useEffect(() => {
        console.log(data)
        if (data.image) {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const maxDimension = 750; // Tamaño máximo del nodo
                const width = aspectRatio >= 1 ? maxDimension : maxDimension * aspectRatio;
                const height = aspectRatio >= 1 ? maxDimension / aspectRatio : maxDimension;
                setImageSize({ width, height });
            };
            img.src = data.image;
        }
    }, [data.image]);

    return (
        <div
            className={`relative p-3 w-${imageSize.width} h-${imageSize.height} overflow-hidden`}
        >
            <Handle type="target" position={Position.TopLeft} />
            <div
                className='text-center w-full h-full overflow-hidden'
            >
                <strong className={`absolute top-0 left-0 w-full h-8 bg-blue-500 mb-5`}>{data.label}</strong>
                {data.response_type === 'Process' && data.image ? (
                    <div className="relative">
                        <p className="absolute top-2 left-0 w-full bg-black bg-opacity-60 text-white italic text-center rounded-t-lg">
                            {data.answerText.split('\n').map((line, index) => (
                                <span key={index} className="block">{line}<br /></span>
                            ))}
                        </p>

                        {/* Imagen */}
                        <img
                            src={data.image}
                            alt="Process"
                            className="rounded-lg w-full h-full object-cover mt-5"
                        />
                    </div>
                ) :
                data.response_type === 'Image' && data.image ? (
                    <img
                        src={data.image}
                        alt="Node related"
                        className='w-full h-full object-cover mx-auto my-auto'
                    />
                ) : data.response_type === 'Image' && data.excel_file ? (
                    <img
                        src={data.image}
                        alt="Node related"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover', // Asegura que la imagen ocupe el nodo completo
                        }}
                    />
                ) : data.response_type === 'Text' && data.image ? (
                    <>
                        <p className="italic mt-6 max-w-[200px] flex text-center text-gray-700 mb-5">
                            {data.answerText}
                        </p>
                    <img
                        src={data.image}
                        alt="Node related"
                        className='w-full h-full object-cover mx-auto my-auto'
                        />
                    </>
                ) :  data.template ? (
                    <TemplateNode data={data} />
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
                        {data.answerText}
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default memo(NonResizableNode);
