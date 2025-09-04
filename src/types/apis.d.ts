interface SharpenAuth {
    cKey1: string;
    cKey2: string;
}

interface RefreshTokenResponse {
    access: string;
    refresh: string;
    user: {
        id: number;
        username: string;
        email: string;
        role: string;
    }
}

interface SharpenRow {
    queueCallManagerID: string | null | undefined;
    username: string;
    rowIndex?: number;
}

interface RowData {
    [key: string]: any;
    recordingUrl?: string | null; // Campo opcional para almacenar la URL de la grabación
    mixmonFileName?: string | null | undefined;
    answerTime?: string; // O endTime, dependiendo de cuál uses para la antigüedad
    startTime?: string;
    queueCallManagerID?: string | null | undefinded; // Add this if it's expected in the data
    context?: string; // Assuming 'extension' will be part of your fetched data for monitoring
    rowIndex?: number;
    queueAgentID?: string;
    username?: string;
    fullName?: string;
    status?: string;
    loginTime?: string;
    uniqueID?: string;
    context?: string;
}

interface responseData {
    status?: string;
    data?: Array<Record<string, any>>;
    description?: string;
    count?: number;
    total_result_count?: number;
    raw_text?: string;
    status_code?: number;
    raw_response?: string;
    table?: string;
    channel?: string;
    getAgentStatusStatus?: string;
    getAgentStatusDescription?: string;
    getAgentStatusData?: RowData; // Es un objeto único, no un array
    getAgentsStatus?: string;           // Coincide con el JSON de getAgents
    getAgentsDescription?: string;      // Coincide con el JSON de getAgents
    getAgentsData?: AgentData[];        // Coincide con el JSON de getAgents
}

interface CdrDetailsResponse {
    data?: {
        cdr: RowData; // La estructura que vimos en el log del backend
    };
    status: string;
    description?: string;
}

interface QueryTemplateResult {
    endpoint: string;
    payload: { [key: string]: any; };
}

interface RecordingUrlResponse {
    status: 'successful' | 'Error' | number; // Puedes ser más específico si conoces los estados
    url?: string;
    key?: string;
    description?: string; // Importante para manejar los mensajes de error
}

interface AgentData {
    queueAgentID: string;
    username: string;
    fullName: string;
    status: string;
    paused: string;
    pauseTime: string | null;
    pauseReason: string;
    online: number;
    attemptedCalls: string;
    deskPhoneStatus: string;
    webRTCPhoneStatus: string;
    webRTCQPhoneStatus: string;
    activeCall?: { // Optional, as not all agents are on call
        queueCallManagerID: string | null;
        commType: string;
        cidNumber: string;
        cidName: string;
        lastActionTime: string;
        answerTime: string;
        inboundName: string;
        queueName: string;
        queueSkills: string | null;
    };
    dayCallCount: string;
    // Add other fields from your response as needed
    [key: string]: any; // Allows for additional properties not explicitly listed
}

interface ProxyGenericPayload {
    endpoint: string;
    payload: { [key: string]: any };
}

