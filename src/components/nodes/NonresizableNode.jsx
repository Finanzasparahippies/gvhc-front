import { memo, useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { RxClipboardCopy } from "react-icons/rx";

const NonResizableNode = ({ data }) => {
    const [imageSize, setImageSize] = useState({ width: 'auto', height: 'auto' });
    const [editableTemplate, setEditableTemplate] = useState(data.template || '');
    const [isRememberOpen, setIsRememberOpen] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(editableTemplate)
            .then(() => alert('Plantilla copiada al portapapeles'))
            .catch(err => console.error('Error al copiar la plantilla:', err));
    };

    const handleTemplateChange = (event) => {
        setEditableTemplate(event.target.value);
    };

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
                <strong>{data.label}</strong>
                {data.response_type === 'Image' && data.image ? (
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
                    <>
                        <textarea
                            value={editableTemplate}
                            onChange={handleTemplateChange}
                            className="
                                nowheel
                                w-full
                                max-w-xs
                                h-72
                                resize-none
                                p-3
                                mt-2
                                rounded-lg
                                shadow-md
                                focus:shadow-lg
                                focus:outline-none
                                border
                                border-gray-300
                                focus:border-blue-400
                                text-gray-800
                                placeholder-gray-400
                                bg-white
                                transition
                                duration-200
                                ease-in-out
                            "
                        />
                        <div className="flex flex-col items-center mt-4">
                            <button onClick={handleCopy} className="relative group flex items-center justify-center">
                                <RxClipboardCopy
                                    size={30}
                                    className="transition-transform duration-200 transform group-hover:scale-110 group-hover:text-blue-500 mb-5"
                                />
                                <span className="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    Copy now
                                </span>
                            </button>
                            <div className="w-full text-center mt-2">
                                <div
                                    className={`absolute bottom-0 left-0 w-full ${
                                        isRememberOpen ? 'bg-orange-500' : 'bg-blue-500'
                                    } transition-colors duration-300 rounded-b-xl`}
                                    onClick={() => setIsRememberOpen(!isRememberOpen)}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '5px 0',
                                        textAlign: 'center',
                                        borderTop: '1px solid #ccc',
                                    }}
                                >
                                    <span className="text-white font-medium">
                                        {isRememberOpen ? 'Hide' : 'Remember'}
                                    </span>
                                </div>
                                {isRememberOpen && (
                                    <p className="italic mt-2 max-w-[200px] flex text-center text-gray-700 mb-10">
                                        {data.answerText}
                                    </p>
                                )}
                            </div>
                        </div>
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
                        {data.answerText}
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default memo(NonResizableNode);