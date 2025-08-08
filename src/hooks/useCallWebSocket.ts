//src/components/hooks/useCallWebSockets.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveQueueStatusData, CallsUpdateMessage, LiveQueueStatusApiResponse } from '../types/nodes';
import API from '../utils/API'; // <--- IMPORTA TU INSTANCIA DE AXIOS
import { CallOnHold, CallsOnHoldApiResponse } from '../types/declarations';
import isEqual from 'lodash/isEqual';


interface ConnectionConfirmMessage {
    message: 'WebSocket conectado';
}

interface LiveQueueStatusUpdateMessage {
    type: 'liveQueueStatusUpdate'; // O el nombre del tipo que tu backend realmente envía
    payload: {
        getLiveQueueStatusData: LiveQueueStatusData[]; // Nombre que tu backend envía
        // Puede que necesites ajustar esta propiedad dependiendo de cómo envías los datos
    };
}

interface CombinedDataUpdateMessage {
    type: 'dataUpdate'; // Coincide con el nuevo tipo enviado desde el backend
    payload: {
        getCallsOnHoldData: CallOnHold[];
        getLiveQueueStatusData: LiveQueueStatusData[];
    };
}

type WebSocketMessage = CallsUpdateMessage | ConnectionConfirmMessage | LiveQueueStatusUpdateMessage | CombinedDataUpdateMessage;
// Define the structure of the WebSocket message payload



/**
 * Custom React hook to manage real-time call data via WebSocket.
 *
 * @returns An object containing:
 * - calls: An array of CallOnHold objects currently on hold.
 * - leavingCalls: An array of IDs of calls that are in the process of leaving (for animation).
 * - wsError: Any error message from the WebSocket connection.
 */

const PING_INTERVAL_MS = 15000; // Send a ping every 15 seconds

export const useCallsWebSocket = () => {
    // El estado 'calls' contendrá el array de llamadas extraído
    const [calls, setCalls] = useState<CallOnHold[]>([]);
    const [liveQueueStatus, setLiveQueueStatus] = useState<LiveQueueStatusData[]>([]); // Nuevo estado
    const [wsError, setWsError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Nuevo estado para indicar carga inicial
    const ws = useRef<WebSocket | null>(null); // Usamos useRef para mantener la instancia del WebSocket
    const reconnectAttempts = useRef(0); // Contador de intentos de reconexión
    const MAX_RECONNECT_ATTEMPTS = 10; // Número máximo de intentos antes de rendirse
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const callsRef = useRef<CallOnHold[]>([]);
    useEffect(() => {
        callsRef.current = calls;
    }, [calls]);

    const getWebSocketUrl = () => {
    // Para desarrollo, podrías usar localhost o una URL de desarrollo específica
        if (process.env.NODE_ENV === 'development') {
            // Asegúrate de que tu backend Django Channels esté corriendo en localhost:8000
            return 'ws://localhost:8001/ws/calls/';
        } else {
            // return 'ws://localhost:8001/ws/calls/';
            // Para producción, usa la URL de tu backend en Render
            return 'wss://gvhc-websocket-mawh.onrender.com/ws/calls/';
        }
    };

    const stopPinging = useCallback(() => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
    }, []);

    const startPinging = useCallback(() => {
        // Only start if not already pinging and connection is open
        if (!pingIntervalRef.current && ws.current && ws.current.readyState === WebSocket.OPEN) {
            pingIntervalRef.current = setInterval(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    // console.log('Sending WebSocket ping...');
                    ws.current.send(JSON.stringify({ type: 'ping' }));
                } else {
                    // If state changes unexpectedly, stop pinging
                    stopPinging();
                }
            }, PING_INTERVAL_MS);
        }
    }, [stopPinging]);

    const handleMessage = useCallback((event: MessageEvent) => {
    try {
        const message: WebSocketMessage = JSON.parse(event.data);
        // console.log('✅ WebSocket message received:', message);

        if ('type' in message) {
            if (message.type === 'dataUpdate') { // <--- CAMBIO IMPORTANTE: Maneja el nuevo tipo
                const combinedDataMsg = message as CombinedDataUpdateMessage;
                const { getCallsOnHoldData, getLiveQueueStatusData } = combinedDataMsg.payload;

                    // console.log('Received newCalls payload:', newCalls);
                    // console.log('Current calls state BEFORE update:', calls); //

                    // console.log(`Are calls data arrays deeply equal? ${areCallsTheSame}`);

                    // Actualiza ambos estados con los datos combinados
                if (Array.isArray(getCallsOnHoldData)) {
                    setCalls(getCallsOnHoldData);
                } else {
                    console.warn('⚠️ Payload for getCallsOnHoldData is malformed in dataUpdate message.');
                }

                if (Array.isArray(getLiveQueueStatusData)) {
                    setLiveQueueStatus(getLiveQueueStatusData);
                } else {
                    console.warn('⚠️ Payload for getLiveQueueStatusData is malformed in dataUpdate message.');
                }
                
            // Mueve esta línea aquí para que se ejecute después del if
            // y no dentro de él.
            } else if ('message' in message && (message as ConnectionConfirmMessage).message === 'WebSocket conectado') {
                setWsError(null);
                startPinging();
            } else {
                console.warn('Ignoring unknown or non-expected WebSocket message type:', message);
            }
        }
        setIsLoading(false); // <-- Esta línea va aquí, dentro del `try` y fuera de los `if/else`.

    } catch (error) { // <-- Aquí está el `catch` correctamente asociado al `try`.
        console.error('❌ Error parsing WebSocket message:', error);
        setWsError('Error processing incoming data from server.');
        setIsLoading(false);
    }
}, [startPinging]);

    const connectWebSocket = useCallback(() => {
        // Cierra cualquier conexión existente antes de intentar una nueva
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            // console.log('⚠️ Ya hay una conexión WebSocket activa o en progreso.');
            return;
        }

        if (ws.current && ws.current.readyState === WebSocket.CLOSING) {
        // Opcional: podrías agregar un setTimeout aquí para esperar a que se cierre por completo.
        // Pero el `return` es suficiente para evitar un loop inmediato.
        // console.log('⚠️ Conexión anterior se está cerrando. Esperando...');
        return;
        }

        // console.log('🔗 Intentando conectar WebSocket a:', getWebSocketUrl());
        setIsLoading(true); // Set loading to true when trying to connect

        const socket =  new WebSocket(getWebSocketUrl());
        ws.current = socket; // Immediately assign to ref to manage it

        socket.onopen = () => {
            // console.log('🔗 WebSocket connected:', getWebSocketUrl());
            setWsError(null);
            reconnectAttempts.current = 0; // Resetear intentos al conectar con éxito
        };

        socket.onmessage = handleMessage;

        socket.onerror = (event) => {
            // console.error('WebSocket error:', event);
            setWsError('WebSocket connection error. Attempting to reconnect...');
            setIsLoading(false); // Stop loading on error
            stopPinging(); // Stop pinging on error
        };

        socket.onclose = () => {
            // console.log('WebSocket disconnected. Attempting to reconnect...');
            // setWsError('WebSocket disconnected. Attempting to reconnect...');
            setIsLoading(false); // Stop loading if max attempts reached
            stopPinging(); // Stop pinging on close

            if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS && document.visibilityState === 'visible') {
                reconnectAttempts.current++;
                const delay = Math.min(3000 * Math.pow(2, reconnectAttempts.current - 1), 30000); // Exponential backoff
                // console.log(`Reconectando en ${delay / 1000} segundos... Intento ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}.`);

                setTimeout(() => {
                    connectWebSocket(); // Call the connect function again
                }, delay);
            } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
                setWsError('No se pudo reconectar al WebSocket después de varios intentos.');
                // console.error('🚨 Máximos intentos de reconexión alcanzados. Rindiéndome.');
            }
            // If visibilityState is hidden, onclose will log, but won't re-trigger connectWebSocket
            // until visibilityState becomes 'visible' again, handled by the event listener.
        };
    }, [handleMessage, getWebSocketUrl, stopPinging]); // Add getWebSocketUrl to dependencies if it's dynamic



 useEffect(() => {
    // 1. Conecta el WebSocket SÓLO si la pestaña está visible al inicio
    if (document.visibilityState === 'visible') {
        connectWebSocket();
    }

    // 2. Maneja los cambios de visibilidad de la pestaña.
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            console.log('🔁 Pestaña visible → verificar/conectar WebSocket');
            // Llama a connectWebSocket solo si no hay una conexión activa.
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                connectWebSocket();
            }
        } else {
            console.log('🛑 Pestaña oculta → cerrar WebSocket');
            if (ws.current) {
                ws.current.close(1000, 'Tab hidden');
                ws.current = null;
            }
            stopPinging();
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. La función de limpieza para cerrar la conexión.
    return () => {
        // console.log('🧹 Limpiando: Cerrando WebSocket al desmontar el componente.');
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (ws.current) {
            ws.current.close(1000, 'Component unmounted');
            ws.current = null;
        }
        stopPinging();
    };

}, [connectWebSocket, stopPinging]); // Las dependencias son correctas.

    useEffect(() => {
            // 🔹 Carga inicial rápida con fetch
        const fetchInitialData = async () => {
            try {
                const callsResponse = await API.get<CallsOnHoldApiResponse>('/api/websocket/pacientes-en-espera/');
                const initialCalls = callsResponse.data?.getCallsOnHoldData ?? [];
                setCalls(initialCalls);

                const queueStatusResponse = await API.get<LiveQueueStatusApiResponse>('/api/websocket/live-queue-status/');
                const initialLiveQueue = queueStatusResponse.data?.getLiveQueueStatusData ?? [];
                setLiveQueueStatus(initialLiveQueue);

                setIsLoading(false);
            } catch (error) {
                // console.error('Error en carga inicial:', error);
                setWsError('Error al cargar los pacientes iniciales');
                setIsLoading(false);
            }
        };

        fetchInitialData(); // Carga inicial
    }, []); // La dependencia es un array vacío, se ejecuta solo una vez.


    return { calls: calls, liveQueueStatus, isLoading: isLoading, wsError: wsError }; // Retorna isLoading
};
