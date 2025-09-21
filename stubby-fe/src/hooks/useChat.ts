import { useState, useCallback } from 'react';
import { Story, ChatMessage } from '../types';

export const useChat = (storyId?: string | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = useCallback(async (message: string) => {
        if (!storyId) return;

        setIsLoading(true);
        try {
            // TODO: Replace with actual API call
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                story_id: storyId,
                user_message: message,
                ai_response: "This is a placeholder AI response.",
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    }, [storyId]);

    return {
        messages,
        sendMessage,
        isLoading,
    };
};