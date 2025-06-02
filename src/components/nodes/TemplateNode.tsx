import { memo, useEffect, useState, MouseEvent, ChangeEvent } from 'react';
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
}

interface TemplateNodeProps {
    data: TemplateNodeData;
}

export const TemplateNode: React.FC<TemplateNodeProps> = ({ data }) => {

    const [editableTemplate, setEditableTemplate] = useState<string>(data.template || '');
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [isHovered, setIsHovered] = useState<boolean>(false); 
    const [isRememberOpen, setIsRememberOpen] = useState<boolean>(false); 


        const handleMouseEnter = (): void => {
            data.setPanOnDrag?.(false);
                setIsHovered(true);
        };
    
        const handleMouseLeave = (): void => {
            data.setPanOnDrag?.(true);
                setIsHovered(false);
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
    
        const handleTemplateChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
            const updatedTemplate = event.target.value;
                setUndoStack((prev) => [...prev, editableTemplate]); // Guardamos el estado actual
                setRedoStack([]); // Limpiamos el redo porque hay un nuevo cambio                
                setEditableTemplate(updatedTemplate);
                data.onChange?.(data.id, { template: updatedTemplate });
        };
        
    
        const clearTemplate = () => {
            setRedoStack((prev) => [...prev, editableTemplate]);
            setEditableTemplate(data.template || '');
            data.onChange?.(data.id, { template: '' });
        };
    
        const undoTemplate = (): void => {
            if (undoStack.length > 0) {
                const last = undoStack[undoStack.length - 1];
                setRedoStack((prev) => [ ...prev, editableTemplate]);
                setUndoStack((prev) => prev.slice(0, -1));
                setEditableTemplate(last); // Restaura el valor anterior
                data.onChange?.(data.id, { template: last });
            }
        };
        
        const redoTemplate = (): void => {
            if (redoStack.length > 0) {
                const last = redoStack[redoStack.length - 1];
                setUndoStack((prev) => [...prev, editableTemplate])
                setRedoStack((prev) => prev.slice(0, +1)); // Suma el último del historial
                setEditableTemplate(last); // Restaura el valor anterior
                data.onChange?.(data.id, { template: last });
            }
        };

        useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.ctrlKey && event.key === 'z') {
                event.preventDefault();
                undoTemplate();
                } else if (event.ctrlKey && event.key === 'y') {
                event.preventDefault();
                redoTemplate();
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }, [undoStack, redoStack, editableTemplate]);
    
        useEffect(() => { 
            const textarea = document.getElementById(`templateArea-${data.id}`) as HTMLTextAreaElement | null;
            if (!textarea) return;

            const handleClick = (): void => {
                const value = textarea.value;
                const cursorPos = textarea.selectionStart;

                const regex = /\*{3}/g;
                let match;
                let selectedMatch: { start: number; end: number } | null = null;

                while ((match = regex.exec(value)) !== null) {
                    const start = match.index;
                    const end = start + 3;

                    if (cursorPos >= start && cursorPos <= end) {
                        selectedMatch = { start, end };
                        break;
                    }
                }

                if (selectedMatch) {
                    const replacement = prompt("Ingresa el valor para reemplazar ***:");
                    if (replacement !== null) {
                        const newText =
                            value.slice(0, selectedMatch.start) +
                            replacement +
                            value.slice(selectedMatch.end);

                        setEditableTemplate(newText);
                        setRedoStack((prev) => [...prev, editableTemplate]);
                        data.onChange?.(data.id, { template: newText });
                    }
                }
            };

            textarea.addEventListener('click', handleClick);
            return () => textarea.removeEventListener('click', handleClick);
        }, [editableTemplate, data]);

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