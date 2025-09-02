import { memo, useState, useRef,MouseEvent, KeyboardEvent, ChangeEvent } from 'react';
import { RxClipboardCopy } from "react-icons/rx";
import { AiTwotonePushpin } from "react-icons/ai";
import { FaUndo, FaRedo } from "react-icons/fa";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Handle, Position, NodeProps, Node  } from '@xyflow/react';
import { BasePayload } from '../../types/nodes';
import { getCombinedNodeStyle } from '../../utils/nodeStyles';

export const TemplateNode: React.FC<NodeProps<Node<BasePayload>>> = (props) => {

    const {
        id,
        data,
        dragging,
        isConnectable,
        positionAbsoluteX,
        positionAbsoluteY,
        type
    } = props;
    const [editableTemplate, setEditableTemplate] = useState<string>(data.template || '');
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [isRememberOpen, setIsRememberOpen] = useState<boolean>(false); 
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const initialTemplateRef = useRef<string>(data.template || '');
    const image = data.data?.imageUrl
    const onPinToggle = data.onPinToggle;
    const nodeStyle = getCombinedNodeStyle(data.response_data, data.pinned);

    console.log('Rendering TemplateNode:', { id, data, dragging, isConnectable, positionAbsoluteX, positionAbsoluteY, type });


        const handleMouseEnter = (): void => {
            data.setPanOnDrag?.(false);
        };
    
        const handleMouseLeave = (): void => {
            data.setPanOnDrag?.(true);
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
        data.onTemplateChange?.( id, newText );
    }
    
    const handleTemplateChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
        updateTemplate(event.target.value);
    };
        
    
    const clearTemplate = () => {
        updateTemplate(initialTemplateRef.current); // Usa el valor original
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
            style={nodeStyle}
            className="w-[400px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-300"
        >
            <Handle type="source" position={Position.Bottom} id={'question'}/>
            <Handle 
                type="target" 
                position={Position.Top}
                id={'answer'}
            />
            <div 
                className="bg-#cfa5f7 text-white px-4 py-2 rounded-t-lg flex items-center justify-between cursor-grab" 
                onMouseDown={handleMouseEnter} // Permite arrastrar el nodo desde la cabecera
                onMouseUp={handleMouseLeave}
                >
                    
                <h3 className='absolute text-lg font-semibold text-black left-0 right-0 text-center
                                truncate px-12'>
                    {data.title}
                </h3>
                    <div className="relative group" 
                        onClick={() => onPinToggle && onPinToggle(id)} 
                        >
                                      {data.pinned ? '📌' : '📍'} {/* Emoji de pin para indicar el estado */}
                                <span className="
                                    absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                                    px-2 py-1 bg-gray-700 text-white text-xs rounded
                                    opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap
                                ">
                                    {data.pinned ? 'Desanclar' : 'Anclar'}
                                </span>
                            </div>
                    </div>
                    <div className="p-4 flex-grow">
                        <textarea
                            id={`templateArea-${id}`} 
                            ref={textAreaRef}
                            value={editableTemplate}
                            onChange={handleTemplateChange}
                            onKeyDown={ handleKeyDown }
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}     
                            className="
                                nowheel w-full h-72 resize-none p-3 rounded-lg shadow-md
                                focus:shadow-lg focus:outline-none border border-gray-300
                                focus:border-blue-500 text-gray-800 placeholder-gray-400
                                bg-gray-50 transition duration-200 ease-in-out
                            "
                            />
                        </div>
                            <div className="
                                    bg-gray-100 px-4 py-3 flex flex-wrap justify-center items-center
                                    gap-4 border-t border-gray-200 rounded-b-lg
                                ">                            
                                <div className="flex gap-2">
                                    <button
                                        onClick={undoTemplate}
                                        disabled={undoStack.length === 0}
                                        className="relative group p-2 rounded-full hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Deshacer (Ctrl+Z)"
                                    >                                    
                                    <FaUndo size={18} className="text-gray-600 group-hover:text-gray-800 transition-colors" />
                                    <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 transition-opacity duration-300 group-hover:opacity-100">Deshacer</span>
                                </button>
                                <button
                                    onClick={redoTemplate}
                                    disabled={redoStack.length === 0}
                                    className="relative group p-2 rounded-full hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    title="Rehacer (Ctrl+Y)"
                                >
                                <FaRedo size={18} className="text-gray-600 group-hover:text-gray-800 transition-colors" />
                                    <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 transition-opacity duration-300 group-hover:opacity-100">Rehacer</span>
                                </button>
                                <button 
                                    onClick={handleCopy}                     
                                    className="relative group p-2 rounded-full hover:bg-blue-100 transition-colors"
                                >
                                    <RxClipboardCopy
                                        size={30}
                                        className="text-gray-600 group-hover:text-blue-700 transition-colors"
                                    />
                                <span className="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    Copy now
                                </span>
                            </button>
                            <button
                                onClick={clearTemplate}
                                className="
                                    ml-auto py-2 px-4 bg-orange-500 text-white font-semibold rounded-lg shadow-md
                                    hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400
                                    focus:ring-opacity-75 transition duration-300 whitespace-nowrap
                                "
                            >
                                Clear Template
                            </button>
                            </div>
                            {data.answerText && (
                                <div className="bg-gray-50 border-t border-gray-200">
                                    <div
                                        className="px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsRememberOpen(!isRememberOpen)}
                                    >
                                        <span className="text-sm font-medium text-gray-700">Recordar</span>
                                        {isRememberOpen ? <FiChevronUp className="text-gray-600" /> : <FiChevronDown className="text-gray-600" />}
                                    </div>
                                    {isRememberOpen && (
                                        <div className="p-4 bg-gray-100 border-t border-gray-200">
                                            <p className="italic text-sm text-gray-600 whitespace-pre-wrap">
                                                {data.answerText}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
        );
    };

export default memo(TemplateNode);