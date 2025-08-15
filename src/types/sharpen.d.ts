interface AgentStatusData {
    username: string;
    // Añade aquí todas las propiedades que `getAgentStatusData` te devuelve
    // Por ejemplo:
    status: string;
    lastStatusChange: string; // O Date, si lo conviertes en el frontend
    currentStatusDuration: number;
  // ... otras propiedades
}

interface CdrDetailsData {
    cdr: {
        queueCallManagerID: string;
        mixmonFileName: string;
        context: string;
        answerTime: string;
        endTime: string;
        startTime: string;
        // ... otras propiedades del CDR
    };
  // ... otras propiedades que `getCdrDetails` pueda tener
}

interface SharpenApiResponseData {
    status?: string;
    description?: string;
    data?: any[] | any; // General para datos tabulares o individuales
    table?: string; // Cuando la tabla viene como string JSON
    getAgentsStatus?: string;
    getAgentsData?: any[] | any; // Para el endpoint getAgents
    getAgentStatusStatus?: string;
    getAgentStatusData?: AgentStatusData; // Para el endpoint getAgentStatus
    raw_response?: any;
    url?: string; // Para la URL de grabación
}

interface RecordingUrlResponse {
    status: string;
    url: string;
    description?: string;
}

interface RowData {
    [key: string]: any;
    queueCallManagerID?: string;
    answerTime?: string;
    endTime?: string;
    startTime?: string;
    extension?: string;
  recordingUrl?: string; // Para almacenar la URL del audio
  // ... otras propiedades comunes que tus filas de datos puedan tener
}

interface MonitoringStatus {
    message: string;
    type: 'info' | 'error' | 'success';
}

interface FetchDataParams {
    selectedQueryTemplate: keyof typeof QUERY_TEMPLATES;
    server: string;
    database: string;
    table: string;
    startDate: string;
    endDate: string;
    agentUsername: string;
    getAgentsParams: {
        getActiveCalls?: boolean;
        getDayCallCount?: boolean;
        queueLogin?: boolean;
        onlineOnly?: boolean;
        orderBy?: 'asc' | 'desc';
        orderByCol?: string;
    };
    customQuery: string; // Añadir si el customQuery es parte de la lógica de fetch
    isValidRange: () => boolean;
    }

interface UseSharpenDataFetchResult {
    data: RowData[];
    loading: boolean;
    error: string | null;
    response: SharpenApiResponseData | null;
    fetchedCount: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    currentItems: RowData[];
    fetchData: (params?: Partial<FetchDataParams>) => Promise<void>; // Hacer params opcionales
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    }

interface UseSharpenAudioPlaybackResult {
    isModalOpen: boolean;
    currentAudioUrl: string | null;
    monitoringStatus: MonitoringStatus | null;
    fetchAndPlayAudio: (row: RowData, rowIndex: number) => Promise<void>;
    closeAudioModal: () => void;
    startMonitoringCall: (queueCallManagerID: string, extension: string) => Promise<void>;
}

