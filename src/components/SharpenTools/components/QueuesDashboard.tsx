//src/components/SharpenTools/components/QueuesDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FiRefreshCw, FiAlertCircle, FiClock, FiPhoneIncoming, FiSidebar, FiLoader, FiMaximize, FiMinimize } from 'react-icons/fi';
import API from '../../../utils/API';
import { useAuth } from '../../../utils/AuthContext';
import { MdSpatialAudioOff } from "react-icons/md";
import { SlCallIn } from "react-icons/sl";
import { FcDepartment } from "react-icons/fc";
import { useCallsWebSocket } from '../../../hooks/useCallWebSocket';
import ElapsedTime from '../../../hooks/elapsedTime'; // 👈 Asegúrate de importar el nuevo componente
import { formatTime, getElapsedSeconds } from '../../../utils/helpers'
import { QUERY_TEMPLATES } from "./SharpenQuerys"; // o como lo importes
import sharpenAPI from '../../../utils/APISharpen';
import AgentTicker from './AgentTicker'; // Creamos este archivo en el paso 2
import { QuoteResponse } from '../../../types/declarations';

interface QueueConfig {
    id: string; // Un ID único para la tarjeta
    title: string; // Título de la tarjeta (ej: 'Appointment Line')
    queueName: string[]; // Nombre de la cola real en la DB
}

// Define cómo se almacenarán los datos de cada métrica (Count, Lcw)
interface MetricData {
    value: string | number | null;
    loading: boolean;
    error: string | null;
}

// Define el estado completo de todas las métricas, ahora agrupadas por cola
interface AllMetricsState {
    [queueId: string]: {
        count: MetricData;
        lcw: MetricData;
    };
}

interface LiveStatusAgent {
    username: string;
    queueName: string;
    statusDuration: string;
    status: string;
    interactionType: string;
    callType: string;
    pauseReason: string;
    paused: string;
    fullName: string;
}

const dashboardQueues: QueueConfig[] = [
    { id: 'appt_line', title: 'Appointments', queueName: ['Appointment Line RP1200', 'ES-Appointment Line RP1200'] },
    { id: 'medrec', title: 'Medical Records', queueName: ['Medical Records RP1260', 'ES-Medical Records RP1260'] },
    { id: 'provider', title: 'Providers line', queueName: ['Provider Hotline RP1270', 'ES-Provider Hotline RP1270'] },
    { id: 'transport', title: 'Transportation', queueName: ['Transportation'] },
    { id: 'dental', title: 'Dental', queueName: ['Dental'] },
    { id: 'referals', title: 'Referrals', queueName: ['Referals RP1250', 'ES-Referrals RP1250'] },
];

const buildQuery = (queueName: string, type: 'COUNT' | 'LCW'): string => {
    const dbTable = "`fathomvoice`.`fathomQueues`.`queueCallManager`";
    const whereClause = `(\`queue\`.\`queueName\` = "${queueName}") AND (\`currentLocation\` LIKE "%PL%" OR \`currentLocation\` LIKE "%CB%")`;
    const intervals = `FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(NOW())/(5))*(5)) AS "intervals"`;

    if (type === 'COUNT') {
        return `SELECT COUNT(\`queueCallManagerID\`), \`queue\`.\`queueName\` AS "Queue Name", \`currentLocation\`, ${intervals} FROM ${dbTable} WHERE ${whereClause} UNION (SELECT null, null, null, ${intervals}) LIMIT 1`;
    }
    if (type === 'LCW') {
        return `SELECT SEC_TO_TIME((UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(MIN(queueEnterTime)))) AS "LCW", ${intervals} FROM ${dbTable} WHERE ${whereClause} UNION (SELECT null, ${intervals}) LIMIT 1`;
    }
    return '';
};

// --- COMPONENTE PRINCIPAL DEL DASHBOARD ---
const QueueDashboard: React.FC = () => {
    // const [metricsData, setMetricsData] = useState<AllMetricsState>({});
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [quote, setQuote] = useState<string | null>(null);
    const [author, setAuthor] = useState<string | null>(null);
    const { user } = useAuth();  // Dentro de tu componente `QueueDashboard`
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // <--- CAMBIO: Estado para la barra lateral
    const [isFullscreen, setIsFullscreen] = useState(false); // <--- AÑADE ESTE ESTADO
    const dashboardRef = useRef<HTMLDivElement>(null); // <--- AÑADE ESTA REFERENCIA
    // const [sidebarError, setSidebarError] = useState<string | null>(null); // <--- AÑADE ESTO
    const { calls: callsOnHold, isLoading, wsError } = useCallsWebSocket();
    const userQueueNames = user?.queues.map((q) => q.name) || [];
    const [agentLiveStatus, setAgentLiveStatus] = useState<LiveStatusAgent[]>([]);
    const [agentError, setAgentError] = useState<string | null>(null);
    const [agentLoading, setAgentLoading] = useState<boolean>(true); // New loading state for agents

    const defaultGetAgentsParams = useMemo(() => ({
        getActiveCalls: true,
        getDayCallCount: true,
        queueLogin: true,
        onlineOnly: true,
        orderBy: 'asc' as 'asc' | 'desc',
        orderByCol: 'activeCall',
    }), []);

    const fetchLiveStatus = async () => {
        setAgentLoading(true); // Start loading
        try {
            const { endpoint, payload } = QUERY_TEMPLATES.getAgents(defaultGetAgentsParams);
            const response = await sharpenAPI.post<SharpenApiResponseData>('dashboards/proxy/generic/', {
                            endpoint: endpoint, // El endpoint real de Sharpen
                            payload: payload,   // El payload real para Sharpen
            });
            console.log("respuesta del getAgents (fetchLiveStatus):", response.data);

            // La respuesta de la API de Sharpen para getAgents viene en `getAgentsData`
            if (response.data && response.data.getAgentsStatus === "Complete" && response.data.getAgentsData) {
                // `getAgentsData` puede ser un objeto o un array de objetos.
                // Asegurémonos de que siempre sea un array para `setAgentLiveStatus`.
                const extractedData = Array.isArray(response.data.getAgentsData)
                    ? response.data.getAgentsData
                    : [response.data.getAgentsData]; // Si es un solo objeto, conviértelo a array

                // Filtra cualquier entrada con username nulo/indefinido si es necesario
                const filteredData = extractedData.filter((item: any) => item.username !== null && item.username !== undefined);

                setAgentLiveStatus(filteredData);
            } else {
                // console.warn("Unexpected response format in getAgents (fetchLiveStatus):", response.data);
                setAgentLiveStatus([]);
                setAgentError("Failed to fetch agent live status. Unexpected data format.");
            }
            setAgentError(null);
        } catch (error) {
            // console.error("Error fetching liveStatus (getAgents):", error);
            setAgentError("Failed to fetch agent live status. Check console for details.");
            setAgentLiveStatus([]); // Clear agents on error
        } finally {
            setAgentLoading(false); // End loading
        }
    };

    useEffect(() => {
        fetchLiveStatus();
        // Agrega un intervalo para refrescar el estado de los agentes periódicamente si es un dashboard "Live"
        const intervalId = setInterval(fetchLiveStatus, 15000); // Refresca cada 15 segundos
        return () => clearInterval(intervalId); // Limpia el intervalo al desmontar el componente
    }, [defaultGetAgentsParams]); // Dependencia del efecto para que se ejecute si cambian los parámetros por defecto


const queueIdMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const group of dashboardQueues) {
            for (const sourceName of group.queueName) {
                // NORMALIZA LAS CLAVES: a minúsculas y elimina espacios extras.
                map[sourceName.trim().toLowerCase()] = group.id;
            }
        }
        // console.log("Queue ID Map (Normalized):", map); // Agrega este log para ver el mapa final
        return map;
    }, []);

// Agregación de datos usando los IDs unificados
const { counts, lcw } = useMemo(() => {

    const result: { counts: Record<string, number>, lcw: Record<string, number> } = {
        counts: {},
        lcw: {}
    };

    for (const call of callsOnHold) {
        // Encuentra el ID del grupo unificado al que pertenece la llamada
        const normalizedCallQueueName = call.queueName.trim().toLowerCase();
        const unifiedId = queueIdMap[normalizedCallQueueName];

        if (unifiedId) {
            const elapsed = getElapsedSeconds(call.startTime);
            // Agrega el conteo al grupo correcto
            result.counts[unifiedId] = (result.counts[unifiedId] || 0) + 1;
            // Actualiza el LCW para el grupo correcto
            result.lcw[unifiedId] = Math.max(result.lcw[unifiedId] || 0, elapsed);
        } else {
                // 🚨 ESTE CONSOLE.WARN ES CRUCIAL PARA LA DEPURACIÓN EN PRODUCCIÓN 🚨
                console.warn(`⚠️ Nombre de cola no mapeado desde WebSocket: "${call.queueName}" (normalizado: "${normalizedCallQueueName}")`);
            }
    }
    return result;
}, [callsOnHold, queueIdMap]);

    const isUserMetric = (queueConfig: QueueConfig): boolean => {
        // Revisa si alguna de las colas de origen del grupo coincide con las del usuario
        return queueConfig.queueName.some(sourceQueue =>
            userQueueNames.some((userQueueName: string) =>
                sourceQueue.toLowerCase().includes(userQueueName.toLowerCase())
            )
        );
    };

    useEffect(() => {
        // Establecer la última actualización cuando callsOnHold cambie y no esté cargando
        // console.log('🔄️ Component re-rendered with new calls:', callsOnHold);
        if (!isLoading) {
            setLastUpdated(new Date());
        }
    }, [callsOnHold, isLoading]); // Añade isLoading como dependencia


    useEffect(() => {
        const fetchQuote = async () => {
                try {
                    const response = await API.get<QuoteResponse | QuoteResponse[]>('api/dashboards/quote/');
                    const data = response.data;
                    // console.log('quote:', data)
                    if (Array.isArray(data)) {
                            if (data.length > 0) {
                                setQuote(data[0].q);
                                setAuthor(data[0].a);
                            }
                        } else if (data.q && data.a) {
                            setQuote(data.q);
                            setAuthor(data.a);
                        }
                    } catch (error) {
                        // console.error('Error fetching quote:', error);
                    }
                };

            fetchQuote();

            const intervalId = setInterval(fetchQuote, 300000); // Llama cada 5 min
            return () => clearInterval(intervalId); // Limpia el intervalo al desmontar
        }, []);

        const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            // Si no estamos en pantalla completa, la solicitamos
            dashboardRef.current?.requestFullscreen();
        } else {
            // Si ya estamos, salimos
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        // Esta función se encarga de actualizar nuestro estado si cambia el modo de pantalla completa
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        // Escuchamos el evento 'fullscreenchange' del navegador
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Es importante limpiar el listener cuando el componente se desmonte para evitar memory leaks
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []); // El array vacío asegura que esto solo se ejecute al montar y desmontar


        const handleRefreshClick = useCallback(() => {
            // In a WebSocket-driven app, "refresh" often means re-establishing connection
            // or re-requesting initial data if the WebSocket provides it.
            // Since useCallsWebSocket handles reconnects, a simple update of lastUpdated
            // might be enough to give visual feedback.
            setLastUpdated(new Date());
            // If you had other non-WebSocket data, you would call their fetch functions here.
            // For example: fetchOtherDataViaAPI();
            console.log("Refresh button clicked. Displaying latest WebSocket data.");
        }, []);

    return (
        <div
            ref={dashboardRef}
            className="bg-gray-900 min-h-screen px-4 sm:p-6 lg:py-2 font-sans text-white mt-[120px] animate-fade-in-down"
        >
            <div className="max-w-full mx-auto">
                {/* --- Cabecera --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <div>
                        {/* <h1 className='text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-t from-gray-500 to-purple-600 mb-4 pb-2'>GVHC Patient's on Queue</h1> */}
                        <p className="text-gray-400 mt-1">
                            Last update: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Cargando...'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        {/* <--- CAMBIO: Botón para controlar la barra lateral ---> */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                            title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
                        >
                            <FiSidebar className="mr-2" />
                            <span>On Hold ({callsOnHold.length})</span>
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        >
                            {isFullscreen ? (
                                <FiMinimize className="mr-2" />
                            ) : (
                                <FiMaximize className="mr-2" />
                            )}
                            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                        </button>
                        {/* <button
                            onClick={handleRefreshClick} // Use the new handler
                            disabled={isLoading}
                            className="flex items-center px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <FiRefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Updating...' : 'Update Now'}
                        </button> */}
                    </div>
                </div>

                {/* <--- CAMBIO: Contenedor principal con Flexbox ---> */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* <--- CAMBIO: Barra lateral ---> */}
                    <aside className={`bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-full max-h-screen lg:w-[280px]' : 'w-0 p-0 overflow-hidden'}`}>
                        <h2 className={`text-2xl font-bold mb-4 border-b border-gray-700 pb-2 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Patients on Hold</h2>
                        <div className={`flex-grow overflow-y-auto transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            {
                            // wsError && (
                            //     <div className="p-3 bg-yellow-500/20 text-yellow-300 rounded-md mb-4 flex items-center justify-center">
                            //         <FiLoader className="animate-spin mr-2 text-xl" />
                            //         <p className="font-bold">Reconnecting...</p> {/* Mensaje más amigable */}
                            //     </div>
                            // )
                            }
                            {callsOnHold.length === 0 ? (
                                <p className="text-gray-400">No patients on hold.</p>
                            ) : (
                                callsOnHold
                                .sort((a, b) => getElapsedSeconds(b.startTime) - getElapsedSeconds(a.startTime)) // Sort by elapsed time (descending)
                                .map((call) => {
                                    return (
                                        <div
                                            key={call.queueCallManagerID}
                                            className={`mb-4 p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg shadow-md border-l-4 border-purple-500 transition-all duration-300 ease-in-out animate-fade-in-down`}
                                            >
                                            <p className="text-lg font-bold text-white flex items-center gap-2">
                                                <MdSpatialAudioOff className='mr-2'/> {call.cidName || "Paciente desconocido"}
                                            </p>
                                            {/* <p className="text-sm text-gray-300 flex items-center gap-2">
                                                <SlCallIn className='mr-2'/> {call.callbackNumber}
                                            </p> */}
                                            <p className="text-sm text-gray-300 flex items-center gap-2">
                                                <FcDepartment className='mr-2' /> {call.queueName}
                                            </p>
                                            <ElapsedTime startTime={call.startTime} />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* <--- CAMBIO: Contenido principal que se expande ---> */}
                    <main className="flex-1">
                        {/* --- Grid de Métricas --- */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-3">
                            {dashboardQueues.map((queue) => {
                                // const data = metricsData[metric.id];
                                const countValue = counts[queue.id] ?? 0;
                                const lcwValue = formatTime(lcw[queue.id] ?? 0); // Si quieres formatear segundos a "HH:MM:SS"
                                const isRelevant = isUserMetric(queue);
                                const isActiveQueue = countValue > 0 || lcwValue !== '00:00:00';

                            return (
                                    <div
                                        key={queue.id} // Usa el ID del grupo como key
                                        className={`rounded-xl shadow-lg py-5 px-4 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-200
                                            ${isRelevant ? 'border-2 border-purple-400' : ''}
                                            ${isActiveQueue ? 'bg-gradient-to-br from-purple-800 to-purple-600 border border-purple-400' : 'bg-gray-800'}
                                        `}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                {/* Usa el título del grupo */}
                                                <h2 className="text-gray-300 text-6xl font-semibold">{queue.title}</h2>
                                                <FcDepartment className="text-blue-400" size={70} />
                                            </div>

                                            {/* Sección para el COUNT (esto no cambia, ya que usa countValue) */}
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FiPhoneIncoming className="text-purple-400 mr-2" size={30} />
                                                        <span className="text-gray-300 text-2xl font-semibold">Calls in Queue:</span>
                                                    </div>
                                                    <p className={`text-9xl font-bold transition-all duration-200 ${isLoading ? 'text-white/60' : 'text-white'}`}>
                                                        {isLoading && countValue === 0 ? <FiLoader className="animate-spin text-purple-400" /> : countValue}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Sección para el LCW (esto no cambia, ya que usa lcwValue) */}
                                            <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <FiClock className="text-orange-400 mr-2" size={30} />
                                                    <span className="text-gray-300 text-2xl font-semibold">Longest Wait:</span>
                                                </div>
                                                <p className={`text-7xl font-bold transition-all duration-200 ${isLoading ? 'text-white/60' : 'text-white'}`}>
                                                    {isLoading && lcwValue === '00:00:00' ? <FiLoader className="animate-spin text-purple-400" /> : lcwValue}
                                                </p>
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {quote && (
                            <div className="animate-fade-in-down mt-4 text-center max-w-3xl mx-auto px-4 py-4 bg-gray-800 rounded-lg shadow-md">
                                <p className="text-3xl italic text-white">"{quote}"</p>
                                <p className="mt-2 text-lg text-purple-400">— {author}</p>
                            </div>
                        )}
                        <AgentTicker agents={agentLiveStatus} error={agentError} loading={agentLoading}/>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default QueueDashboard;