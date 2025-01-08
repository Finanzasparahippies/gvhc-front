import { memo, useEffect, useState } from 'react';

import { RxClipboardCopy } from "react-icons/rx";
import { AiTwotonePushpin } from "react-icons/ai";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';


const TemplateNode = ({ data }) => {

    const [editableTemplate, setEditableTemplate] = useState(data.template || '');
    const [templateHistory, setTemplateHistory] = useState([]); 
    const [isHovered, setIsHovered] = useState(false); // Controla el hover
    const [isRememberOpen, setIsRememberOpen] = useState(false); // Controla el estado de la nota
    const [ isPinned, setIsPinned ] = useState(false);


        const handleMouseEnter = () => {
            if (data.setPanOnDrag) data.setPanOnDrag(false); // Deshabilita pan
            setIsHovered(true);
        };
    
        const handleMouseLeave = () => {
            if (data.setPanOnDrag) data.setPanOnDrag(true); // Habilita pan
            setIsHovered(false);
        };
    
        const handlePinned = (event) => {
                event.stopPropagation(); 
                data.onPinToggle(data.id); 
            };
    
        const handleCopy = () => {
            navigator.clipboard.writeText(editableTemplate)
            .then(() => {
                Swal.fire({
                    title: '¡Copiado!',
                    text: 'La plantilla ha sido copiada al portapapeles.',
                    icon: 'success',
                    timer: 2000, // Se cierra automáticamente después de 2 segundos
                    timerProgressBar: true, // Muestra una barra de progreso
                    showConfirmButton: false, // Oculta el botón de confirmación
                    position: 'top-end', // Posición en la esquina superior derecha
                    toast: true, // Modo toast para un diseño más limpio
                });
            })
            .catch(() => {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo copiar la plantilla.',
                    icon: 'error',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true,
                });
            });
        };
    
        const handleTemplateChange = (event) => {
            const updatedTemplate = event.target.value || '';
            setTemplateHistory((prev) => [...prev, editableTemplate]);
            setEditableTemplate(updatedTemplate);
            if (data.onChange) {
                data.onChange(data.id, { template: updatedTemplate });
            }
        };
        
    
        const clearTemplate = () => {
            setTemplateHistory((prev) => [...prev, editableTemplate]); // Agregar el valor actual al historial
            setEditableTemplate(data.template); // Limpia el estado local
            data.onChange(data.id, { template: '' });
        };
    
        const undoTemplate = () => {
            if (templateHistory.length > 0) {
                const lastTemplate = templateHistory[templateHistory.length - 1];
                setEditableTemplate(lastTemplate); // Restaura el valor anterior
                setTemplateHistory((prev) => prev.slice(0, -1)); // Elimina el último del historial
                data.onChange(data.id, { template: lastTemplate });
            }
        };

        useEffect(() => {
            const handleKeyDown = (event) => {
                if (event.ctrlKey && event.key === 'z') {
                    event.preventDefault(); // Evitar comportamiento predeterminado
                    undoTemplate(); // Restaurar el template
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }, [templateHistory]);
    

    return (
        <div
                        onClick={handlePinned}
                    >
                        {data.pinned && (
                            <div className="">
                                <AiTwotonePushpin
                                    className="
                                        absolute 
                                        top-0 
                                        right-0 
                                        text-red-500 
                                        transition-transform 
                                        duration-200 
                                        transform 
                                        hover:scale-110
                                        "
                                    size={30}
                                    />
                                </div>
                                )}
                        <textarea
                            value={editableTemplate}
                            onChange={handleTemplateChange}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className="
                                nowheel
                                w-[350px]
                                h-72
                                resize-none
                                p-3
                                mt-5
                                rounded-lg
                                shadow-md
                                focus:shadow-lg
                                focus:outline-none
                                border
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
                            <div className="flex flex-row justify-around w-full text-center">
                            <button onClick={handleCopy} className="relative group items-center justify-center">
                                <RxClipboardCopy
                                    size={30}
                                    className="transition-transform duration-200 transform group-hover:scale-110 group-hover:text-blue-500 mb-5"
                                    />
                                <span className="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    Copy now
                                </span>
                            </button>
                            <button
                        onClick={clearTemplate}
                        className="
                        mt-3
                        mb-5
                        py-2 px-4
                        bg-orange-600
                        text-white
                        font-semibold
                        rounded-lg
                        shadow-md
                        hover:bg-red-600
                        focus:outline-none
                        focus:ring-2
                        focus:ring-red-400
                        focus:ring-opacity-75
                        transition
                        duration-300
                        "
                        >
                        Clear Template
                    </button>
                </div>
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
                    </div>
        );
    };

export default memo(TemplateNode);