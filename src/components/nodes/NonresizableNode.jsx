import { memo, useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import TemplateNode from './TemplateNode';

const NonResizableNode = ({ data }) => {

    const [imageSize, setImageSize] = useState({ width: 'auto', height: 'auto' });

    return (
        <div
            style={{
                padding: 10,
                width: imageSize.width,
                height: imageSize.height,
                overflow: 'hidden', // Oculta contenido fuera de los límites
                position: 'relative', // Necesario para los handles
            }}
        >
            <Handle type="target" position={Position.TopLeft} />
            <div
                style={{
                    textAlign: 'center',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden', // Oculta cualquier contenido que se salga del nodo
                }}
            >
                <strong className={
                    `absolute 
                    top-0 
                    left-0 
                    w-full 
                    h-8
                    bg-blue-500
                    `
                    }>{data.label}</strong>
                {data.response_type === 'Process' && data.image ? (
                    <>
                        <p className="italic mt-2 text-center text-gray-700">
                            {data.answerText}
                        </p>
                        <img
                            src={data.image}
                            alt="Process"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginTop: '10px',
                            }}
                        />
                    </>
                ) :
                data.response_type === 'Image' && data.image ? (
                    <img
                        src={data.image}
                        alt="Node related"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover', // Asegura que la imagen ocupe el nodo completo
                        }}
                    />
                ) :  data.response_type === 'Text' && data.image ? (
                    <>
                        <p className="italic mt-2 max-w-[200px] flex text-center text-gray-700 mb-5">
                            {data.answerText}
                        </p>
                    <img
                        src={data.image}
                        alt="Node related"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover', // Asegura que la imagen ocupe el nodo completo
                        }}
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
