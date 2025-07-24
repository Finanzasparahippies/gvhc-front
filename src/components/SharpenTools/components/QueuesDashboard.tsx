//src/components/SharpenTools/components/QueuesDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiRefreshCw, FiAlertCircle, FiClock, FiPhoneIncoming, FiSidebar, FiLoader } from 'react-icons/fi';
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

interface QueueConfig {
    id: string; // Un ID único para la tarjeta
    title: string; // Título de la tarjeta (ej: 'Appointment Line')
    queueName: string; // Nombre de la cola real en la DB
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
    { id: 'appt_line', title: 'Appointment Line', queueName: 'Appointment Line RP1200' },
    { id: 'es_appt_line', title: 'ES-Appointment Line', queueName: 'ES-Appointment Line RP1200' },
    { id: 'medrec', title: 'Medical Records', queueName: 'Medical Records RP1260' },
    { id: 'es_med_records', title: 'ES-Medical Records', queueName: 'ES-Medical Records RP1260' },
    { id: 'provider', title: 'Provider Hotline', queueName: 'Provider Hotline RP1270' },
    { id: 'es_provider', title: 'ES-Provider Hotline', queueName: 'ES-Provider Hotline RP1270' },
    { id: 'transport', title: 'Transportation', queueName: 'Transportation' },
    { id: 'dental', title: 'Dental', queueName: 'Dental' },
    { id: 'referals', title: 'Referrals', queueName: 'Referals RP1250' },
    { id: 'es_referals', title: 'ES-Referrals', queueName: 'ES-Referrals RP1250' },
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
    // const [sidebarError, setSidebarError] = useState<string | null>(null); // <--- AÑADE ESTO
    const { calls: callsOnHold, isLoading, wsError } = useCallsWebSocket(); 
    const userQueueNames = user?.queues.map(q => q.name) || [];
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
                console.warn("Unexpected response format in getAgents (fetchLiveStatus):", response.data);
                setAgentLiveStatus([]);
                setAgentError("Failed to fetch agent live status. Unexpected data format.");
            }
            setAgentError(null);
        } catch (error) {
            console.error("Error fetching liveStatus (getAgents):", error);
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


    const longestWaitTimesByQueue = useMemo(() => {
        console.log('🔄 Recalculando LCW desde WebSocket...');
        const lcw: { [queueName: string]: number } = {};
        for (const call of callsOnHold) {
            const elapsed = getElapsedSeconds(call.startTime);
            if (elapsed > (lcw[call.queueName] || 0)) {
                lcw[call.queueName] = elapsed;
            }
        }
        // Convertir segundos a formato "HH:MM:SS" si es necesario para mostrar
        const formattedLcw: { [queueName: string]: string } = {};
        for (const queueName in lcw) {
            formattedLcw[queueName] = formatTime(lcw[queueName]);
        }
        return formattedLcw;
    }, [callsOnHold]); // Depende de callsOnHold

    const isUserMetric = (queueConfig: QueueConfig): boolean => {
        return userQueueNames.some(queueName =>
            queueConfig.queueName.toLowerCase().includes(queueName.toLowerCase())
        );
    };

    useEffect(() => {
        // Establecer la última actualización cuando callsOnHold cambie y no esté cargando
        console.log('🔄️ Component re-rendered with new calls:', callsOnHold);
        if (!isLoading) {
            setLastUpdated(new Date());
        }
    }, [callsOnHold, isLoading]); // Añade isLoading como dependencia

    const countsFromWebSocket = useMemo(() => {
        console.log('🔄 Recalculando conteos desde WebSocket...');
        const counts: { [queueName: string]: number } = {};
        for (const call of callsOnHold) {
            counts[call.queueName] = (counts[call.queueName] || 0) + 1;
        }
        return counts;
    }, [callsOnHold]);

    useEffect(() => {
        const fetchQuote = async () => {
                try {
                    const response = await API.get<QuoteResponse | QuoteResponse[]>('api/dashboards/quote/');
                    const data = response.data;
                    console.log('quote:', data)
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
                        console.error('Error fetching quote:', error);
                    }
                };

            fetchQuote();

            const intervalId = setInterval(fetchQuote, 300000); // Llama cada 5 min
            return () => clearInterval(intervalId); // Limpia el intervalo al desmontar
        }, []);

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
        <div className="bg-gray-900 min-h-screen p-4 sm:p-6 lg:py-6 font-sans text-white mt-[120px] animate-fade-in-down">
            <div className="max-w-full mx-auto">
                {/* --- Cabecera --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                        <h1 className='text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-t from-gray-500 to-purple-600 mb-4 pb-2'>GVHC Patient's on Queue</h1>
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
                    <aside className={`bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-full max-h-screen lg:w-80' : 'w-0 p-0 overflow-hidden'}`}>
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
                                            <p className="text-sm text-gray-300 flex items-center gap-2">
                                                <SlCallIn className='mr-2'/> {call.callbackNumber}
                                            </p>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                            {dashboardQueues.map((metric) => {
                                // const data = metricsData[metric.id];
                                const countValue = countsFromWebSocket[metric.queueName] ?? 0;
                                const lcwValue = longestWaitTimesByQueue[metric.queueName] ?? '00:00:00'; // Usa el LCW calculado del WebSocket
                                const isRelevant = isUserMetric(metric);
                                const isActiveQueue = countValue > 0 || lcwValue !== '00:00:00';

                                return (
                                    <div
                                        key={metric.id}
                                        className={`rounded-xl shadow-lg py-5 px-4 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-200
                                            ${isRelevant ? 'border-2 border-purple-400' : ''}
                                            ${isActiveQueue ? 'bg-gradient-to-br from-purple-800 to-purple-600 border border-purple-400' : 'bg-gray-800'}
                                        `}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h2 className="text-gray-300 text-2xl font-semibold">{metric.title}</h2>
                                                {/* Puedes decidir qué icono mostrar aquí, quizás uno para la cola en general */}
                                                <FcDepartment className="text-blue-400" size={24} />
                                            </div>

                                            {/* Sección para el COUNT */}
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FiPhoneIncoming className="text-purple-400 mr-2" size={30} />
                                                        <span className="text-gray-300 text-lg font-semibold">Calls in Queue:</span>
                                                    </div>
                                                        <p className={`text-3xl font-bold transition-all duration-200 ${isLoading ? 'text-white/60' : 'text-white'}`}>
                                                        {isLoading && countValue === 0 ? <FiLoader className="animate-spin text-purple-400" /> : countValue} {/* Modificado para countValue */}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Sección para el LCW */}
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FiClock className="text-orange-400 mr-2" size={30} />
                                                        <span className="text-gray-300 text-lg font-semibold">Longest Wait:</span>
                                                    </div>
                                                        <p className={`text-3xl font-bold transition-all duration-200 ${isLoading ? 'text-white/60' : 'text-white'}`}>
                                                            {isLoading && lcwValue === '00:00:00' ? <FiLoader className="animate-spin text-purple-400" /> : lcwValue} {/* Modificado para lcwValue */}
                                                        </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* {agentLiveStatus.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="text-xl font-semibold text-white mb-4">Agent Live Status</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {agentLiveStatus.map((agent, index) => (
                                            <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md">
                                                <p><span className="font-bold text-purple-400">Agent:</span> {agent.fullName}</p>
                                                <p><span className="font-bold text-purple-400">Queue:</span> {agent.queueName}</p>
                                                <p><span className="font-bold text-purple-400">Status:</span> {agent.status}</p>
                                                <p><span className="font-bold text-purple-400">Duration:</span> {agent.statusDuration}</p>
                                                {agent.interactionType && <p><span className="font-bold text-purple-400">Interaction:</span> {agent.interactionType}</p>}
                                                {agent.callType && <p><span className="font-bold text-purple-400">Call Type:</span> {agent.callType}</p>}
                                                {agent.pauseReason && <p><span className="font-bold text-purple-400">Pause Reason:</span> {agent.pauseReason}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )} */}
                        </div>
                        {quote && (
                            <div className="animate-fade-in-down mt-12 text-center max-w-xl mx-auto px-4 py-6 bg-gray-800 rounded-lg shadow-md">
                                <p className="text-xl italic text-white">"{quote}"</p>
                                <p className="mt-2 text-sm text-purple-400">— {author}</p>
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