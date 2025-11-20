import { useEffect, useState, useRef, useCallback } from "react";
import { CallsUpdateMessagePayload, LiveQueueStatusData, CallOnHold } from "../types/nodes";

type DataUpdateMessage = {
    type: "dataUpdate";
    payload: {
        getCallsOnHoldData: {
            getCallsOnHoldData: CallOnHold[]; // <-- Corregido para reflejar la anidación
        };
        getLiveQueueStatusData: {
            liveQueueStatus: LiveQueueStatusData[]; // <-- Corregido para reflejar la anidación
        };
    };
};

type HeartbeatMessage = {
  type: "heartbeat";
};

type SSEMessage = DataUpdateMessage | HeartbeatMessage;

export const useCallsSSE = () => {
  const [calls, setCalls] = useState<CallOnHold[]>([]);
  const [liveQueueStatus, setLiveQueueStatus] = useState<LiveQueueStatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const evtSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    const url =
      process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:8000/api/websocket/sse/calls/"
        : "https://gvhc-backend.top/api/websocket/sse/calls/";

    const evtSource = new EventSource(url);
    evtSourceRef.current = evtSource;

    evtSource.onmessage = (event) => {
      try {
        console.log("🔹 SSE raw event.data:", event.data); // <-- ver el string recibido
        const msg: SSEMessage = JSON.parse(event.data);
        if (msg.type === "dataUpdate") {
   
          const callsArray = msg.payload.getCallsOnHoldData.getCallsOnHoldData || [];          
          const liveQueueArray = msg.payload.getLiveQueueStatusData.liveQueueStatus || []; // Asumiendo que LiveStatus es similarmente anidado

          console.log("🔹 Calls on hold data (Parsed):", callsArray);
          console.log("🔹 Live queue status data (Parsed):", liveQueueArray);

          setCalls(callsArray);
          setLiveQueueStatus(liveQueueArray);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error parsing SSE:", e);
        setError("Error decoding SSE data.");
      }
    };

    evtSource.onerror = () => {
      setError("Error connecting to SSE endpoint. Reconnecting...");
      evtSource.close();
      // Reconexión después de 3 segundos
      setTimeout(() => connect(), 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => evtSourceRef.current?.close();
  }, [connect]);

    return { callsOnHold: calls, liveQueueStatus, isLoading, error };
};
