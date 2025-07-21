import { useState, useEffect, useRef, useCallback } from 'react';

// Define the structure of the WebSocket message payload
interface WebSocketMessage {
    type: 'add' | 'remove' | 'update';
    payload: CallOnHold | { id: string }; // For 'remove', we just need the ID
}

/**
 * Custom React hook to manage real-time call data via WebSocket.
 * It connects to a WebSocket server, processes incoming call events (add, remove, update),
 * and provides the current list of calls on hold and a list of calls that are leaving (for animation).
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
    const [leavingCalls, setLeavingCalls] = useState<string[]>([]); 

    // NOTA: La lógica de animación 'leavingCalls' es compleja con este tipo de mensaje
    // (requiere comparar arrays). La he quitado por ahora para darte una solución
    // clara y funcional. Se puede añadir después si es necesario.

    // Función para procesar el mensaje del WebSocket
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message: CallsUpdateMessage = JSON.parse(event.data);
            console.log('WebSocket message received:', message);

            // 1. Verificamos que el mensaje sea del tipo 'callsUpdate'
            if (message.type === 'callsUpdate' && message.payload?.getCallsOnHoldData?.getCallsOnHoldData) {
                
                // 2. Extraemos el array de llamadas de la estructura anidada
                const newCallsArray = message.payload.getCallsOnHoldData.getCallsOnHoldData;

                // 3. Validamos que sea un array y actualizamos el estado
                if (Array.isArray(newCallsArray)) {
                    // Simplemente reemplazamos el estado anterior con la nueva lista completa
                    setCalls(newCallsArray);
                } else {
                    console.warn('Received callsUpdate but payload data is not an array.');
                }
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            setWsError('Error processing incoming data.');
        }
    }, []);

    // useEffect para gestionar la conexión del WebSocket
    useEffect(() => {
        // Reemplaza con la URL de tu WebSocket
        // const websocketUrl = 'ws://localhost:8001/ws/calls'; // O la URL de producción
        const websocketUrl = 'wss://gvhc-backend.onrender.com/ws/calls'; // O la URL de producción

        const socket = new WebSocket(websocketUrl);

        socket.onopen = () => {
            console.log('WebSocket connected:', websocketUrl);
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
    return { calls, leavingCalls, wsError };
};
