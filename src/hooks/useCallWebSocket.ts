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

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message: CallsUpdateMessage = JSON.parse(event.data);
            console.log('✅ WebSocket message received:', message);

            // 1. Verificamos que el mensaje sea del tipo correcto y tenga datos
            if (message.type === 'callsUpdate' && Array.isArray(message.payload?.getCallsOnHoldData?.getCallsOnHoldData)) {
                
                // 2. Extraemos el nuevo array de llamadas
                const newCallsArray = message.payload.getCallsOnHoldData.getCallsOnHoldData;
                
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


    // useEffect para gestionar la conexión del WebSocket
    useEffect(() => {
        // Reemplaza con la URL de tu WebSocket

        // const websocketUrl = 'ws://localhost:8001/ws/calls/'; // O la URL de producción
        const websocketUrl = 'wss://gvhc-backend.onrender.com/ws/calls/'; // O la URL de producción

        const socket = new WebSocket(websocketUrl);

        socket.onopen = () => {
            console.log(':', websocketUrl);
            setWsError(null);
        };

        socket.onmessage = handleMessage;

        socket.onerror = (event) => {
            console.error('WebSocket error:', event);
            setWsError('WebSocket connection error. Please try refreshing.');
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected.');
        };

        // Función de limpieza para cerrar la conexión al desmontar el componente
        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, [handleMessage]);

    // Devuelve los datos que el componente necesita.
    // 'leavingCalls' se puede añadir de nuevo si se implementa la lógica de comparación.
    return { calls, wsError };
};
