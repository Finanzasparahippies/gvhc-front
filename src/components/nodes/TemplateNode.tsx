import { memo, useEffect, useState, useRef,MouseEvent, KeyboardEvent, ChangeEvent } from 'react';
import { RxClipboardCopy } from "react-icons/rx";
import { AiTwotonePushpin } from "react-icons/ai";
import { FaUndo, FaRedo } from "react-icons/fa";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export const TemplateNode: React.FC<TemplateNodeProps> = ({ data }) => {

    const [editableTemplate, setEditableTemplate] = useState<string>(data.template || '');
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [isRememberOpen, setIsRememberOpen] = useState<boolean>(false); 
    const textAreaRef = useRef<HTMLTextAreaElement>(null);


        const handleMouseEnter = (): void => {
            data.setPanOnDrag?.(false);
        };
    
        const handleMouseLeave = (): void => {
            data.setPanOnDrag?.(true);
        };
    
        const handlePinned = (event: MouseEvent<HTMLDivElement>): void => {
            event.stopPropagation(); 
                data.onPinToggle(data.id); 
            };
    
        const handleCopy = (): void => {
            navigator.clipboard.writeText(editableTemplate)
            .then(() => {
                Swal.fire({
                    title: '¡Copiado!',
                    text: 'La plantilla ha sido copiada al portapapeles.',
                    icon: 'success',
                    timer: 2500, // Se cierra automáticamente después de 2.5 segundos
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
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true,
                });
            });
        };

    const updateTemplate = ( newText: string, pushToUndo = true ) => {
        if ( pushToUndo ) {
            setUndoStack((prev) => [ ...prev, editableTemplate ]);
            setRedoStack( [ ] )
        }
        setEditableTemplate( newText );
        data.onTemplateChange?.( data.id, newText );
    }
    
    const handleTemplateChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
        updateTemplate(event.target.value);
    };
        
    
        const clearTemplate = () => {
            updateTemplate( '' );
        };
    
        const undoTemplate = (): void => {
        if (undoStack.length > 0) {
            const lastState = undoStack[undoStack.length - 1];
            setRedoStack((prev) => [editableTemplate, ...prev]);
            setUndoStack((prev) => prev.slice(0, -1));
            updateTemplate(lastState, false); // No queremos pushear el "undo" al stack de undo
        }
        };
        
        const redoTemplate = (): void => {
        if (redoStack.length > 0) {
            const nextState = redoStack[0];
            setUndoStack((prev) => [...prev, editableTemplate]);
            setRedoStack((prev) => prev.slice(1)); // Quita el primer elemento, que es el que usamos
            updateTemplate(nextState, false);
        }
        };

        const handleKeyDown = ( event: KeyboardEvent<HTMLTextAreaElement>) => {
            if ( event.ctrlKey) {
                if (event.key === 'z') {
                    event.preventDefault();
                    undoTemplate();
                } else if ( event.key === 'y') {
                    event.preventDefault();
                    redoTemplate();
                }
            }
        }

        const handleTextareaClick = async () => {
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const regex = /\*{3}/g;
        let match;
        
        while ((match = regex.exec(editableTemplate)) !== null) {
            if (cursorPos >= match.index && cursorPos <= match.index + 3) {
                const { value: replacement } = await Swal.fire({
                    title: 'Reemplazar Variable',
                    input: 'text',
                    inputLabel: 'Ingresa el valor para reemplazar "***"',
                    inputValue: '',
                    showCancelButton: true,
                    inputValidator: (value) => {
                        if (!value) {
                            return '¡Necesitas escribir algo!';
                        }
                        return null;
                    }
                });
                if (replacement) {
                    const newText =
                        editableTemplate.slice(0, match.index) +
                        replacement +
                        editableTemplate.slice(match.index + 3);
                    updateTemplate(newText);
                }
                break; 
            }
        }
    };

    return (
        <div
            className="w-full bg-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-300 flex flex-col items-center justify-between overflow-hidden shadow-2xl" 
        >
            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between cursor-pointer" onClick={handlePinned}>
                <h3 className='text-lg font-semibold text-gray-800'>
                    {data.questionText}
                </h3>
                    <div className="relative group">
                                <AiTwotonePushpin
                                    className="
                                    text-red-500 
                                    transition-transform 
                                    duration-200 
                                    transform 
                                    hover:scale-110
                                    "
                                    size={24}
                                    title='Pinned'
                                    />
                            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">
                                {data.pinned ? 'Desanclar' : 'Anclar'}
                            </span>
                            </div>
                    </div>
                    <div className="p-4 flex-grow">
                        <textarea
                            id={`templateArea-${data.id}`} 
                            ref={textAreaRef}
                            value={editableTemplate}
                            onChange={handleTemplateChange}
                            onKeyDown={ handleKeyDown }
                            onClick={ handleTextareaClick }
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
                        </div>
                        <div className="bg-gray-900/50 px-4 py-2 flex items-center justify-between border-t border-gray-700">
                            <div className="flex items-center gap-4">
                                <button onClick={undoTemplate} disabled={undoStack.length === 0} className="relative group disabled:opacity-40 disabled:cursor-not-allowed">
                                    <FaUndo size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                                    <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 transition-opacity duration-300 group-hover:opacity-100">Deshacer</span>
                                </button>
                                <button onClick={redoTemplate} disabled={redoStack.length === 0} className="relative group disabled:opacity-40 disabled:cursor-not-allowed">
                                    <FaRedo size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                                    <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 transition-opacity duration-300 group-hover:opacity-100">Rehacer</span>
                                </button>
                                <button onClick={handleCopy} className="relative group">
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
                            {data.answerText && (
                                <>
                                    <div className="bg-gray-800 border-t border-gray-700 cursor-pointer" onClick={() => setIsRememberOpen(!isRememberOpen)}>
                                        <div className="px-4 py-2 flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-300">Recordar</span>
                                            {isRememberOpen ? <FiChevronUp /> : <FiChevronDown />}
                                        </div>
                                    </div>
                                    {isRememberOpen && (
                                        <div className="p-4 bg-gray-900/50 border-t border-gray-700">
                                            <p className="italic text-sm text-gray-400">
                                                {data.answerText}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
        );
    };

export default memo(TemplateNode);