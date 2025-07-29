declare module '*.png' {
    const value: string;
    export default value;
}

interface PrivateRouteProps {
    children: ReactNode;
    requiredRoles: string[];
}

interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
    }

interface UserQueue {
    id: string;
    name: string;
    // ...
}

interface AuthContextType {
    user: UserData | null;
    isAuthenticated: boolean;
    login: (accessToken: string, refreshToken: string, userData: AuthContextType['user']) => void;
    logout: () => void;
    isLoading: boolean; // Para saber si estamos cargando el estado inicial del usuario
    }
interface User {
    id: number | string;
    username: string;
    role: string;
    email: string;
    first_name: string;
    last_name: string;
    queues: UserQueue[]; // Asegúrate de que sea UserQueue[]
}

interface UserData {
    id: number | string;
    username: string;
    role: string;
    email: string;
    first_name: string;
    last_name: string;
    queues: Queue[];
    // Añade cualquier otro campo que UserSerializer esté incluyendo
}

type MetricType = 'COUNT' | 'LCW';

interface MetricConfig {
    id: string;
    title: string;
    type: MetricType;
    queueName: string;
}

interface MetricResult {
    value: string | number | null;
    loading: boolean;
    error: string | null;
}

interface AllMetricsState {
    [key: string]: MetricResult;
}

interface QuoteResponse {
    q: string;
    a: string;
}

interface Queue {
    name: string;
  // puedes agregar otros campos si existen
}

interface CallsOnHoldData {
    getCallsonHoldStatus: string;
    getCallsonHolddescription: string;
    getCallsOnHoldData: CallOnHold[];
}
interface CallOnHold {
    queueCallManagerID: string;
    username: string;
    queueID: string;
    queueName: string;
    vbxName: string;
    channel: string;
    cidNumber: string;
    cidName: string;
    startTime: string;
    answerTime: string;
    lastActionTime: string;
    queueCallback: string;
    callbackNumber: string;
    queuePoints: string;
    loopCounter: string;
    timeOut: string;
    timeOutTime: string;
    callerCity: string;
    callerState: string;
    callerCountry: string;
    currentLocation: string;
    queueSkills: string;
    commType: string;
    uKey: string;
    queueType: string;
    agentCall: string;
    switch: string;
    startTimeInSeconds: string;
    interactionButton: string;
    // Agrega más propiedades si las hay
}

export interface CallsOnHoldApiResponse {
    getCallsOnHoldData: CallOnHold[];
}

export interface CallsUpdateMessage {
    type: 'callsUpdate';
    payload: {
        getCallsOnHoldData: CallOnHold[]; // Para tus llamadas en espera existentes
        // liveQueueStatus?: LiveQueueStatusData[]; // Esto era para el websocket si también enviaba esto,
                                                    // pero no para la carga inicial REST.
    };
}

interface CallsWebSocketData {
    calls: CallOnHold[];
    leavingCalls: string[];
}

interface CallsUpdateMessage {
    type: 'callsUpdate';
    payload: {
        getCallsOnHoldData: {
            getCallsOnHoldData: CallOnHold[]; // Este es el array que nos interesa
            // ...otras propiedades como getCallsOnHoldStatus
        };
    };
}

interface QueueConfig {
    id: string; // Un ID único para la tarjeta
    title: string; // Título de la tarjeta (ej: 'Appointment Line')
    queueName: string; // Nombre de la cola real en la DB
}

// Define cómo se almacenarán los datos de cada métrica (Count, Lcw)
interface MetricData {
    value: string | number | null;
    loading: boolean;
    error: string | null;
}

// Define el estado completo de todas las métricas, ahora agrupadas por cola
interface AllMetricsState {
    [queueId: string]: {
        count: MetricData;
        lcw: MetricData;
    };
}


interface QueueConfig {
    id: string; // Un ID único para la tarjeta
    title: string; // Título de la tarjeta (ej: 'Appointment Line')
    queueName: string[]; // Nombre de la cola real en la DB
}

// Define cómo se almacenarán los datos de cada métrica (Count, Lcw)
interface MetricData {
    value: string | number | null;
    loading: boolean;
    error: string | null;
}

// Define el estado completo de todas las métricas, ahora agrupadas por cola
interface AllMetricsState {
    [queueId: string]: {
        count: MetricData;
        lcw: MetricData;
    };
}

interface LiveStatusAgent {
    username: string;
    queueName: string;
    statusDuration: string;
    status: string;
    interactionType: string;
    callType: string;
    pauseReason: string;
    paused: string;
    fullName: string;
}
