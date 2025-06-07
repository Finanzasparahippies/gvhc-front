import { memo, useEffect, useState, useRef,MouseEvent, KeyboardEvent, ChangeEvent } from 'react';
import { RxClipboardCopy } from "react-icons/rx";
import { AiTwotonePushpin } from "react-icons/ai";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

interface TemplateNodeData {
    id: string;
    template?: string;
    answerText?: string;
    pinned?: boolean;
    setPanOnDrag?: (enabled: boolean) => void;
    onPinToggle: (id: string) => void;
    onChange?: (id: string, data: { template: string }) => void;
    onTemplateChange?: ( id:string, newTemplate: string ) => void;
}

interface TemplateNodeProps {
    data: TemplateNodeData;
}

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

        const handleTextareaClick = () => {
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const regex = /\*{3}/g;
        let match;
        
        while ((match = regex.exec(editableTemplate)) !== null) {
            if (cursorPos >= match.index && cursorPos <= match.index + 3) {
                const replacement = prompt("Ingresa el valor para reemplazar ***:", "");
                if (replacement !== null) {
                    const newText = 
                        editableTemplate.slice(0, match.index) + 
                        replacement + 
                        editableTemplate.slice(match.index + 3);
                    updateTemplate(newText);
                }
                break; // Salimos del bucle una vez que encontramos y procesamos el match
            }
        }
    };

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