// src/components/SharpenTools/components/AgentTicker.tsx

import React, { useEffect, useRef, useState } from 'react';
import PausedTime from '../../../hooks/PausedTime'; // <--- ¡Asegúrate de que esta ruta sea correcta!

import { FiAlertCircle, FiLoader, FiUser, FiPhoneCall, FiCoffee, FiPauseCircle, FiClock, FiPhoneIncoming, FiHash, FiUsers } from 'react-icons/fi'; // Más iconos para estados
import { MdDinnerDining } from "react-icons/md";
import { MdWorkHistory } from "react-icons/md";
import { GiWeightLiftingUp } from "react-icons/gi";
import { PiToiletDuotone } from "react-icons/pi";
import { GoAlert } from "react-icons/go";
import { TbFaceIdError } from "react-icons/tb";
import { GiNestBirds } from "react-icons/gi";
import { MdSupervisedUserCircle } from "react-icons/md";
import { formatTime, getElapsedSeconds } from '../../../utils/helpers';
import { HiUserGroup } from "react-icons/hi2";

// Re-usa la interfaz LiveStatusAgent del dashboard principal
interface LiveStatusAgent {
    username: string;
    queueName: string; // Puede que esta propiedad ya no sea tan relevante individualmente si tenemos 'queues'
    statusDuration: string;
    status: string; // 'active', 'interacting', 'paused', 'offline', 'unavailable', 'on call'
    interactionType?: string;
    callType?: string;
    pauseReason?: string;
    paused: string | number; // Cambiado a string | number para manejar "0" o "1"
    fullName: string;
    lastStatusChange?: string;
    pauseTime?: string; // <--- ¡Asegúrate de que esta línea esté presente!
    // Nuevas propiedades para información detallada
    queues?: { queueID: string; queueName: string }[]; // Array de objetos de cola
    activeCall?: { // Objeto para detalles de llamada activa
        queueCallManagerID?: string;
        commType?: string; // e.g., 'inboundCall', 'outboundCall'
        cidNumber?: string;
        cidName?: string;
        lastActionTime?: string;
        answerTime?: string;
        queueName?: string; // Nombre de la cola de la llamada activa
        // Puedes añadir más campos de activeCall si los necesitas (e.g., 'duration', 'direction')
    };
}

interface AgentTickerProps {
    agents: LiveStatusAgent[];
    error: string | null;
    loading: boolean;
}

// 1. Mapa de colores y iconos para cada estado
const statusStyles: { [key: string]: { color: string; bgColor: string; icon: JSX.Element } } = {
    active: { color: 'text-green-400', bgColor: 'bg-green-800/20', icon: <FiUser className="mr-1" /> },
    'on call': { color: 'text-green-400', bgColor: 'bg-green-800/20', icon: <FiPhoneCall className="mr-1" /> },
    'ringing': { color: 'text-blue-400', bgColor: 'bg-blue-800/20', icon: <FiPhoneCall className="mr-1" /> },
    // Estilo genérico de pausa, se usará si no hay una razón específica o si la razón no tiene un estilo definido
    offline: { color: 'text-red-400', bgColor: 'bg-red-800/20', icon: <MdWorkHistory className="mr-1" /> },
    'off-line work': { color: 'text-orange-400', bgColor: 'bg-orange-800/20', icon: <MdWorkHistory className="mr-1" /> }, // Added for specific 'Offline-work' status
    'wrap up': { color: 'text-yellow-400', bgColor: 'bg-yellow-800/20', icon: <GoAlert className="mr-1" /> },
    'approved busy': { color: 'text-yellow-400', bgColor: 'bg-yellow-800/20', icon: <GoAlert className="mr-1" /> },
    'on hold': { color: 'text-blue-400', bgColor: 'bg-blue-800/20', icon: <FiPhoneCall className="mr-1" /> }, // Added for 'on hold' status
    'training': { color: 'text-blue-400', bgColor: 'bg-blue-800/20', icon: <GiWeightLiftingUp className="mr-1" /> }, // Added for 'on hold' status
    'technical issue': { color: 'text-red-500', bgColor: 'bg-red-800/20', icon: <TbFaceIdError className="mr-1" /> }, // Added for 'on hold' status
    'meeting': { color: 'text-yellow-400', bgColor: 'bg-yellow-800/20', icon: <HiUserGroup className="mr-1" /> }, // Added for 'on hold' status
    'nesting': { color: 'text-yellow-400', bgColor: 'bg-yellow-800/20', icon: <GiNestBirds  className="mr-1" /> }, // Added for 'on hold' status
    'supervisor': { color: 'text-indigo-400', bgColor: 'bg-indigo-800/20', icon: <MdSupervisedUserCircle className="mr-1" /> }, // Added for 'on hold' status
    'auto pause: 1 missed call.': { color: 'text-pink-800', bgColor: 'bg-pink-800/20', icon: <MdSupervisedUserCircle className="mr-1" /> }, // Added for 'on hold' status
    
    // Estilos específicos para razones de pausa (pauseReason)
    paused: { color: 'text-orange-400', bgColor: 'bg-orange-800/20', icon: <FiPauseCircle className="mr-1" /> },
    'bathroom': { color: 'text-purple-400', bgColor: 'bg-purple-800/20', icon: <PiToiletDuotone className="mr-1" /> },
    'lunch': { color: 'text-red-300', bgColor: 'bg-red-800/20', icon: <MdDinnerDining className="mr-1" /> },
    'break': { color: 'text-red-300', bgColor: 'bg-red-800/20', icon: <FiClock className="mr-1" /> },
    // Puedes añadir más razones de pausa aquí con sus propios estilos
};

const statesWithElapsedTime = [
    'on call', // Esto ya lo tenías, pero ahora puedes usar el mismo método de lastStatusChange
    'ringing', // Si también quieres ver cuánto tiempo lleva sonando
    'approved busy',
    'training',
    'technical issue',
    'meeting',
    'nesting',
    'supervisor',
    'auto pause: 1 missed call.',
    'offline', // Si también quieres tiempo transcurrido para offline
    'off-line work', // Si también quieres tiempo transcurrido para off-line work
    // Añade aquí cualquier otro estado que quieras monitorear con lastStatusChange
];

const statesUsingActiveCallTime = [
    'on hold',
    'wrap up',
    'ringing'
];

const ElapsedStatusTime: React.FC<{ startTime: string; label?: string }> = ({ startTime, label }) => {
    const [elapsed, setElapsed] = useState(() => getElapsedSeconds(startTime));

    useEffect(() => {
        const intervalId = setInterval(() => {
            setElapsed(getElapsedSeconds(startTime));
        }, 1000);
        return () => clearInterval(intervalId);
    }, [startTime]);

    if (!startTime) {
        return null;
    }

    // Puedes ajustar el estilo de este texto si quieres que sea diferente al de "Paused for"
    return (
        <span className="text-lg text-blue-300 ml-1 text-center">
            ({formatTime(elapsed)}) {label && <span className="text-orange-300">{label}</span>}
        </span>
    );
};

// 2. Función para formatear los datos de un agente en un elemento JSX
const formatAgentStatus = (agent: LiveStatusAgent): JSX.Element => {
    // console.log('agents:', agent)
    const currentStatus = agent.status.toLowerCase();
    let displayStatusKey: string = currentStatus; // Por defecto, usamos el status de la API
    let statusText: string;


    const isPaused = Number(agent.paused) === 1;

    if (isPaused) {
        if (agent.pauseReason && agent.pauseReason.trim() !== '') {
            displayStatusKey = agent.pauseReason.toLowerCase();
            statusText = agent.pauseReason;
        } else {
            displayStatusKey = 'paused';
            statusText = 'Paused';
        }
    } else if (currentStatus === 'on call' || currentStatus === 'interacting') {
        displayStatusKey = currentStatus; // Use 'on call' or 'interacting' as key
        statusText = 'on Call';
        if (agent.interactionType) {
            statusText = `En ${agent.interactionType} ${agent.callType ? `(${agent.callType})` : ''}`;
        }
    } else {
        displayStatusKey = currentStatus;
        statusText = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
    }

    const style = statusStyles[displayStatusKey] ||
                    (isPaused ? statusStyles.paused : { color: 'text-gray-400', bgColor: 'bg-gray-800/20', icon: <FiAlertCircle className="mr-1" /> });
    const showActiveCallTime = statesUsingActiveCallTime.includes(currentStatus) && agent.activeCall?.lastActionTime;

    const showElapsedTime = statesWithElapsedTime.includes(displayStatusKey) && agent.lastStatusChange;

    let timeLabel = '';
    if (currentStatus === 'on hold') timeLabel = 'On Hold';
    if (currentStatus === 'wrap up') timeLabel = 'Wrap Up';
    if (currentStatus === 'ringing') timeLabel = 'Ringing';
    
    return (
        // Cambiamos a un div para permitir múltiples líneas y mejor estructura de tarjeta
        <div className={`flex flex-col items-start p-3 rounded-lg shadow-md min-w-[250px] max-w-[400px] ${style.bgColor} border border-transparent`}>
            {/* Línea principal de estado */}
            <div className={`flex items-center text-lg font-medium ${style.color} mb-1`}>
                {style.icon}
                <span className="truncate font-semibold text-white">{agent.fullName}</span>: <span className="ml-1 font-semibold">{statusText}</span>
            </div>
            {isPaused && agent.pauseTime ? (
                    // Tiempo de pausa del agente (usa PausedTime, que interpreta como hora local)
                    <div className="text-lg text-gray-400 ml-1">
                        <PausedTime pauseStartTime={agent.pauseTime} />
                    </div>
                ) : showActiveCallTime  ? (
                    // Tiempo de llamada en hold (usa activeCall.lastActionTime)
                    <span className="text-lg text-orange-300 ml-1 text-center">
                        <ElapsedStatusTime startTime={agent.activeCall!.lastActionTime!} /> 
                        On Hold
                    </span>
                ) : showElapsedTime ? (
                    // Tiempo transcurrido para otros estados basados en lastStatusChange
                    <ElapsedStatusTime startTime={agent.lastStatusChange!} />
                ) : (
                    // Fallback: Si no es ninguno de los casos anteriores, muestra el statusDuration de la API
                    <span className="text-md text-gray-400 ml-1">{agent.statusDuration}</span>
                )}
            {/* Información de llamada activa */}
            {
            // agent.activeCall && (
            //     <div className="text-xs text-gray-300 mb-1 pl-5"> {/* Indentado para anidación visual */}
            //         <div className="flex items-center">
            //             <FiPhoneIncoming className="mr-1 text-blue-300" />
            //             <span>Active Call: {agent.activeCall.cidName || 'Desconocido'} ({agent.activeCall.cidNumber})</span>
            //         </div>
            //         {agent.activeCall.queueName && (
            //             <div className="flex items-center mt-0.5">
            //                  <FiHash className="mr-1 text-gray-400" />
            //                 <span>Queue: {agent.activeCall.queueName}</span>
            //             </div>
            //         )}
            //     </div>
            // )
            }

            {/* Colas loggeadas */}
            {agent.queues && agent.queues.length > 0 && (
                <div className="text-xs font-semibold text-gray-400 pl-5"> {/* Indentado */}
                    <div className="flex items-center mb-0.5">
                        <FiUsers className="mr-1 text-gray-400" size={15} />
                        <span className='font-semibold text-sm '>Active Queues:</span>
                    </div>
                    <ul className="list-disc list-inside ml-2">
                        {agent.queues.map((queue) => (
                            <li key={queue.queueID} className="truncate">
                                {queue.queueName}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const AgentTicker: React.FC<AgentTickerProps> = ({ agents, error, loading }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    // Estados para el arrastre (drag-to-scroll)
    const tickerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
    
    const scrollSpeed = 0.5; // Pixeles por frame
    const repetitions = 2; // Number of times to repeat the content for the ticker
    const tickerContentElements: JSX.Element[] = [];

    const animateScroll = () => {
        if (contentRef.current && !isDragging) {
            // Desplaza el contenido
            contentRef.current.scrollLeft += scrollSpeed;

            // Lógica para el bucle infinito: si el contenido ha pasado la mitad de su ancho total (una repetición completa)
            // se reinicia para dar la ilusión de un bucle continuo.
            const singleContentWidth = contentRef.current.scrollWidth / repetitions;
            if (contentRef.current.scrollLeft >= singleContentWidth) {
                contentRef.current.scrollLeft -= singleContentWidth;
            }
        }
        // Solicita el siguiente frame de animación
        const id = requestAnimationFrame(animateScroll);
        setAnimationFrameId(id);
    };

    useEffect(() => {
        // Only start animation if not loading and there are agents
        if (!loading && agents.length > 0) {
            const id = requestAnimationFrame(animateScroll);
            setAnimationFrameId(id);
        } else {
            // If loading or no agents, cancel any existing animation
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                setAnimationFrameId(null);
            }
        }

        // Cleanup function to cancel the animation when the component unmounts
        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isDragging, loading, agents.length, repetitions]); // Add repetitions to dependencies


    // Manejador para el inicio del arrastre
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (contentRef.current) {
            setIsDragging(true);
            setStartX(e.pageX - contentRef.current.offsetLeft);
            setScrollLeft(contentRef.current.scrollLeft);
        }
    };

    // Manejador para cuando el mouse se mueve
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !contentRef.current) return;
        e.preventDefault(); // Prevenir la selección de texto o el arrastre de imágenes
        const x = e.pageX - contentRef.current.offsetLeft;
        const walk = (x - startX) * 1.5; // Multiplicador para la sensibilidad del arrastre
        contentRef.current.scrollLeft = scrollLeft - walk;
    };

    // Manejador para cuando se suelta el botón del mouse o el mouse sale del área
    const handleMouseUpOrLeave = () => {
        setIsDragging(false);
    };

    // if (loading) {
    //     return (
    //         <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md text-center animate-fade-in">
    //             <FiLoader className="animate-spin text-purple-400 text-3xl mx-auto mb-2" />
    //             <p className="text-gray-300">Loading agent statuses...</p>
    //         </div>
    //     );
    // }

    if (error) {
        return (
            <div className="mt-8 p-4 bg-red-800/30 text-red-300 rounded-lg flex items-center justify-center animate-fade-in">
                <FiAlertCircle className="mr-2 text-xl" />
                <p>Error al cargar el estado de los agentes: {error}</p>
            </div>
        );
    }

    if (!agents || agents.length === 0) {
        return (
            <div className="mt-8 p-4 bg-gray-800 rounded-lg text-gray-400 text-center animate-fade-in">
                <p>No hay agentes en línea para mostrar en este momento.</p>
            </div>
        );
    }


    

    // Loop to create repeated content with unique keys for each instance
    for (let repIndex = 0; repIndex < repetitions; repIndex++) {
        agents.forEach((agent, agentIndex) => {
            // Assign a unique key for each agent element in each repetition
            // Using React.Fragment with a key is a good way to apply a key to a single child
            tickerContentElements.push(
                <React.Fragment key={`rep-${repIndex}-agent-${agent.username}`}>
                    {formatAgentStatus(agent)}
                </React.Fragment>
            );

            // Assign a unique key for each separator in each repetition
            if (agentIndex < agents.length - 1) {
                tickerContentElements.push(
                    <span key={`rep-${repIndex}-sep-${agentIndex}`} className="mx-4 text-gray-500 text-xl font-light">|</span>
                );
            }
        });

        // Add an extra separator between full repetitions for better visual distinctio
        // if (repIndex < repetitions - 1 && agents.length > 0) {
        //      tickerContentElements.push(
        //         <span key={`rep-block-sep-${repIndex}`} className="mx-8 text-gray-600 text-2xl font-light">||</span>
        //      );
        // }
    }

    const animationDuration = Math.max(25, agents.length * 5); // Duración dinámica basada en el número de agentes

    return (
        <div className="mt-8 mb-4 bg-gray-800 rounded-lg shadow-xl overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white text-center">Agent Dispositions</h2>
            </div>
            <div 
                ref={tickerRef} // <-- NUEVO: Asignamos la referencia
                className="relative w-full min-h-[240px] max-h-[270px] flex items-center overflow-hidden overflow-x-auto scrollbar-hide cursor-grab"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseUpOrLeave}
                onMouseUp={handleMouseUpOrLeave}
                onMouseMove={handleMouseMove}
                >
                {/* Contenedor que permite el desplazamiento infinito */}
                <div
                    className="whitespace-nowrap absolute will-change-transform flex items-center" // Añade flex y items-center
                    style={{ animation: `ticker ${animationDuration}s linear infinite` }}
                >
                    {tickerContentElements}
                </div>
            </div>
            {/* Define los keyframes de la animación dentro de un bloque <style> global o en tu CSS principal */}
        </div>
    );
};

export default AgentTicker;