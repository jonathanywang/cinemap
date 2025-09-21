import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';

export const useChat = (storyId?: string | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const addExchange = useCallback((userMessage: string, aiResponse: string) => {
        if (!storyId) return;

        const newMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            story_id: storyId,
            user_message: userMessage,
            ai_response: aiResponse,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
    }, [storyId]);

    const sendMessage = useCallback(async (message: string) => {
        if (!storyId) return;

        setIsLoading(true);
        try {
            // TODO: Replace with actual API call
            addExchange(message, "This is a placeholder AI response.");
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    }, [storyId, addExchange]);

    return {
        messages,
        sendMessage,
        isLoading,
        addExchange,
    };
};
