//src/components/hooks/useCallWebSockets.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface ConnectionConfirmMessage {
    message: 'WebSocket conectado';
}
type WebSocketMessage = CallsUpdateMessage | ConnectionConfirmMessage;
// Define the structure of the WebSocket message payload

/**
 * Custom React hook to manage real-time call data via WebSocket.
 *
 * @returns An object containing:
 * - calls: An array of CallOnHold objects currently on hold.
 * - leavingCalls: An array of IDs of calls that are in the process of leaving (for animation).
 * - wsError: Any error message from the WebSocket connection.
 */
export const useCallsWebSocket = () => {
    // El estado 'calls' contendrá el array de llamadas extraído
    const [calls, setCalls] = useState<CallOnHold[]>([]);
    const [wsError, setWsError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Nuevo estado para indicar carga inicial
    const ws = useRef<WebSocket | null>(null); // Usamos useRef para mantener la instancia del WebSocket
    const reconnectAttempts = useRef(0); // Contador de intentos de reconexión
    const MAX_RECONNECT_ATTEMPTS = 10; // Número máximo de intentos antes de rendirse
    const RECONNECT_INTERVAL_MS = 3000; // Intervalo entre intentos de reconexión (3 segundos)

    const getWebSocketUrl = () => {
    // Para desarrollo, podrías usar localhost o una URL de desarrollo específica
        if (process.env.NODE_ENV === 'development') {
            // Asegúrate de que tu backend Django Channels esté corriendo en localhost:8000
            return 'ws://localhost:8001/ws/calls/'; 
        } else {
            // return 'ws://localhost:8001/ws/calls/'; 
            // Para producción, usa la URL de tu backend en Render
            return 'wss://gvhc-websocket.onrender.com/ws/calls/'; 
        }
    };

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message: CallsUpdateMessage = JSON.parse(event.data);
            console.log('✅ WebSocket message received:', message);

            // 1. Verificamos que el mensaje sea del tipo correcto y tenga datos
            if (message.type === 'callsUpdate') {
                const callsUpdateMsg = message as CallsUpdateMessage; 

                if (callsUpdateMsg.payload && Array.isArray(callsUpdateMsg.payload.getCallsOnHoldData)) {
                    setCalls(callsUpdateMsg.payload.getCallsOnHoldData);
                    setWsError(null); // Clear error on successful data update
                    setIsLoading(false); // Data received, set loading to false
                } else {
                    console.warn('⚠️ WebSocket "callsUpdate" message received, but payload is malformed:', callsUpdateMsg);
                    setWsError('Received malformed call data.');
                    setIsLoading(false); // Data received, set loading to false
                }
            } else if ('message' in message && message.message === 'WebSocket conectado') {
                // This is the initial connection confirmation message from the backend.
                // We just log it and don't update `calls` state.
                console.log('Backend confirmed WebSocket connection.');
                setWsError(null); // Clear any connection errors once confirmed
            } else {
                // For any other unexpected message types
                console.warn('Ignoring unknown or non-callsUpdate WebSocket message type:', message);
            }

        } catch (error) {
            console.error('❌ Error parsing WebSocket message or unexpected format:', error, event.data);
            setWsError('Error processing incoming data from server.');
            setIsLoading(false); // Error occurred, stop loading indication
        }
    }, []); // `handleMessage` is stable as it has no dependencies

    const connectWebSocket = useCallback(() => {
        // Cierra cualquier conexión existente antes de intentar una nueva
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            console.log('⚠️ Ya hay una conexión WebSocket activa o en progreso.');
            return;
        }

        const socket =  new WebSocket(getWebSocketUrl());
        setIsLoading(true); // Set loading to true when trying to connect

        socket.onopen = () => {
            console.log('🔗 WebSocket connected:', getWebSocketUrl());
            setWsError(null);
            reconnectAttempts.current = 0; // Resetear intentos al conectar con éxito
            ws.current = socket; // Guarda la instancia del socket
        };

        socket.onmessage = handleMessage;

        socket.onerror = (event) => {
            console.error('WebSocket error:', event);
            setWsError('WebSocket connection error. Attempting to reconnect...');
            setIsLoading(false); // Stop loading on error
            if (ws.current) {
                ws.current.close(); // Asegurarse de que el socket se cierre para gatillar onclose
            }
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected. Attempting to reconnect...');
            setWsError('WebSocket disconnected. Attempting to reconnect...');
            if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts.current++;
                console.log(`Reconnecting attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}...`);
            setTimeout(() => {
                    if (document.visibilityState === 'visible') {
                        connectWebSocket();
                    }
                }, RECONNECT_INTERVAL_MS);
            } else {
                setWsError('No se pudo reconectar al WebSocket');
                console.error('Max reconnect attempts reached. Giving up.');
                setIsLoading(false); // Stop loading if max attempts reached
            }
        };
    }, [handleMessage]); 


    // useEffect para gestionar la conexión del WebSocket
    useEffect(() => {
        // 🔹 Carga inicial rápida con fetch
        const fetchInitialData = async () => {
            try {
                const response = await fetch('/api/pacientes-en-espera/');
                const data = await response.json();
                const initialCalls = data?.getCallsOnHoldData ?? [];
                setCalls(initialCalls);
                setIsLoading(false);
            } catch (error) {
                console.error('Error en carga inicial:', error);
                setWsError('Error al cargar los pacientes iniciales');
                setIsLoading(false);
            }
        };

        fetchInitialData(); // Carga inicial

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('🔁 Pestaña visible → conectar WebSocket');
                connectWebSocket();
            } else {
                console.log('🛑 Pestaña oculta → cerrar WebSocket');
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.close();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Conectar solo si la pestaña está visible
        if (document.visibilityState === 'visible') {
            connectWebSocket();
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
                ws.current.close();
            }
        };
    }, [connectWebSocket]);

    return { calls: calls, isLoading: isLoading, wsError: wsError }; // Retorna isLoading
};