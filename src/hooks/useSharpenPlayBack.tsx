// src/hooks/useSharpenAudioPlayback.ts
import { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import sharpenAPI from '../utils/APISharpen';
import { QUERY_TEMPLATES } from '../utils/sharpenConfig';



    export const useSharpenAudioPlayback = (): UseSharpenAudioPlaybackResult => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
    const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);

    const getLocalDatetimeString = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const closeAudioModal = useCallback(() => {
        setIsModalOpen(false);
        setCurrentAudioUrl(null);
    }, []);

    const fetchAndPlayAudio = useCallback(async (row: RowData, rowIndex: number) => {
        console.log('Attempting to fetch audio for row:', row);
        const callId = row.queueCallManagerID;

        const callDateTimeStr = row.answerTime || row.endTime || row.startTime;
        if (!callDateTimeStr) {
        alert("No se encontró la fecha de la llamada para verificar su antigüedad.");
        return;
        }

        // Lógica para determinar la antigüedad de la llamada (si sigue siendo relevante)
        const callDate = new Date(callDateTimeStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - callDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log(`Llamada con ID ${callId} tiene ${diffDays} días de antigüedad.`);

        try {
        if (!callId) {
            alert("ID de llamada no disponible para obtener la grabación.");
            return;
        }

        console.log(`Buscando detalles con getCdrDetails para callId: ${callId}.`);
        const { endpoint: cdrDetailsEndpoint, payload: cdrDetailsPayload } = QUERY_TEMPLATES.getCdrDetails(callId);
        const cdrDetailsResponse = await sharpenAPI.post<CdrDetailsData>('dashboards/proxy/generic/', {
            endpoint: cdrDetailsEndpoint,
            payload: cdrDetailsPayload,
        });

        console.log('CDR Details Response Data:', cdrDetailsResponse.data);

        const mixmonFileName = cdrDetailsResponse.data?.cdr?.mixmonFileName;
        const uniqueID = cdrDetailsResponse.data?.cdr?.queueCallManagerID; // Re-usar callId si es el uniqueID

        if (!mixmonFileName || !uniqueID) {
            alert(`No se pudo obtener el 'mixmonFileName' o 'uniqueID' de la API 'getCdrDetails' para la llamada con ID: ${callId}.`);
            return;
        }
        console.log(`mixmonFileName obtenido: ${mixmonFileName}, uniqueID para audio: ${uniqueID}`);

        console.log(`Obteniendo URL de grabación de Sharpen a través del proxy.`);
        const { endpoint: recordingUrlEndpoint, payload: recordingUrlPayload } = QUERY_TEMPLATES.getCdrDetails(callId);
        const recordingUrlResponse = await sharpenAPI.post<RecordingUrlResponse>(
            'dashboards/proxy/generic/',
            {
            endpoint: recordingUrlEndpoint,
            payload: recordingUrlPayload,
            }
        );
        
        console.log('Recording URL Response:', recordingUrlResponse.data);

        if (recordingUrlResponse.data?.status === 'successful' && recordingUrlResponse.data.url) {
            // Redirige directamente al endpoint del proxy de audio para que maneje el streaming y CORS
            const proxyAudioUrl = `/api/dashboards/sharpen/audio/?mixmonFileName=${mixmonFileName}&uniqueID=${uniqueID}`;
            
            // Abre una nueva ventana/pestaña para la reproducción del audio
            window.open(proxyAudioUrl, '_blank');

            // Opcional: si quieres reproducir en un modal dentro de la misma página,
            // establecerías el estado y abrirías el modal.
            // setCurrentAudioUrl(proxyAudioUrl);
            // setIsModalOpen(true);

        } else {
            alert(`Error al generar la URL de la grabación: ${recordingUrlResponse.data.description || 'Respuesta no válida de la API.'}`);
        }
        } catch (err: any) {
        console.error("Error in audio fetching process:", err);
        let errorMessage = "Ocurrió un error al obtener la grabación. Revisa la consola para más detalles.";
        if (err.response?.data?.details) {
            errorMessage = `Error del servidor: ${err.response.data.details}`;
        } else if (err.response?.data?.error) {
            errorMessage = `Error del servidor: ${err.response.data.error}`;
        }
        alert(errorMessage);
        }
    }, []);

    const startMonitoringCall = useCallback(async (queueCallManagerID: string, extension: string) => {
        if (!queueCallManagerID || !extension) {
        alert("Falta el ID de la llamada o la extensión del agente para poder monitorear.");
        return;
        }

        setMonitoringStatus({ message: 'Iniciando conexión de monitoreo...', type: 'info' });

        try {
        const response = await sharpenAPI.post<RecordingUrlResponse>('dashboards/proxy/generic/', {
            endpoint: 'V2/queueCallManager/listen',
            payload: {
            queueCallManagerID: queueCallManagerID,
            extension: extension,
            }
        });

        if (response.data?.status === 'successful') {
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
        } else if (err.response?.data?.error) {
            errorMessage = `Error del servidor: ${err.response.data.error}`;
        }
        setMonitoringStatus({ message: errorMessage, type: 'error' });
        }
    }, []);

    return {
        isModalOpen,
        currentAudioUrl,
        monitoringStatus,
        fetchAndPlayAudio,
        closeAudioModal,
        startMonitoringCall,
    };
    };
