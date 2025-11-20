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
import NewsTicker from "./NewsTicker";
import { useCallsSSE } from "../../../hooks/useCallsSSE";

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

    if (type === 'COUNT') {
        // Consulta COUNT simplificada
        return `SELECT COUNT(\`queueCallManagerID\`) AS "count" FROM ${dbTable} WHERE ${whereClause}`;
    }
    if (type === 'LCW') {
        // Consulta LCW simplificada
        return `SELECT SEC_TO_TIME((UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(MIN(queueEnterTime)))) AS "LCW" FROM ${dbTable} WHERE ${whereClause}`;
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
    const [isAgentTickerVisible, setIsAgentTickerVisible] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false); // <--- AÑADE ESTE ESTADO
    const dashboardRef = useRef<HTMLDivElement>(null); // <--- AÑADE ESTA REFERENCIA
    // const [sidebarError, setSidebarError] = useState<string | null>(null); // <--- AÑADE ESTO
    // const { calls: callsOnHold, isLoading, wsError } = useCallsWebSocket();
    const { callsOnHold, liveQueueStatus, isLoading, error } = useCallsSSE();
    const callsArray = callsOnHold || []; //
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

    const fetchLiveStatus = useCallback(async () => {
        setAgentLoading(true); // Start loading
        try {
            const { endpoint, payload } = QUERY_TEMPLATES.getAgents(defaultGetAgentsParams);
            const response = await sharpenAPI.post<SharpenApiResponseData>('dashboards/proxy/generic/', {
                            endpoint: endpoint, // El endpoint real de Sharpen
                            payload: payload,   // El payload real para Sharpen
            });
            // console.log("respuesta del getAgents (fetchLiveStatus):", response.data);

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
    }, [defaultGetAgentsParams]);

    useEffect(() => {
        fetchLiveStatus();
        // Agrega un intervalo para refrescar el estado de los agentes periódicamente si es un dashboard "Live"
        const intervalId = setInterval(fetchLiveStatus, 15000); // Refresca cada 15 segundos
        return () => clearInterval(intervalId); // Limpia el intervalo al desmontar el componente
    }, [fetchLiveStatus]); // Dependencia del efecto para que se ejecute si cambian los parámetros por defecto

    

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
const { counts, lcw_en, lcw_es } = useMemo(() => {
  const result: { counts: Record<string, number>, lcw_en: Record<string, number>, lcw_es: Record<string, number> } = {
    counts: {},
    lcw_en: {},
    lcw_es: {},
  };

  if (!callsArray.length) return result;

  callsArray.forEach(call => {
      const normalized = call.queueName.trim().toLowerCase();
      const unifiedId = queueIdMap[normalized];
      if (!unifiedId) return console.warn(`Queue not mapped: ${call.queueName}`);
      
      const elapsed = Number.isFinite(getElapsedSeconds(call.startTime)) ? getElapsedSeconds(call.startTime) : 0;
      const isSpanish = normalized.startsWith("es-");
      
      result.counts[unifiedId] = (result.counts[unifiedId] || 0) + 1;
      if (isSpanish) result.lcw_es[unifiedId] = Math.max(result.lcw_es[unifiedId] || 0, elapsed);
    else result.lcw_en[unifiedId] = Math.max(result.lcw_en[unifiedId] || 0, elapsed);
  });

  return result;
}, [callsArray, queueIdMap]);


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
    }, [callsArray, isLoading]); // Añade isLoading como dependencia


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

useEffect(() => {
  console.log("Calls on Hold SSE:", callsArray);
  console.log("Live Queue Status SSE:", liveQueueStatus);
}, [callsArray, liveQueueStatus]);

        const handleRefreshClick = useCallback(() => {
            // In a WebSocket-driven app, "refresh" often means re-establishing connection
            // or re-requesting initial data if the WebSocket provides it.
            // Since useCallsWebSocket handles reconnects, a simple update of lastUpdated
            // might be enough to give visual feedback.
            setLastUpdated(new Date());
            // If you had other non-WebSocket data, you would call their fetch functions here.
            // For example: fetchOtherDataViaAPI();
            // console.log("Refresh button clicked. Displaying latest WebSocket data.");
        }, []);

    return (
        <div
            ref={dashboardRef}
            className="max-w-full bg-gray-900 min-h-screen px-4 sm:p-6 lg:py-2 font-sans text-white mt-[8px] animate-fade-in-down overflow-hidden"
        >
            <div className="mx-auto">
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
                            onClick={() => setIsAgentTickerVisible((prev) => !prev)}
                            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                            title={isAgentTickerVisible ? 'Hide Agent Ticker' : 'Show Agent Ticker'}
                        >
                            <MdSpatialAudioOff className="mr-2" />
                            <span>{isAgentTickerVisible ? 'Hide Ticker' : 'Show Ticker'}</span>
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                            title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
                        >
                            <FiSidebar className="mr-2" />
                            <span>On Hold ({callsArray.length})</span>
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
                <div className="flex flex-col lg:flex-row gap-8 w-full">

                    {/* <--- CAMBIO: Barra lateral ---> */}
                    <aside className={`bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-full max-h-screen lg:w-[280px]' : 'w-0 p-0 overflow-hidden'} min-w-0`}>
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
                           {
                            (() => {
                                const sortedCalls = Array.isArray(callsArray)
                                    ? [...callsArray].sort(
                                        (a, b) => getElapsedSeconds(b.startTime) - getElapsedSeconds(a.startTime)
                                    )
                                    : [];

                                if (sortedCalls.length === 0) {
                                    return <p className="text-gray-400">No patients on hold.</p>;
                                }

                                return sortedCalls.map((call) => (
                                    <div
                                        key={call.queueCallManagerID}
                                        className="mb-4 p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg shadow-md border-l-4 border-purple-500 transition-all duration-300 ease-in-out animate-fade-in-down"
                                    >
                                        <p className="text-sm text-gray-300 flex items-center gap-2">
                                            <FcDepartment className="mr-2" /> {call.queueName}
                                        </p>
                                        <ElapsedTime startTime={call.startTime} />
                                    </div>
                                ));
                            })()
                        }

                        </div>
                    </aside>

                    {/* <--- CAMBIO: Contenido principal que se expande ---> */}
                    <main className="flex-1 min-w-0 flex flex-col transition-all duration-300 min-h-0">
                        {/* --- Grid de Métricas --- */}
                            <div className="flex-1 overflow-auto p-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-3">
                                {dashboardQueues.map((queue) => {
                                    // const data = metricsData[metric.id];
                                    const countValue = counts[queue.id] ?? 0;
                                    const lcwEnValue = formatTime(lcw_en[queue.id] ?? 0);
                                    const lcwEsValue = formatTime(lcw_es[queue.id] ?? 0);
                                    const isRelevant = isUserMetric(queue);
                                    const isActiveQueue = countValue > 0 || lcwEnValue || lcwEsValue !== '00:00:00';

                                return (
                                        <div
                                            key={queue.id} // Usa el ID del grupo como key
                                            className={`rounded-xl shadow-lg py-5 px-6 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-200
                                                ${isRelevant ? 'border-2 border-purple-400' : ''}
                                                ${isActiveQueue ? 'bg-gradient-to-br from-purple-800 to-purple-600 border border-purple-400' : 'bg-gray-800'}
                                            `}
                                        >
                                            <div>
                                                <div className="flex items-center justify-center mb-3 text-center">
                                                    {/* Usa el título del grupo */}
                                                    <h2 className="text-gray-300 text-7xl font-semibold">{queue.title}</h2>
                                                    <FcDepartment className="text-blue-400" size={60} />
                                                </div>

                                                {/* Sección para el COUNT (esto no cambia, ya que usa countValue) */}
                                                <div className="flex flex-col items-center justify-center mb-6">
                                                    <div className="flex items-center space-x-3 mb-1">
                                                            <FiPhoneIncoming className="text-purple-400 mr-2" size={30} />
                                                            <span className="text-gray-300 text-2xl font-semibold">Calls in Queue:</span>
                                                    </div>
                                                        <p className={`text-9xl font-semibold leading-none transition-colors duration-200 ${isLoading ? 'text-white/60' : 'text-white'}`}>
                                                            {isLoading && countValue === 0 ? <FiLoader className="animate-spin text-purple-400" /> : countValue}
                                                        </p>
                                                </div>

                                                {/* Sección para el LCW*/}
                                                <div className="mt-4">
                                                <div className="flex items-center mb-2 justify-center">
                                                    <FiClock className="text-orange-400 mr-2" size={26} />
                                                    <span className="text-gray-300 text-xl font-semibold select-none">Longest Wait:</span>
                                                </div>
                                                    <div className="grid grid-cols-2 gap-4 items-center justify-items-center">
                                                        <div className="flex items-center gap-2">
                                                        <span className="text-5xl select-none" role="img" aria-label="US Flag">🇺🇸</span>
                                                        <span className={`text-7xl font-semibold ${isLoading ? 'text-white/60' : 'text-white'}`}>
                                                            {isLoading && lcwEnValue === '00:00:00' ? (
                                                            <FiLoader className="animate-spin text-purple-400" />
                                                            ) : (
                                                            lcwEnValue
                                                            )}
                                                        </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                        <span className="text-5xl select-none" role="img" aria-label="Mexico Flag">🇲🇽</span>
                                                        <span className={`text-7xl font-semibold ${isLoading ? 'text-white/60' : 'text-white'}`}>
                                                            {isLoading && lcwEsValue === '00:00:00' ? (
                                                            <FiLoader className="animate-spin text-purple-400" />
                                                            ) : (
                                                            lcwEsValue
                                                            )}
                                                        </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* {quote && (
                                    <div className="animate-fade-in-down mt-4 text-center max-w-3xl mx-auto px-4 py-4 bg-gray-800 rounded-lg shadow-md min-h-[150px] max-h-full">
                                        <p className="text-5xl italic text-white">"{quote}"</p>
                                        <p className="mt-2 text-lg text-purple-400">— {author}</p>
                                    </div>
                                )} */}
                            </div>
                                <NewsTicker sourceUrl='api/dashboards/news/'/>
                            </div>
                        <div className={`transition-all duration-300 overflow-hidden ${isAgentTickerVisible ? 'max-h-96 mt-4' : 'max-h-0 mt-0'}`}>
                                {isAgentTickerVisible && (
                                    <AgentTicker agents={agentLiveStatus} error={agentError} loading={agentLoading}/>
                                )}
                        </div>
                        </main>
                </div>
            </div>
        </div>
    );
};

export default QueueDashboard;