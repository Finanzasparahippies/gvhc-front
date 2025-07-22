import { useState, useEffect, useCallback, useRef } from 'react';

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
    const ws = useRef<WebSocket | null>(null); // Usamos useRef para mantener la instancia del WebSocket
    const reconnectAttempts = useRef(0); // Contador de intentos de reconexión
    const MAX_RECONNECT_ATTEMPTS = 5; // Número máximo de intentos antes de rendirse
    const RECONNECT_INTERVAL_MS = 3000; // Intervalo entre intentos de reconexión (3 segundos)

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message: CallsUpdateMessage = JSON.parse(event.data);
            console.log('✅ WebSocket message received:', message);

            // 1. Verificamos que el mensaje sea del tipo correcto y tenga datos
            if (message.type === 'callsUpdate' && Array.isArray(message.payload?.getCallsOnHoldData)) {
                
                // 2. Extraemos el nuevo array de llamadas
                const newCallsArray = message.payload.getCallsOnHoldData;
                
                // 3. Reemplazamos el estado anterior con la nueva lista. ¡Eso es todo!
                setCalls(newCallsArray);

            } else if (message.type !== 'callsUpdate') {
                // Ignoramos mensajes que no son de actualización de llamadas, como el de bienvenida.
                console.log('Ignoring non-callsUpdate message:', message.type);
            }

        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            setWsError('Error processing incoming data.');
        }
    }, []); // El array de dependencias vacío está correcto aquí

    const connectWebSocket = useCallback(() => {
        // Cierra cualquier conexión existente antes de intentar una nueva
        if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
            ws.current.close();
        }

        const websocketUrl = 'wss://gvhc-backend.onrender.com/ws/calls/'; 
        const socket = new WebSocket(websocketUrl);

        socket.onopen = () => {
            console.log('🔗 WebSocket connected:', websocketUrl);
            setWsError(null);
            reconnectAttempts.current = 0; // Resetear intentos al conectar con éxito
            ws.current = socket; // Guarda la instancia del socket
        };

        socket.onmessage = handleMessage;

        socket.onerror = (event) => {
            console.error('WebSocket error:', event);
            setWsError('WebSocket connection error. Attempting to reconnect...');
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
                setTimeout(connectWebSocket, RECONNECT_INTERVAL_MS);
            } else {
                setWsError('WebSocket connection failed after multiple attempts. Please refresh the page.');
                console.error('Max reconnect attempts reached. Giving up.');
            }
        };
    }, [handleMessage]); // `handleMessage` es una dependencia estable gracias a `useCallback`


    // useEffect para gestionar la conexión del WebSocket
    useEffect(() => {
        
        connectWebSocket(); // Conectar al montar el componente


        return () => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.close();
            }
        };
    }, [connectWebSocket]); // `connectWebSocket` es una dependencia estable

    return { calls, wsError };
};