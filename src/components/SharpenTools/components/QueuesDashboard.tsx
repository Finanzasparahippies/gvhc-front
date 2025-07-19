import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiAlertCircle, FiClock, FiPhoneIncoming } from 'react-icons/fi';
import sharpenAPI from '../../../utils/APISharpen';
import API from '../../../utils/API';
import { useAuth } from '../../../utils/AuthContext';



// --- CONFIGURACIÓN DE LOS WIDGETS DEL DASHBOARD ---
// Aquí defines cada tarjeta que aparecerá en el dashboard.
// Añade o quita objetos de este array para cambiar los widgets.
const dashboardMetrics: MetricConfig[] = [
    { id: 'count_appt_line', title: 'Queue Appointment Line', type: 'COUNT', queueName: 'Appointment Line RP1200' },
    { id: 'lcw_appt_line', title: 'Waiting Appointment Line', type: 'LCW', queueName: 'Appointment Line RP1200' },
    { id: 'count_es_appt_line', title: 'Queue ES-Appointment Line', type: 'COUNT', queueName: 'ES-Appointment Line RP1200' },
    { id: 'lcw_es_appt_line', title: 'Waiting ES-Appointment Line', type: 'LCW', queueName: 'Es-Appointment Line RP1200' },
    { id: 'count_medrec', title: 'Queue Medical Records', type: 'COUNT', queueName: 'Medical Records RP1260' },
    { id: 'lcw_medrec', title: 'Waiting Medical Records', type: 'LCW', queueName: 'Medical Records RP1260' },
    { id: 'count_es_med_records', title: 'Queue ES-Medical Records', type: 'COUNT', queueName: 'ES-Medical Records RP1260' },
    { id: 'lcw_es_med_records', title: 'Waiting ES-Medical Records', type: 'LCW', queueName: 'ES-Medical Records RP1260' },
    { id: 'count_provider', title: 'Queue ES-Provider Hotline', type: 'COUNT', queueName: 'Provider Hotline RP1270' },
    { id: 'lcw_provider', title: 'Waiting (ES-Provider Hotline', type: 'LCW', queueName: 'Provider Hotline RP1270' },
    { id: 'count_es_provider', title: 'Queue ES-Provider Hotline', type: 'COUNT', queueName: 'ES-Provider Hotline RP1270' },
    { id: 'lcw_es_provider', title: 'Waiting (ES-Provider Hotline', type: 'LCW', queueName: 'ES-Provider Hotline RP1270' },
    { id: 'count_transport', title: 'Queue Transportation', type: 'COUNT', queueName: 'Transportation' },
    { id: 'lcw_transport', title: 'Waiting Transportation', type: 'LCW', queueName: 'Transportation' },
    { id: 'count_dental', title: 'Queue Dental', type: 'COUNT', queueName: 'Dental' },
    { id: 'lcw_dental', title: 'Waiting Dental', type: 'LCW', queueName: 'Dental' },
    { id: 'count_referals', title: 'Queue Referrals', type: 'COUNT', queueName: 'Referals RP1250' },
    { id: 'lcw_referals', title: 'Waiting Referrals', type: 'LCW', queueName: 'Referals RP1250' },
    { id: 'count_es_referals', title: 'Queue ES-Referrals', type: 'COUNT', queueName: 'ES-Referrals RP1250' },
    { id: 'lcw_es_referals', title: 'Waiting ES-Referrals', type: 'LCW', queueName: 'ES-Referrals RP1250' },
];

// --- FUNCIÓN PARA CONSTRUIR LAS CONSULTAS SQL ---
const buildQuery = (metric: MetricConfig): string => {
    const dbTable = "`fathomvoice`.`fathomQueues`.`queueCallManager`";
    const whereClause = `(\`queue\`.\`queueName\` = "${metric.queueName}") AND (\`currentLocation\` LIKE "%PL%" OR \`currentLocation\` LIKE "%CB%")`;
    const intervals = `FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(NOW())/(5))*(5)) AS "intervals"`;

    if (metric.type === 'COUNT') {
        return `SELECT COUNT(\`queueCallManagerID\`), \`queue\`.\`queueName\` AS "Queue Name", \`currentLocation\`, ${intervals} FROM ${dbTable} WHERE ${whereClause} UNION (SELECT null, null, null, ${intervals}) LIMIT 1`;
    }
    if (metric.type === 'LCW') {
        return `SELECT SEC_TO_TIME((UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(MIN(queueEnterTime)))) AS "LCW", ${intervals} FROM ${dbTable} WHERE ${whereClause} UNION (SELECT null, ${intervals}) LIMIT 1`;
    }
    return '';
};


// --- COMPONENTE PRINCIPAL DEL DASHBOARD ---
const QueueDashboard: React.FC = () => {
    const [metricsData, setMetricsData] = useState<AllMetricsState>({});
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [quote, setQuote] = useState<string | null>(null);
    const [author, setAuthor] = useState<string | null>(null);
    const { user } = useAuth();  // Dentro de tu componente `QueueDashboard`

    const userQueueNames = user?.queues.map(q => q.name) || [];

    const isUserMetric = (metric: MetricConfig): boolean => {
        return userQueueNames.some(queueName =>
            metric.queueName.toLowerCase().includes(queueName.toLowerCase())
    );
    };

    const fetchSingleMetric = useCallback(async (metric: MetricConfig) => {
        setIsFetching(true);
        // Pone la métrica específica en estado de carga
        setMetricsData(prev => ({
            ...prev,
            [metric.id]: { ...prev[metric.id], loading: true, error: null }
        }));

        const sqlQuery = buildQuery(metric);
        if (!sqlQuery) return;

        try {
            const response: any = await sharpenAPI.post('dashboards/proxy/generic/', {
                endpoint: "V2/query/",
                payload: {
                    method: "query",
                    q: sqlQuery,
                    global: "false"
                }
            });

            const responseData = response.data?.data?.[0];
            if (!responseData) {
                throw new Error('Respuesta inesperada de la API');
            }

            let value;
            if (metric.type === 'COUNT') {
                value = responseData['countqueueCallManagerID'];
            } else if (metric.type === 'LCW') {
                value = responseData['LCW'];
            }

            const displayValue = value === null || value === undefined ? '0' : value;

            setMetricsData(prev => ({
                ...prev,
                [metric.id]: { value: displayValue, loading: false, error: null }
            }));

        } catch (error: any) {
            console.error(`Error fetching metric ${metric.id}:`, error);
            setMetricsData(prev => ({
                ...prev,
                [metric.id]: { value: null, loading: false, error: 'Error' }
            }));
        }
    }, []);

    const fetchAllMetrics = useCallback(async () => {
        setIsFetching(true);
        
        // Inicia todas las métricas en estado de carga
        setMetricsData(prev => {
            const loadingState: AllMetricsState = {};
            for (const metric of dashboardMetrics) {
                loadingState[metric.id] = { ...prev[metric.id], loading: true, error: null };
            }
            return loadingState;
        });

        const promises = dashboardMetrics.map(async (metric) => {
            const sqlQuery = buildQuery(metric);
            if (!sqlQuery) return;

            try {
                // USA TU API REAL AQUÍ
                console.log('intentando llegar a la API')
                const response: any = await sharpenAPI.post('dashboards/proxy/generic/', {
                    endpoint: "V2/query/", // <--- ADD THIS LINE! This tells the proxy where to send the SQL query.
                    payload: {
                    method: "query", // <--- Add this too, as seen in your working component for SQL queries
                    q: sqlQuery,    // <--- Change 'advanced' to 'q' and use your sqlQuery
                    global: "false" // Or 'false' (boolean) if that's what the backend expects
                }
                });

                const responseData = response.data?.data?.[0];
                if (!responseData) {
                    throw new Error('Respuesta inesperada de la API');
                }
                console.log('responseData:', responseData)
                let value;
                if (metric.type === 'COUNT') {
                    // Access the value using the correct key: 'countqueueCallManagerID'
                    value = responseData['countqueueCallManagerID'];
                } else if (metric.type === 'LCW') {
                    // Access the value using the 'LCW' key
                    value = responseData['LCW'];
                }

                // Handle null/undefined values for display
                const displayValue = value === null || value === undefined ? '0' : value;

                setMetricsData(prev => ({
                    ...prev,
                    [metric.id]: { value: displayValue, loading: false, error: null }
                }));

            } catch (error: any) {
                console.error(`Error fetching metric ${metric.id}:`, error);
                setMetricsData(prev => ({
                    ...prev,
                    [metric.id]: { value: null, loading: false, error: 'Error' }
                }));
            }
        });

        await Promise.all(promises);
        setLastUpdated(new Date());
        setIsFetching(false);
    }, []);

    // Efecto para la carga inicial y para establecer el intervalo de actualización
    useEffect(() => {
        fetchAllMetrics(); // Carga inicial
        const intervalId = setInterval(fetchAllMetrics, 15000); // Actualiza cada 15 segundos

        return () => clearInterval(intervalId); // Limpia el intervalo al desmontar
    }, [fetchAllMetrics]);

    const getIconForMetric = (type: MetricType) => {
        switch (type) {
            case 'COUNT':
                return <FiPhoneIncoming className="text-purple-400" size={24} />;
            case 'LCW':
                return <FiClock className="text-orange-400" size={24} />;
            default:
                return null;
        }
    };

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

    return (
        <div className="bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8 font-sans text-white mt-[120px] animate-fade-in-down">
            <div className="max-w-7xl mx-auto">
                {/* --- Cabecera --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                        <h1 className='text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-t from-gray-500 to-purple-600 mb-8 pb-2 border-y-4 rounded-lg border-gray-600 tracking-tight text-center'>GVHC Patient's on Queue</h1>
                        <p className="text-gray-400 mt-1">
                            Last update: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Cargando...'}
                        </p>
                    </div>
                    <button
                        onClick={fetchAllMetrics}
                        disabled={isFetching}
                        className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <FiRefreshCw className={`mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        {isFetching ? 'Updating...' : 'Update Now'}
                    </button>
                </div>

                {/* --- Grid de Métricas --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {dashboardMetrics.map((metric) => {
                        const data = metricsData[metric.id];
                        const isRelevant = isUserMetric(metric); // ⬅️ Aquí lo usamos
                        const isActiveQueue = data?.value !== '0' && data?.value !== null && data?.value !== undefined;

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
                                        {getIconForMetric(metric.type)}
                                    </div>
                                    {data?.error ? (
                                        <div className="flex items-center justify-between text-red-400">
                                            <div className="flex items-center">
                                                <FiAlertCircle className="mr-2" />
                                                <span>Error</span>
                                            </div>
                                            <button
                                                onClick={() => fetchSingleMetric(metric)}
                                                className="hover:text-white transition-colors"
                                                title="Reintentar"
                                            >
                                                <FiRefreshCw />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <p
                                                className={`text-5xl font-bold truncate transition-all duration-200 ${
                                                    data?.loading ? 'text-white/60' : 'text-white'
                                                }`}
                                                title={String(data?.value || '0')}
                                            >
                                                {data?.value ?? '0'}
                                            </p>
                                            {data?.loading && (
                                                <div className="ml-2 animate-spin text-purple-400">
                                                    <FiRefreshCw size={18} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 h-1">
                                    {data?.loading && <div className="w-full bg-purple-500 h-1 rounded-full animate-pulse"></div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                    {quote && (
                        <div className="mt-12 text-center max-w-xl mx-auto px-4 py-6 bg-gray-800 rounded-lg shadow-md">
                            <p className="text-xl italic text-white">"{quote}"</p>
                            <p className="mt-2 text-sm text-purple-400">— {author}</p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default QueueDashboard;
