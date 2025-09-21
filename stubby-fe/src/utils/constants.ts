export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const ENDPOINTS = {
    CHAT: '/api/chat/',
    STORY: '/api/story/',
    SCENE: '/api/scene/',
} as const;

export const ACT_COLORS = {
    1: 'bg-blue-500',
    2: 'bg-yellow-500',
    3: 'bg-red-500',
} as const;

export const ACT_NAMES = {
    1: 'Act I - Setup',
    2: 'Act II - Confrontation',
    3: 'Act III - Resolution',
} as const;