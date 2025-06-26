import React, { useState, useEffect, startTransition, useCallback, useMemo } from 'react';
import { saveAs } from 'file-saver';
import sharpenAPI from '../../../utils/APISharpen'

        const SERVERS = ['fathomvoice', 'fathomrb'];
        const DATABASES: { [ key: string]: string [] } = {
            fathomvoice: ['fathomQueues', 'sipMonitor'],
            fathomrb: ['fathomrb'],
        };
        const TABLES: { [ key: string]: string [] } = {
            fathomQueues: ['queueCDR', 'queueCDRLegs', 'queueADR', 'queueAgents'],
            sipMonitor: ['sipLatency', 'sipLatencyTotals'],
            fathomrb: ['userGroups'],
        };

        const QUERY_TEMPLATES = {
            agentStatus: (username?: string) => ({
                endpoint: "V2/queues/getAgentStatus/", 
                payload: {
                    username: username, 
                    // Otros campos del payload si los necesitas para esta llamada específica
                    // findRoomStats: "",
                    // checkInCall: "",
                    // qAccess: "",
                    // getLatency: "",
                    // Estos campos se añadirán al `full_payload` en tu backend automáticamente
                    // debido a la línea `**sharpen_payload`
                }
            }),
            liveStatus: () => ({
                endpoint: "V2/query/",
                payload: {
                    method: "query",
                    q: `
                        SELECT 
                            \`queueCallManagerID\`, \`queue\`.\`queueName\` AS "Logged in Qs", 
                            \`queueCallManager\`.\`answerTime\` AS "Answer Time", 
                            \`username\`, 
                            SEC_TO_TIME(UNIX_TIMESTAMP(NOW())-UNIX_TIMESTAMP(\`lastStatusChange\`)) AS "Status duration", 
                            SUM(\`lastStatusChange\` >= NOW() - INTERVAL 12 HOUR AND paused = 1 AND status = "active") AS "Paused Agents", 
                            SUM(\`lastStatusChange\` >= NOW() - INTERVAL 12 HOUR AND status != "offline" AND status != "active") AS "Interacting Agents", 
                            SUM(\`lastStatusChange\` >= NOW() - INTERVAL 12 HOUR AND paused = 0 AND status = "active") AS "Available Agents", 
                            SUM(\`status\` != "offline" AND \`lastStatusChange\` >= NOW() - INTERVAL 12 HOUR) AS "Active Agents", 
                            \`queueCallManager\`.\`commType\` AS "Interaction Type", 
                            \`callType\`, \`pauseReason\`, \`paused\`, FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(NOW())/(5))*(5)) AS "intervals" 
                        FROM \`fathomvoice\`.\`fathomQueues\`.\`queueAgents\`
                        GROUP BY \`queueCallManagerID\` 
                        LIMIT 5000 UNION (SELECT null, null, null, null, null, null, null, null, null, null, null, null, null,
                        FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(NOW())/(5))*(5)) AS "intervals") 
                        LIMIT 1
                        `,
                    global: false

            }
        }),
            cdrReport: (server: string, database: string, table: string, startDate: string, endDate: string) => ({
                endpoint: "V2/query/", // Sigue usando el endpoint genérico para consultas SQL
                payload: {
                    method: "query", // Asegúrate de que el método sea 'query' para las consultas SQL
                    q: `
                        SELECT
                        queueCallManagerID, answerTime, endTime, agentName, waitTime, agentTalkTime, agentHoldTime, wrapup, segmentNumber, queueName, username, transferToData, commType
                        FROM ${server}.${database}.${table}
                        WHERE endTime BETWEEN '${startDate}' AND '${endDate}'
                    `,
                }
            }),

        customSqlQuery: () => ({
            payload: {
                method:"query",
            }
        }),

        

        getAgents: (params: {
        getActiveCalls?: boolean;
        getDayCallCount?: boolean;
        queueLogin?: boolean;
        onlineOnly?: boolean;
        orderBy?: 'asc' | 'desc';
        orderByCol?: string;
    }) => ({
        endpoint: "V2/queues/getAgents/",
        payload: {
            ...params,
        }
    }),
    getCdrDetails: (uniqueID: string) => ({
        endpoint: 'V2/queues/getCdrDetails/',
        payload: {
            queueCallManagerID: uniqueID,
            getRecording: "false", 
            getNotes: "",
            getTranscription: "",
        }
    }),
    getInteraction: (queueCallManagerID: string, uKey: string) => ({
        endpoint: 'V2/queues/getInteraction/',
        payload: {
            queueCallManagerID: queueCallManagerID,
            uKey: uKey, // You'll need to pass the user's uKey
            // cKey1 and cKey2 are typically handled by your backend proxy.
            // If not, you'd need to add them here and ensure your frontend has access.
        }
    }),

    getCallDetails: (queueCallManagerID: string, extension: string, answerTime: string) => ({
        endpoint: 'V2/voice/cdr/getCalls//',
        payload: {
            queueCallManagerID: queueCallManagerID,
            extension: extension, // You'll need to pass the user's uKe
            answerTime: answerTime
            // cKey1 and cKey2 are typically handled by your backend proxy.
            // If not, you'd need to add them here and ensure your frontend has access.
        }
    }),

    getAwsObjectLink: (fileName: string) => ({
        endpoint: 'V2/aws/getObjectLink/',
        payload: {
            bucketName: 'mixrec', // As per documentation
            fileName: fileName,
            // cKey1 and cKey2 are typically handled by your backend proxy.
            // If not, you'd need to add them here and ensure your frontend has access.
        }
    })
}


    const SharpenQueryReport: React.FC = () => {
        //estados para seleccionar datos
        const [selectedQueryTemplate, setSelectedQueryTemplate] = useState<keyof typeof QUERY_TEMPLATES>('agentStatus'); // Nuevo estado para seleccionar la plantilla
        const [server, setServer] = useState(SERVERS[0]);
        const [database, setDataBase] = useState(DATABASES[server][0]);
        const [table, setTable] = useState(TABLES[database][0]);
        const [customQuery, setCustomQuery] = useState(''); // Ahora 'advancedQuery' se llama 'customQuery' para mayor claridad
        // const [advancedQuery, setAdvancedQuery] = useState(productionQueryExample);
        //estados para las fechas
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');
        const [useCurrentEndDate, setUseCurrentEndDate] = useState(false);
        //estados para la UI y datos de usuario
        const [data, setData] = useState<RowData[]>([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [response, setResponse] = useState<responseData | null>(null);
        const [fetchedCount, setFetchedCount] = useState(0);
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 100;
        const [monitoringStatus, setMonitoringStatus] = useState<{message: string, type: 'info' | 'error' | 'success'} | null>(null);
        const [agentUsername, setAgentUsername] = useState<string>(''); // Add this line
        const [getAgentsParams, setGetAgentsParams] = useState({
        getActiveCalls: true,
        getDayCallCount: true,
        queueLogin: true,
        onlineOnly: true,
        orderBy: 'asc' as 'asc' | 'desc',
        orderByCol: 'activeCall',
        });
        const [agentStatusData, setAgentStatusData] = useState<RowData | null>(null);
        const [userUKey, setUserUKey] = useState<string>('YOUR_USER_UKEY_HERE'); // <--- IMPORTANT: Replace with actual uKey



        const getLocalDatetimeString = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        // No incluimos segundos o milisegundos si el input es solo hasta minutos
        // Si tu input es 'datetime-local' y no 'datetime-local-seconds', entonces no necesitas segundos.
        // Si lo necesitas, añade: const seconds = date.getSeconds().toString().padStart(2, '0');
        // Y concaténalos: `${hours}:${minutes}:${seconds}`
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

        useEffect(() => {
            setDataBase(DATABASES[server][0]);
        }, [server]);

        useEffect(() => {
            setTable(TABLES[database][0]);
        }, [database]);

        useEffect(() => {
        if (useCurrentEndDate) {
                const now = new Date()
                // Usamos la nueva función para obtener la hora local correcta
                setEndDate(getLocalDatetimeString(now));
            }
        }, [useCurrentEndDate]);

        const isValidRange = () => {
            return startDate && endDate && new Date(startDate) <= new Date(endDate);
        };

        const fetchData = useCallback(async () => {
            setLoading(true);
            setError(null);
            setData([]);
            setResponse(null);
            setFetchedCount(0);
            setCurrentPage(1);
            setMonitoringStatus(null); // Limpiar status de monitoreo en nueva búsqueda
        // Generar la consulta basada en la selección
            let apiEndpoint: string;
            let apiPayload: { [key: string]: any; }; // Definimos el tipo del payload
        if (selectedQueryTemplate === 'liveStatus') { // Creamos una nueva plantilla para la consulta directa
                    const { endpoint, payload } = QUERY_TEMPLATES.liveStatus();
            apiEndpoint = endpoint;
            apiPayload = payload;
        } else if (selectedQueryTemplate === 'cdrReport') {
            if (!isValidRange()) {
                alert('Para el reporte CDR, selecciona un rango de fechas válido.');
                setLoading(false);
                return;
            }
            const { endpoint, payload } = QUERY_TEMPLATES.cdrReport(server, database, table, startDate, endDate);
            apiEndpoint = endpoint;
            apiPayload = payload;
        } else if (selectedQueryTemplate === 'agentStatus') {
            const { endpoint, payload } = QUERY_TEMPLATES.agentStatus(agentUsername);
            apiEndpoint = endpoint;
            apiPayload = payload;
        } else if (selectedQueryTemplate === 'getAgents') { // --- NUEVO: Manejar la plantilla getAgents ---
            const { endpoint, payload } = QUERY_TEMPLATES.getAgents(getAgentsParams);
            apiEndpoint = endpoint;
            apiPayload = payload;
        } else {
            alert('Selecciona una plantilla de consulta válida.');
            setLoading(false);
            return;
        }
    

    try {
        // Usa el endpoint genérico de tu backend y pasa el endpoint de Sharpen y el payload
        const apiResponse = await sharpenAPI.post<responseData>('dashboards/proxy/generic/', {
            endpoint: apiEndpoint, // Este es el endpoint de Sharpen (ej. V2/query/ o V2/queues/getAgentStatus/)
            payload: apiPayload, // Este es el payload que Sharpen espera
        });

        const resp = apiResponse.data;
        let extractedData: RowData[] = [];

        // Para el endpoint de Agent Status, la data viene directamente en `getAgentStatusData`
        if (selectedQueryTemplate === 'getAgents') {
            if (resp && resp.getAgentsStatus === "Complete" && resp.getAgentsData) {
                    extractedData = Array.isArray(resp.getAgentsData) ? resp.getAgentsData : [resp.getAgentsData];
                } else {
            setError("No se pudieron obtener los datos de los agentes.");
            }
        }else if (selectedQueryTemplate === 'agentStatus') {
                // Para 'agentStatus', la respuesta es un objeto único dentro de `getAgentStatusData`
                if (resp && resp.getAgentStatusStatus  === "Complete" && resp.getAgentStatusData) {
                    extractedData = [resp.getAgentStatusData]; // Siempre se espera un único objeto, lo envolvemos en un array
                } else {
                    setError("No se pudieron obtener los datos del agente (agentStatus).");
                }
            }
        else if (selectedQueryTemplate === "liveStatus" || selectedQueryTemplate === "cdrReport") {
            if (resp?.data && Array.isArray(resp.data)) {
                // Envuelve el objeto en un array para que sea consistente con la tabla
                extractedData = Array.isArray(resp.data) ? resp.data : [resp.data];
            } else if (resp?.table && typeof resp.table === 'string') {
                try {
                const tableData = JSON.parse(resp.table);
                if (Array.isArray(tableData)) {
                    extractedData = tableData;
                }
            } catch (e) {
                console.error("Error al parsear el JSON de la clave 'table':", e);
                setError("La respuesta de la API contenía una tabla mal formada.");
            }
            } else {
                setError("La consulta no devolvio el formato esperados.");
            }
        } else if (resp?.raw_response) {
        setResponse({ raw_response: resp.raw_response } as responseData);
        } else {
            throw new Error('Formato de respuesta no reconocido o plantilla no manejada.');
        }

            console.log("Primer resultado (procesado):", extractedData?.[0]);

            let filteredData = extractedData; // Por defecto, usamos todos los datos extraídos.

            if (selectedQueryTemplate === 'liveStatus') {
                filteredData = extractedData.filter(row => 
                    row.queueCallManagerID !== null && row.queueCallManagerID !== undefined
                );
            }
        console.log("Datos finales para renderizar:", filteredData);

        startTransition(() => {
            setData(filteredData);
            setAgentStatusData(filteredData[0] || null);
            setFetchedCount(filteredData.length);
            if (filteredData.length > 0) {
                setResponse({ status: 'Complete', data: filteredData });
            }
        });

    } catch (err: any) {
        console.error(err);
        setError(`Error al consultar la API: ${err.message || 'Revisa la consola para más detalles.'}`);
        if (err.response && err.response.data) {
            const apiError = err.response.data.error || 'Error desconocido';
            const details = err.response.data.details || '';
            setError(`Error de la API: ${apiError} - ${details}`);
        }
    } finally {
        setLoading(false);
    }
}, [customQuery, selectedQueryTemplate, isValidRange, startDate, endDate, server, database, table, agentUsername]); 

    const startMonitoringCall = async (queueCallManagerID: string, extension: string) => {
            if (!queueCallManagerID || !extension) {
                alert("Falta el ID de la llamada o la extensión del agente para poder monitorear.");
                return;
            }
            
            setMonitoringStatus({ message: 'Iniciando conexión de monitoreo...', type: 'info' });

            try {
                const response = await sharpenAPI.post<responseData>('dashboards/proxy/generic/', {
                    endpoint: 'V2/queueCallManager/listen', 
                    payload: {
                        queueCallManagerID: queueCallManagerID,
                        extension: extension,
                    }
                });

                if (response.data?.status === 'Complete') {
                    setMonitoringStatus({ message: '¡Conexión de monitoreo iniciada! Revisa tu cliente SharpenQ.', type: 'success' });
                } else {
                    const description = response.data?.description || 'La API no devolvió una descripción.';
                    setMonitoringStatus({ message: `Error al iniciar: ${description}`, type: 'error' });
                }

            } catch (err: any) {
                console.error("Error al iniciar el monitoreo:", err);
                let errorMessage = "Ocurrió un error en el servidor al intentar monitorear.";
                if (err.response?.data?.details) {
                    errorMessage = `Error del servidor: ${err.response.data.details}`;
                } else if(err.response?.data?.error) {
                    errorMessage = `Error del servidor: ${err.response.data.error}`;
                }
                setMonitoringStatus({ message: errorMessage, type: 'error' });
            }
        };

     // Coloca esta función dentro de tu componente SharpenQueryReport,
// justo antes de la sección del return.

const downloadCSV = () => {
    // 1. No hacer nada si no hay datos
    if (!data.length) {
        alert("No hay datos para descargar.");
        return;
    }

    /**
     * Función auxiliar para formatear de forma segura cada celda del CSV.
     * @param value - El valor de la celda, puede ser de cualquier tipo.
     * @returns Un string formateado y seguro para CSV.
     */
    const formatCsvCell = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return value.toString();
    };


    /**
     * @param value - El valor de la celda ya convertido a string.
     * @returns El valor final listo para ser insertado en el CSV.
     */
    const escapeCsvCell = (value: string): string => {
        // Reemplaza cualquier comilla doble interna con dos comillas dobles.
        const escapedValue = value.replace(/"/g, '""');
        // Envuelve todo el valor en comillas dobles.
        return `"${escapedValue}"`;
    };

    try {
        // 2. Obtener las cabeceras de la primera fila de datos.
        const headers = Object.keys(data[0]);
        
        // 3. Crear la fila de cabeceras para el CSV.
        const headerRow = headers.map(escapeCsvCell).join(',');

        // 4. Mapear cada fila de datos al formato CSV.
        const dataRows = data.map((row) =>
            headers.map((header) => {
                const cellValue = formatCsvCell(row[header]);
                return escapeCsvCell(cellValue);
            }).join(',')
        );

        // 5. Unir la cabecera y las filas de datos con saltos de línea.
        const csvContent = [headerRow, ...dataRows].join('\n');

        // 6. Crear un nombre de archivo dinámico y descriptivo.
        const fileName = (startDate && endDate)
            ? `reporte_sharpen_${startDate.split('T')[0]}_a_${endDate.split('T')[0]}.csv`
            : `reporte_sharpen_${new Date().toISOString().split('T')[0]}.csv`;

        // 7. Crear el Blob y iniciar la descarga.
        // Se añade un BOM para asegurar la correcta interpretación de caracteres UTF-8 en Excel.
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        console.log(new Date("2025-06-17T08:36:08Z").toLocaleString());
        console.log(new Date("2025-06-17T15:22:25Z").toISOString());

        
        saveAs(blob, fileName);

    } catch (error) {
        console.error("Error al generar el CSV:", error);
        alert("Ocurrió un error al generar el archivo CSV. Revisa la consola para más detalles.");
    }
};

const fetchCallAudio = async (row: RowData, rowIndex: number) => {
    console.log('Attempting to fetch audio for row:', row);

    const callId = row.queueCallManagerID;
    const answerTime = row.answerTime;
    const extension = row.extension;

    console.log(callId)
    console.log(answerTime)
    console.log(extension)

    // if (!callId) {
    //     alert("No hay un ID de llamada para buscar.");
    //     return;
    // }
    // if (!extension) {
    //     alert("No se encontró la extensión del agente para la llamada.");
    //     return;
    // }   
    // if (!answerTime) {
    //     alert("No se encontró el tiempo de respuesta (answerTime) de la llamada.");
    //     return;
    // }
    let finalAudioUrl: string | null = null; // Variable para almacenar la URL final

    const callDateTimeStr = row.answerTime || row.endTime || row.startTime;
    if (!callDateTimeStr) {
        alert("No se encontró la fecha de la llamada para verificar su antigüedad.");
        return;
    }

    const callDate = new Date(callDateTimeStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - callDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(`Llamada con ID ${callId} tiene ${diffDays} días de antigüedad.`);

    try {
        // Para llamadas recientes (<= 4 días), la lógica parece ser diferente y puede que
        // requiera la creación explícita de la URL. Mantenemos esto igual.
        if (diffDays <= 4) {
            console.log(`Llamada reciente (<= 4 días). Creando URL con createRecordingURL.`);
            
            const response = await sharpenAPI.post<RecordingUrlResponse>(
                'dashboards/proxy/generic/',
                {
                    endpoint: 'V2/voice/callRecordings/createRecordingURL',
                    payload: {
                        queueCallManagerID: callId,
                        // Para llamadas recientes, a menudo se usa el mismo ID
                        uniqueID: callId 
                    }
                }
            );

            if (response.data?.status === 'successful' && response.data.url) {
                finalAudioUrl = response.data.url;
            } else {
                console.warn(`createRecordingURL para llamada reciente falló: ${response.data?.description || 'Respuesta no válida'}. Intentando método para llamadas antiguas.`);
                alert(`Error al generar la URL para la grabación reciente: ${response.data.description || 'Respuesta no válida de la API.'}`);
            }

        } 
        if (!finalAudioUrl) {
            // --- LÓGICA CORREGIDA PARA LLAMADAS ANTIGUAS ---
            console.log(`Llamada antigua (> 4 días). Buscando detalles con getCdrDetails.`);
            
            const { endpoint: interactionEndpoint, payload: interactionPayload  } = QUERY_TEMPLATES.getCdrDetails(callId);
            const interactionResponse = await sharpenAPI.post<any>('dashboards/proxy/generic/', { // Usamos <any> para flexibilidad
                endpoint: interactionEndpoint,
                payload: interactionPayload,
            });

            console.log('ApiResponse:', interactionResponse.data);

            const mixmonFileName = interactionResponse.data?.data?.cdr?.mixmonFileName;
            const extension = interactionResponse.data?.data?.cdr?.extension;


            if (!mixmonFileName && !extension) {
                    alert(`No se pudo obtener el 'mixmonFileName' de la API 'getInteraction' para la llamada con ID: ${callId}.`);
                    return;
                }
            console.log(`mixmonFileName obtenido: ${mixmonFileName}`);
            console.log(`extension obtenida: ${extension}`);

            console.log(`Obteniendo URL temporal de AWS S3 con getObjectLink.`);
                
            const { endpoint: awsEndpoint, payload: awsPayload } = QUERY_TEMPLATES.getAwsObjectLink(mixmonFileName);
            const awsResponse = await sharpenAPI.post<RecordingUrlResponse>('dashboards/proxy/generic/', {
                endpoint: awsEndpoint,
                payload: awsPayload,
            });
            console.log('AWS Object Link Response:', awsResponse.data);

            
            if (awsResponse.data?.status === 'successful' && awsResponse.data.url) {
                finalAudioUrl = awsResponse.data.url;
                console.log(`URL de AWS S3 obtenida y limpia: ${finalAudioUrl}`);
            } else {
                alert(`Error al generar la URL de la grabación (vía fallback): ${awsResponse.data.description || 'Respuesta no válida de la API.'}`);
                return
            }
        }
    } catch (err: any) {
        console.error("Error in audio fetching process:", err);
        alert("Ocurrió un error al obtener la grabación. Revisa la consola para más detalles.");
        return;
    }

    // 3. USA LA URL FINAL (si se obtuvo)
    if (finalAudioUrl) {
        console.log(`Frontend: Abriendo URL de grabación obtenida: ${finalAudioUrl}`);
        setData(currentData => {
            const newData = [...currentData];
            const globalIndex = ((currentPage - 1) * itemsPerPage) + rowIndex;
            if (newData[globalIndex]) {
                newData[globalIndex].recordingUrl = finalAudioUrl;
            }
            return newData;
        });
        window.open(finalAudioUrl, '_blank');
    } else {
        alert("No se pudo obtener la URL final del audio. Por favor, inténtalo de nuevo.");
    }
};

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = useMemo(() => data.slice(indexOfFirstItem, indexOfLastItem), [data, indexOfFirstItem, indexOfLastItem]);
        const totalPages = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);

        return (
        <div className='p-6 max-w-screen-xl mx-auto mt-[100px]'>
            <h2 className='text-2xl font-semibold mb-6 text-white'>Generador de Reportes GVHC</h2>

            {/* --- SELECCIÓN DE PLANTILLA DE CONSULTA O CONSULTA AVANZADA --- */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md sharpen-query-report-container">
                <label htmlFor="queryTemplateSelect" className="text-lg font-medium text-white mb-3 block">
                    Seleccionar Tipo de Reporte
                </label>
                <select
                    id="queryTemplateSelect"
                    value={selectedQueryTemplate}
                    onChange={e => {
                        const templateName = e.target.value as keyof typeof QUERY_TEMPLATES | 'cdrReport';
                        setSelectedQueryTemplate(templateName);
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm mb-4 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="agentStatus">Buscar por Agente</option>
                    <option value="cdrReport">Reporte CDR (Detalle de Llamadas)</option>
                    <option value="liveStatus">Live Queue</option>
                    <option value="getAgents">Estado de Agentes (Tiempo Real)</option>
                </select>
            </div>
            <div>
                <textarea
                    id="customQueryTextarea"
                    value={customQuery}
                    onChange={e => {
                        setCustomQuery(e.target.value);
                        // Al escribir una consulta personalizada, deseleccionar la plantilla
                        if (e.target.value !== '') {
                            setSelectedQueryTemplate('agentStatus'); // O algún valor por defecto que no use los selectores
                        }
                    }}
                    placeholder="Si este campo tiene texto, se ejecutará esta consulta directamente."
                    className="w-full h-36 p-3 border border-gray-300 bg-gray-700 text-white rounded-md text-sm font-mono resize-y focus:ring-blue-500 focus:border-blue-500"
                />
            </div>


            {/* --- SECCIÓN DE SELECCIÓN DE DATOS (CONDICIONAL SEGÚN PLANTILLA/CUSTOM QUERY) --- */}
            
                    {selectedQueryTemplate === 'agentStatus' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="agentUsernameInput" style={{ marginRight: '0.5rem' }}>
                                Nombre de Usuario del Agente:
                            </label>
                            <input
                                type="text"
                                id="agentUsernameInput"
                                value={agentUsername}
                                onChange={(e) => setAgentUsername(e.target.value)}
                                placeholder="Ej. 273con10086"
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                    )}
                    {selectedQueryTemplate === 'cdrReport' && (
                <div style={{ marginBottom: '15px' }}>
                    <h3>Configuración de CDR:</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="server-select" style={{ marginRight: '10px' }}>Servidor:</label>
                        <select id="server-select" value={server} onChange={(e) => setServer(e.target.value)}>
                            {SERVERS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="database-select" style={{ marginRight: '10px' }}>Base de Datos:</label>
                        <select id="database-select" value={database} onChange={(e) => setDataBase(e.target.value)}>
                            {DATABASES[server]?.map((db) => (
                                <option key={db} value={db}>{db}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="table-select" style={{ marginRight: '10px' }}>Tabla:</label>
                        <select id="table-select" value={table} onChange={(e) => setTable(e.target.value)}>
                            {TABLES[database]?.map((tbl) => (
                                <option key={tbl} value={tbl}>{tbl}</option>
                            ))}
                        </select>
                    </div>
                    <label htmlFor="startDate" style={{ marginRight: '10px' }}>Fecha y Hora de Inicio:</label>
                    <input
                        type="datetime-local"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-200">
                    Fecha Final:
                </label>                    <input
                        type="datetime-local"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 block w-[200px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={useCurrentEndDate} // Deshabilita si se usa la fecha actual
                    />
                    <label htmlFor="useCurrentEndDate" className="ml-2 block text-sm text-gray-200">
                        <input
                            type="checkbox"
                            checked={useCurrentEndDate}
                            onChange={(e) => setUseCurrentEndDate(e.target.checked)}
                        />
                        Usar fecha y hora actual para el fin
                    </label>
                </div>
            )}
            
            {/* --- BOTONES DE ACCIÓN --- */}
            <div className='flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg shadow-md'>
                <button
                    onClick={fetchData}
                    disabled={loading || (selectedQueryTemplate === 'cdrReport' && !customQuery && !isValidRange())} // Disable if CDR and dates are invalid
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Ejecutar Consulta'}
                </button>
                <button
                    onClick={downloadCSV}
                    disabled={data.length === 0 || loading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
                >
                    Descargar CSV ({data.length.toLocaleString()} registros)
                </button>
            </div>

            {/* --- ESTADO DE MONITOREO Y MENSAJES --- */}
            {monitoringStatus && (
                <div className={`p-4 my-4 rounded-lg text-white font-medium shadow-md ${
                    monitoringStatus.type === 'error' ? 'bg-red-600' :
                    monitoringStatus.type === 'success' ? 'bg-green-600' :
                    'bg-blue-600'
                }`}>
                    {monitoringStatus.message}
                </div>
            )}

            {error && (
                <div className="bg-red-800 text-white p-4 rounded-lg mb-6 shadow-md border border-red-700">
                    <p className="font-bold mb-2">¡Error en la consulta!</p>
                    <p>{error}</p>
                    <p className="text-sm text-gray-300 mt-2">Por favor, revisa tu consulta o los parámetros seleccionados e inténtalo de nuevo.</p>
                </div>
            )}
            {loading && (
                <p className="text-white text-lg font-medium text-center my-8">
                    <span className="animate-pulse">Cargando datos...</span> Esto puede tomar unos segundos.
                </p>
            )}

            {/* --- SECCIÓN DE RESULTADOS DE LA TABLA --- */}
            {data.length > 0 ? (
                <div style={{ marginTop: '20px' }}>
                    <h2>Resultados ({fetchedCount} filas)</h2>
                    <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="text-gray-100 uppercase bg-gray-700 sticky top-0 z-10">
                            <tr className="">
                                {/* COLUMNA DE ACCIONES - ¡AQUÍ ESTÁ EL CAMBIO! */}
                                <th scope="col" className="px-6 py-3 font-semibold text-center text-gray-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                                {/* FIN DE COLUMNA DE ACCIONES */}

                                {/* Cabeceras generadas dinámicamente */}
                                {Object.keys(data[0]).map(key => (
                                    <th key={key} scope="col" className="px-6 py-3 font-semibold text-center text-gray-300 uppercase tracking-wider">
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                            {currentItems
                                .filter(row => {
                                    if (selectedQueryTemplate === 'cdrReport' || selectedQueryTemplate === 'liveStatus') {
                                        return row.queueCallManagerID !== null && row.queueCallManagerID !== undefined;
                                    }
                                    return true;
                                })                                
                                .map((row, rowIndex) => (
                                <tr key={rowIndex} className="bg-gray-800 border-b text-gray-200 hover:bg-gray-700 transition-colors duration-150 ease-in-out">
                                    {/* CELDAS DE ACCIONES - ¡AQUÍ ESTÁ EL CAMBIO PARA LAS FILAS! */}
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        {selectedQueryTemplate === 'cdrReport' && (
                                            <div className="flex flex-col space-y-1 items-center"> {/* Usa flexbox para alinear botones */}
                                                {row.queueCallManagerID && !row.recordingUrl && (
                                                    <button
                                                        onClick={() => fetchCallAudio((row), rowIndex)}
                                                        className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 mr-2"
                                                        title="Obtener Grabación"
                                                    >
                                                        Grabación
                                                    </button>
                                                )}
                                                {row.recordingUrl && (
                                                    <a
                                                        href={String(row.recordingUrl)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                                                        title="Reproducir Grabación"
                                                    >
                                                        Reproducir
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {selectedQueryTemplate === 'liveStatus' && row.queueCallManagerID && row.username && (
                                            <button
                                                onClick={() => startMonitoringCall(String(row.queueCallManagerID), String(row.username))}
                                                className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                                                title="Monitorear Llamada"
                                            >
                                                Monitorear
                                            </button>
                                        )}
                                    </td>
                                    {/* FIN DE CELDAS DE ACCIONES */}

                                    {/* Celdas de datos generadas dinámicamente */}
                                    {/* {Object.entries(row).map(([key, value], colIndex) => (
                                        <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 text-center whitespace-nowrap text-ellipsis max-w-[300px] text-sm text-white overflow-hidden">
                                            {value !== null && value !== undefined ? String(value) : 'N/A'}
                                        </td>
                                    ))} */}
                                    {Object.entries(row).map(([key, value], colIndex) => (
                                        <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 text-center whitespace-nowrap text-ellipsis max-w-[300px] text-sm text-white overflow-hidden">
                                            {Array.isArray(value)
                                                ? value.map(item => item.queueName || JSON.stringify(item)).join(', ')
                                                : value !== null && value !== undefined
                                                ? String(value)
                                                : 'N/A'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>

                    {/* Controles de paginación */}
                    <div className="flex justify-center items-center gap-6 mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Anterior
                        </button>
                        <span className="text-white text-base font-medium">
                            Página <span className="font-bold">{currentPage}</span> de <span className="font-bold">{totalPages}</span>
                            <span className="ml-3 text-gray-400">({data.length.toLocaleString()} registros totales)</span>
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            ) : (
                !loading && !error && (
                    <div className="p-6 bg-gray-800 rounded-lg text-white text-center text-lg shadow-md">
                        <p>No hay datos para mostrar. ¡Ejecuta una consulta para ver los resultados!</p>
                        <p className="text-gray-400 mt-2">Puedes seleccionar una plantilla o introducir una consulta personalizada.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default SharpenQueryReport;