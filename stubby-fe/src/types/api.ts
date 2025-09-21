export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

export interface ApiError {
    message: string;
    status: number;
}

export interface AudioTranscriptionResponse {
    transcript: string;
    ai_response: string;
}
