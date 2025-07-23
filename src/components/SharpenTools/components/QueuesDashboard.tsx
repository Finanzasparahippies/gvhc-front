//src/components/SharpenTools/components/QueuesDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiRefreshCw, FiAlertCircle, FiClock, FiPhoneIncoming, FiSidebar } from 'react-icons/fi';
import API from '../../../utils/API';
import { useAuth } from '../../../utils/AuthContext';
import { MdSpatialAudioOff } from "react-icons/md";
import { SlCallIn } from "react-icons/sl";
import { FcDepartment } from "react-icons/fc";
import { useCallsWebSocket } from '../../../hooks/useCallWebSocket';
import ElapsedTime from '../../../hooks/elapsedTime'; // 👈 Asegúrate de importar el nuevo componente
import { formatTime, getElapsedSeconds } from '../../../utils/helpers'

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
    const [isFetching, setIsFetching] = useState(false);
    const [quote, setQuote] = useState<string | null>(null);
    const [author, setAuthor] = useState<string | null>(null);
    const { user } = useAuth();  // Dentro de tu componente `QueueDashboard`
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // <--- CAMBIO: Estado para la barra lateral
    // const [sidebarError, setSidebarError] = useState<string | null>(null); // <--- AÑADE ESTO
    const { calls: callsOnHold, wsError } = useCallsWebSocket();

    const userQueueNames = user?.queues.map(q => q.name) || [];

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
        console.log('🔄️ Component re-rendered with new calls:', callsOnHold);
    }, [callsOnHold]);

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


        const callCountsByQueue: Record<string, number> = callsOnHold.reduce((acc, call) => {
            const queue = call.queueName;
            acc[queue] = (acc[queue] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

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
                        <button
                            onClick={handleRefreshClick} // Use the new handler
                            disabled={isFetching}
                            className="flex items-center px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <FiRefreshCw className={`mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            {isFetching ? 'Updating...' : 'Update Now'}
                        </button>
                    </div>
                </div>

                {/* <--- CAMBIO: Contenedor principal con Flexbox ---> */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* <--- CAMBIO: Barra lateral ---> */}
                    <aside className={`bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-full max-h-screen lg:w-80' : 'w-0 p-0 overflow-hidden'}`}>
                        <h2 className={`text-2xl font-bold mb-4 border-b border-gray-700 pb-2 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Patients on Hold</h2>
                        <div className={`flex-grow overflow-y-auto transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            {/* {wsError && (
                                <div className="p-3 bg-red-500/20 text-red-300 rounded-md mb-4">
                                    <p className="font-bold">WebSocket Error:</p>
                                    <p className="text-sm">{wsError}</p>
                                </div>
                            )} */}
                            {callsOnHold.length === 0 ? (
                                <p className="text-gray-400">No patients on hold.</p>
                            ) : (
                                callsOnHold
                                .sort((a, b) => getElapsedSeconds(b.startTime) - getElapsedSeconds(a.startTime)) // Sort by elapsed time (descending)
                                .map((call) => {
                                    const safeElapsed = Math.max(0, getElapsedSeconds(call.startTime));

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
                                                <h2 className="text-gray-300 text-sm font-medium">{metric.title}</h2>
                                                {/* Puedes decidir qué icono mostrar aquí, quizás uno para la cola en general */}
                                                <FcDepartment className="text-blue-400" size={24} />
                                            </div>

                                            {/* Sección para el COUNT */}
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FiPhoneIncoming className="text-purple-400 mr-2" size={20} />
                                                        <span className="text-gray-300 text-xs">Calls in Queue:</span>
                                                    </div>
                                                        <p className={`text-3xl font-bold transition-all duration-200 ${false /* countData?.loading */ ? 'text-white/60' : 'text-white'}`}>
                                                            {countValue} {/* ¡Usa countValue aquí! */}
                                                        </p>
                                                </div>
                                            </div>

                                            {/* Sección para el LCW */}
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FiClock className="text-orange-400 mr-2" size={20} />
                                                        <span className="text-gray-300 text-xs">Longest Wait:</span>
                                                    </div>
                                                        <p className={`text-3xl font-bold transition-all duration-200 ${false /* lcWData?.loading */ ? 'text-white/60' : 'text-white'}`}>
                                                            {lcwValue} {/* ¡Usa lcwValue aquí! */}
                                                        </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 h-1">
                                            { countValue && <div className="w-full bg-purple-500 h-1 rounded-full animate-pulse"></div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {quote && (
                            <div className="animate-fade-in-down mt-12 text-center max-w-xl mx-auto px-4 py-6 bg-gray-800 rounded-lg shadow-md">
                                <p className="text-xl italic text-white">"{quote}"</p>
                                <p className="mt-2 text-sm text-purple-400">— {author}</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default QueueDashboard;