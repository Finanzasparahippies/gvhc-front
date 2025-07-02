// src/hooks/useSharpenDataFetch.ts
import { useState, useEffect, useCallback, startTransition } from 'react';
import sharpenAPI from '../utils/APISharpen';
import { QUERY_TEMPLATES } from '../utils/sharpenConfig';

export const useSharpenDataFetch = (initialParams: FetchDataParams): UseSharpenDataFetchResult => {
    const [data, setData] = useState<RowData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<SharpenApiResponseData | null>(null);
    const [fetchedCount, setFetchedCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 100;

    const fetchData = useCallback(async (overrides?: Partial<FetchDataParams>) => {
        setLoading(true);
        setError(null);
        setData([]);
        setResponse(null);
        setFetchedCount(0);
        setCurrentPage(1); // Resetear a la primera página en cada nueva consulta

    const params = { ...initialParams, ...overrides };
    const { selectedQueryTemplate, server, database, table, startDate, endDate, agentUsername, getAgentsParams, customQuery, isValidRange } = params;

    let apiEndpoint: string = '';
    let apiPayload: { [key: string]: any; } = {};

    try {
        if (selectedQueryTemplate === 'liveStatus') {
            const template = QUERY_TEMPLATES.liveStatus();
            apiEndpoint = template.endpoint;
            apiPayload = template.payload;
        } else if (selectedQueryTemplate === 'cdrReport') {
            if (!isValidRange()) {
            alert('Para el reporte CDR, selecciona un rango de fechas válido.');
            setLoading(false);
            return;
            }
            const template = QUERY_TEMPLATES.cdrReport(server, database, table, startDate, endDate);
            apiEndpoint = template.endpoint;
            apiPayload = template.payload;
        } else if (selectedQueryTemplate === 'agentStatus') {
            const template = QUERY_TEMPLATES.agentStatus(agentUsername);
            apiEndpoint = template.endpoint;
            apiPayload = template.payload;
        } else if (selectedQueryTemplate === 'getAgents') {
            const template = QUERY_TEMPLATES.getAgents(getAgentsParams);
            apiEndpoint = template.endpoint;
            apiPayload = template.payload;
        } else if (selectedQueryTemplate === 'customSqlQuery') {
            const template = QUERY_TEMPLATES.customSqlQuery();
            apiEndpoint = 'V2/query/'; // Asumimos que el endpoint para customQuery es este
            apiPayload = { ...template.payload, q: customQuery }; // Combinamos con la query del usuario
            if (!customQuery) {
                alert('Por favor, ingresa una consulta SQL personalizada.');
                setLoading(false);
                return;
            }
        } else {
            alert('Selecciona una plantilla de consulta válida.');
            setLoading(false);
            return;
        }

        const apiResponse = await sharpenAPI.post<SharpenApiResponseData>('dashboards/proxy/generic/', {
            endpoint: apiEndpoint,
            payload: apiPayload,
        });

        const resp = apiResponse.data;
        let extractedData: RowData[] = [];

        if (selectedQueryTemplate === 'getAgents') {
            if (resp?.getAgentsStatus === "Complete" && resp.getAgentsData) {
            extractedData = Array.isArray(resp.getAgentsData) ? resp.getAgentsData : [resp.getAgentsData];
            } else {
            setError("No se pudieron obtener los datos de los agentes.");
            }
        } else if (selectedQueryTemplate === 'agentStatus') {
            if (resp?.getAgentStatusStatus === "Complete" && resp.getAgentStatusData) {
            extractedData = [resp.getAgentStatusData];
            } else {
            setError("No se pudieron obtener los datos del agente (agentStatus).");
            }
        } else if (selectedQueryTemplate === "liveStatus" || selectedQueryTemplate === "cdrReport" || selectedQueryTemplate === "customSqlQuery") {
            if (resp?.data && Array.isArray(resp.data)) {
            extractedData = resp.data;
            } else if (resp?.table && typeof resp.table === 'string') {
            try {
                const tableData = JSON.parse(resp.table);
                extractedData = Array.isArray(tableData) ? tableData : [tableData];
            } catch (e) {
                console.error("Error al parsear el JSON de la clave 'table':", e);
                setError("La respuesta de la API contenía una tabla mal formada.");
            }
            } else {
            setError("La consulta no devolvió el formato esperado para la plantilla seleccionada.");
            }
        } else if (resp?.raw_response) {
            setResponse({ raw_response: resp.raw_response } as SharpenApiResponseData);
        } else {
            throw new Error('Formato de respuesta no reconocido o plantilla no manejada.');
        }

        let filteredData = extractedData;
        if (selectedQueryTemplate === 'liveStatus') {
            filteredData = extractedData.filter(row =>
            row.queueCallManagerID !== null && row.queueCallManagerID !== undefined
            );
        }

        startTransition(() => {
            setData(filteredData);
            setFetchedCount(filteredData.length);
            if (filteredData.length > 0) {
            setResponse({ status: 'Complete', data: filteredData });
            }
        });

        } catch (err: any) {
        console.error("Error en fetchData:", err);
        let errorMessage = `Error al consultar la API: ${err.message || 'Revisa la consola para más detalles.'}`;
        if (err.response?.data) {
            const apiError = err.response.data.error || 'Error desconocido';
            const details = err.response.data.description || err.response.data.details || '';
            errorMessage = `Error de la API: ${apiError}${details ? ` - ${details}` : ''}`;
        }
        setError(errorMessage);
        } finally {
        setLoading(false);
        }
    }, [initialParams]); // `initialParams` para que el useCallback se actualice si los parámetros iniciales cambian

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    return {
        data,
        loading,
        error,
        response,
        fetchedCount,
        currentPage,
        itemsPerPage,
        totalPages,
        currentItems,
        fetchData,
        setCurrentPage,
    };
};