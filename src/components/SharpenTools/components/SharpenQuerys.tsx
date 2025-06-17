import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import sharpenAPI from '../../../utils/APISharpen'

        const SERVERS = ['fathomvoice', 'fathomrb'];
        const DATABASES: { [ key: string]: string [] } = {
            fathomvoice: ['fathomQueues', 'sipMonitor'],
            fathomrb: ['fathomrb'],
        };
        const TABLES: { [ key: string]: string [] } = {
            fathomQueues: ['queueCDR', 'queueCDRLegs', 'queueADR'],
            sipMonitor: ['sipLatency', 'sipLatencyTotals'],
            fathomrb: ['userGroups'],
        };

    const productionQueryExample = `SELECT \`answerTime\`, \`endTime\`, \`queueCallManagerID\`, \`segmentNumber\`, \`queueName\`, \`agentName\`, \`queueCDR\`.\`cidNumber\` AS "Caller ID Number", \`queueCDR\`.\`cidName\` AS "Caller ID Name", \`waitTime\`, \`agentTalkTime\`, \`agentHoldTime\`, (\`agentTalkTime\` + \`agentHoldTime\` + \`wrapUp\`) AS "Agent Handle Time", \`agentHoldCount\`, \`wrapup\`, \`commType\`, \`queueCDR\`.\`queueCallback\` AS "Callback", (CASE WHEN \`agentTalkTime\` = 0 AND \`transfer\` = 0 THEN \`waitTime\` END) AS "Abandoned Wait Time", \`queueCDRLegID\`, \`switchHoldTime\`, \`switchHoldCount\`, \`transfer\`, \`transferType\`, \`transferToType\`, \`transferToData\` FROM \`fathomvoice\`.\`fathomQueues\`.\`queueCDRLegs\` WHERE \`endTime\` >= "2025-06-17 07:00:00" AND \`endTime\` <= "2025-06-18 06:59:59" LIMIT 5000`;


    const SharpenQueryReport: React.FC = () => {
        //estados para seleccionar datos
        const [server, setServer] = useState(SERVERS[0]);
        const [database, setDataBase] = useState(DATABASES[server][0]);
        const [table, setTable] = useState(TABLES[database][0]);
        const [advancedQuery, setAdvancedQuery] = useState(productionQueryExample);
        //estados para las fechas
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');
        const [useCurrentEndDate, setUseCurrentEndDate] = useState(false);
        //estados para la UI y datos de usuario
        const [data, setData] = useState<any[]>([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [response, setResponse] = useState<responseData | null>(null);
        const [fetchedCount, setFetchedCount] = useState(0);
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 100;

        useEffect(() => {
            setDataBase(DATABASES[server][0]);
        }, [server]);

        useEffect(() => {
            setTable(TABLES[database][0]);
        }, [database]);
        
        const toLocalISOString = (date: Date) => {
        const pad = (num: number) => (num < 10 ? '0' : '') + num;

        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds());
        };

        useEffect(() => {
        if (useCurrentEndDate) {
                // Usamos la nueva función para obtener la hora local correcta
                setEndDate(toLocalISOString(new Date()));
            }
        }, [useCurrentEndDate]);

        const isValidRange = () => {
            return startDate && endDate && new Date(startDate) <= new Date(endDate);
        };

        const fetchData = async () => {
            if (!advancedQuery && !isValidRange()) {
                alert('Selecciona un rango de fechas válido o introduce una consulta avanzada.');
                    return;
            }

            setLoading(true);
            setError(null);
            setData([]);
            setResponse(null);
            setFetchedCount(0);
            setCurrentPage(1);

            let query = advancedQuery;
            if (!query) {
                query = `SELECT queueCallManagerId FROM ${server}.${database}.${table} WHERE AnswerTime BETWEEN '${startDate}' AND '${endDate}' LIMIT 5000`;
            }

            try {
                    const apiResponse = await sharpenAPI.post<responseData>('dashboards/proxy/sharpen-query/', {
                        method: 'query',
                        q: query,
                    });
                
                const resp = apiResponse.data;
                let extractedData: any[] = [];
                
            if (resp?.table && typeof resp.table === 'string') {
                try {
                    const tableData = JSON.parse( resp.table );
                    if ( Array.isArray ( tableData )) {
                        extractedData = tableData;
                    }
                } catch ( e ) {
                    console.error("Error al parsear el JSON de la clave 'table':", e);
                    setError("La respuesta de la API contenía una tabla mal formada.");
                }
            }
            else if (resp?.data && Array.isArray(resp.data)) {
                extractedData = resp.data;
            } 
            // Maneja otros errores
            else if (resp?.raw_response) {
                setResponse({ raw_response: resp.raw_response } as responseData);
            } else {
                throw new Error('Formato de respuesta no reconocido de la API.');
            }

            setData(extractedData);
            setFetchedCount(extractedData.length);
            
                if (extractedData.length > 0) {
                setResponse({ status: 'Complete', data: extractedData });
                }

            } catch (err: any) {
                console.error(err);
                setError('Error al consultar la API. Revisa la consola para más detalles.');
            } finally {
                setLoading(false);
            }
        };

        const getRecordingUrl = async (callId: string, rowIndex: number) => {
            if (!callId) {
                alert("No hay un ID de llamada para buscar.");
                return;
            }

            console.log(`Solicitando URL para la llamada con ID: ${callId}`);
            // Aquí podrías poner un estado de loading para la fila específica si lo deseas

            try {
                const response = await sharpenAPI.post<RecordingUrlResponse>(
                    'dashboards/proxy/generic/', // <-- Usamos la nueva ruta limpia
                    {
                        endpoint: 'V2/voice/callRecordings/createRecordingURL',
                        payload: {
                            uniqueID: callId,
                        }
                    }
                );

                if (response.data?.status === 'successful' && response.data.url) {
                    // Éxito. Ahora actualizamos el estado para añadir la URL a la fila correcta.
                    setData(currentData => {
                        const newData = [...currentData];
                        // El índice que recibimos es de `currentItems`, que es la página visible.
                        // Calculamos el índice global en el array completo `data`.
                        const globalIndex = ((currentPage - 1) * itemsPerPage) + rowIndex;
                        
                        if (newData[globalIndex]) {
                            newData[globalIndex].recordingUrl = response.data.url;
                        }
                        
                        return newData;
                    });
                } else {
                    alert(`Error al obtener la grabación: ${response.data.description || 'Respuesta no válida de la API.'}`);
                }
            } catch (err) {
                console.error("Error al solicitar la URL de la grabación:", err);
                alert("Ocurrió un error en el servidor al pedir la grabación.");
            }
        };

        const downloadCSV = () => {
            if (!data.length) return;

            const headers = Object.keys(data[0]);
            const rows = data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(','));

            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `reporte_sharpen_${startDate}_a_${endDate}.csv`);
        };

        const downloadAndPlayRecording = async (url: string) => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        // Agrega headers si Sharpen lo requiere
                    },
                });

                if (!response.ok) throw new Error('No se pudo descargar el audio');

                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const audio = new Audio(blobUrl);
                audio.play();
            } catch (err) {
                console.error('Error al reproducir la grabación:', err);
                alert('No se pudo reproducir la grabación.');
            }
        };


        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(data.length / itemsPerPage);

        return (
        <div className='p-6 max-w-screen-xl mx-auto mt-[100px]'>
            <h2 className='text-2xl font-semibold mb-6 text-white'>Constructor de Reportes (Sharpen)</h2>

            {/* --- SECCIÓN DE CONSULTA AVANZADA --- */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <label className="text-lg font-medium text-white mb-2 block">Consulta Avanzada</label>
                    <textarea
                        value={advancedQuery}
                        onChange={e => setAdvancedQuery(e.target.value)}
                        placeholder="Pega aquí una consulta SQL completa para anular los selectores de arriba."
                        className="w-full h-28 p-2 border border-gray-300 rounded text-sm font-mono"
                    />
                <p className="text-xs text-gray-400 mt-1">Si este campo tiene texto, se ejecutará esta consulta directamente.</p>
            </div>


            {/* --- SECCIÓN DE SELECCIÓN DE DATOS (ahora secundaria) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-white mb-1">Servidor</label>
                    <select value={server} onChange={e => setServer(e.target.value)} disabled={!!advancedQuery} className="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-200">
                        {SERVERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-white mb-1">Base de Datos</label>
                    <select value={database} onChange={e => setDataBase(e.target.value)} disabled={!!advancedQuery} className="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-200">
                        {DATABASES[server].map(db => <option key={db} value={db}>{db}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-white mb-1">Tabla</label>
                    <select value={table} onChange={e => setTable(e.target.value)} disabled={!!advancedQuery} className="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-200">
                        {TABLES[database]?.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* --- SECCIÓN DE FECHAS Y ACCIONES --- */}
            <div className='flex flex-wrap items-end gap-4 mb-6'>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-white mb-1">Fecha Inicio</label>
                    <input 
                        className="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-200" 
                        type="datetime-local" 
                        step="1"
                        value={startDate} 
                        disabled={!!advancedQuery}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-white mb-1">Fecha Fin</label>
                    <input
                        className="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-200"
                        type="datetime-local"
                        step="1" 
                        value={endDate} 
                        disabled={useCurrentEndDate || !!advancedQuery}
                        onChange={e => setEndDate(e.target.value)} 
                    />
                </div>
                <div className="flex items-center self-center pb-2">
                    <input
                        type="checkbox"
                        checked={useCurrentEndDate}
                        disabled={!!advancedQuery}
                        onChange={(e) => setUseCurrentEndDate(e.target.checked)}
                        className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-white">Usar "Ahora"</label>
                </div>
                <button 
                    onClick={fetchData} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 h-10"
                >
                    {loading ? 'Consultando...' : 'Ejecutar Consulta'}
                </button>
                <button 
                    onClick={downloadCSV} 
                    disabled={data.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 h-10"
                >
                    Descargar CSV
                </button>
            </div>
            
            {/* ... El resto de la UI para mostrar resultados y paginación no cambia ... */}
            {loading && (<p className="text-white font-medium">Cargando...</p>)}
            {error && (<p className="text-red-600 font-medium mb-4">{error}</p>)}
            {data.length > 0 && (
                    <>
                        <div className="overflow-x-auto max-h-[500px] border rounded">
                            <table border={1} cellPadding={5} className="table-auto w-full text-sm text-left text-white">
                                <thead className="bg-gray-100 sticky top-0 text-black">
                                    <tr>{Object.keys(data[0]).map(key => (<th key={key} className="px-4 py-2 font-semibold border-b">{key}</th>))}</tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 hover:text-black">
                                        {Object.keys(row).map(key => (
                                            <td key={key} className="px-4 py-2 border-b">
                                                {/* 👇 LÓGICA CONDICIONAL PARA MOSTRAR BOTÓN O REPRODUCTOR */}
                                                    {key.toLowerCase() === 'queuecallmanagerid' ? (
                                                    <div>
                                                        {row[key]} {/* Muestra el ID de la llamada */}

                                                        {row.recordingUrl ? (
                                                            // Si ya tenemos la URL, muestra el reproductor
                                                            <audio controls preload='none' className='mt-2 w-full max-w-[300px]'>
                                                                <source src={row.recordingUrl} type='audio/mpeg' />
                                                                Tu navegador no soporta el elemento de audio.
                                                            </audio>
                                                        ) : (
                                                            // Si no hay URL, muestra el botón para obtenerla
                                                            <button
                                                                onClick={() => downloadAndPlayRecording(row[key])}
                                                                className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 text-xs rounded shadow"
                                                            >
                                                                Obtener Grabación
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Para todas las demás columnas, muestra el valor normal
                                                    row[key]
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-center items-center gap-4 mt-4">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50">Anterior</button>
                            <span className="text-white self-center">Página {currentPage} de {totalPages} ({data.length.toLocaleString()} registros)</span>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50">Siguiente</button>
                        </div>
                    </>
                )}
        </div>
    );
};

export default SharpenQueryReport;
