interface SharpenAuth {
    cKey1: string;
    cKey2: string;
}

interface RefreshTokenResponse {
    access: string;
}

interface SharpenRow {
    queueCallManagerID: string;
    username: string;
}

interface responseData {
    status?: string;
    data: Array<Record<string, any>>;
    description?: string;
    count?: number;
    total_result_count?: number;
    raw_text?: string;
    status_code?: number;
    raw_response?: string;
    table?: string;
}

interface RecordingUrlResponse {
    status: 'successful' | 'Error' | number; // Puedes ser más específico si conoces los estados
    url?: string;
    key?: string;
    description?: string; // Importante para manejar los mensajes de error
}