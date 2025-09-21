import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { useChat } from '../hooks';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MessageCircle, Send, Plus, FileText, Mic } from 'lucide-react';
import Logo from './Logo'; // Import the Logo component

interface SidebarProps {
    currentStoryId: string | null;
    onStorySelect: (storyId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStoryId, onStorySelect }) => {
    const navigate = useNavigate(); // Add this hook
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const { messages, sendMessage, isLoading } = useChat(currentStoryId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]); // Scroll whenever messages change

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && currentStoryId) {
            await sendMessage(message);
            setMessage('');
        }
    };

    const handleRecordClick = async () => {
        if (!isRecording) {
            try {
                // Request microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100,
                    } 
                });
                
                setAudioStream(stream);
                
                // Create MediaRecorder instance
                const recorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus' // Good compression and quality
                });
                
                const audioChunks: BlobPart[] = [];
                
                // Collect audio data
                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };
                
                // Handle recording completion
                recorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    setAudioBlob(audioBlob);
                    
                    // Stop all tracks to release microphone
                    stream.getTracks().forEach(track => track.stop());
                    setAudioStream(null);
                    
                    // TODO: Send audioBlob to your API
                    console.log('Audio recorded, ready to send to API:', audioBlob);
                    
                    // Optional: Convert to different format or upload immediately
                    // uploadAudioToAPI(audioBlob);
                };
                
                // Start recording
                recorder.start();
                setMediaRecorder(recorder);
                setIsRecording(true);
                
            } catch (error) {
                console.error('Error accessing microphone:', error);
                alert('Could not access microphone. Please check permissions.');
            }
        } else {
            // Stop recording
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                setMediaRecorder(null);
                setIsRecording(false);
            }
        }
    };

    // Function to upload audio to your API (implement as needed)
    const uploadAudioToAPI = async (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        try {
            const response = await fetch('/api/upload-audio', {
                method: 'POST',
                body: formData,
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Audio uploaded successfully:', result);
            }
        } catch (error) {
            console.error('Error uploading audio:', error);
        }
    };

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [audioStream]);

    // Mock stories data
    const stories = [
        { id: '1', title: 'Space Adventure', updatedAt: '2 days ago' },
        { id: '2', title: 'Mystery Novel', updatedAt: '1 week ago' },
        { id: '3', title: 'Fantasy Epic', updatedAt: '2 weeks ago' },
        { id: '4', title: 'Historical Drama', updatedAt: '3 weeks ago' },
        { id: '5', title: 'Sci-Fi Series', updatedAt: '1 month ago' },
    ];

    return (
        <div className="w-80 h-full flex flex-col bg-sidebar border-r border-sidebar-border">
            {/* Header */}
            <div className="px-6 py-4 border-b border-sidebar-border"> {/* Adjusted to match landing page padding */}
                <div 
                    className="w-[30px] cursor-pointer hover:opacity-90 transition-opacity" /* Back to 30px to match landing */
                    onClick={() => navigate('/')}
                >
                    <Logo className="text-sidebar-foreground hover:text-sidebar-foreground/90" />
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                {/* Record Button */}
                <div className="flex flex-col items-center py-4">
                    <button
                        onClick={handleRecordClick}
                        className={`
                            w-12 h-12 rounded-full flex items-center justify-center
                            transition-all duration-200 ease-in-out
                            ${isRecording 
                                ? 'bg-red-600 hover:bg-red-700 scale-110' 
                                : 'bg-red-500 hover:bg-red-600'
                            }
                            shadow-lg hover:shadow-xl
                        `}
                        title={isRecording ? 'Stop Recording' : 'Start Recording'}
                    >
                        <Mic 
                            className={`
                                h-6 w-6 text-white
                                transition-transform duration-200
                                ${isRecording ? 'scale-110' : ''}
                            `}
                        />
                    </button>
                    {isRecording && (
                        <div className="mt-2 text-xs text-red-600 font-medium">
                            Recording...
                        </div>
                    )}
                    {audioBlob && !isRecording && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                            Audio ready to send
                        </div>
                    )}
                </div>

                {/* Chat Section */}
                <div className="p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageCircle className="h-4 w-4 text-sidebar-foreground/60" />
                        <h3 className="text-sm font-semibold text-sidebar-foreground">AI Assistant</h3>
                    </div>

                    {/* Chat Messages */}
                    <div className="mb-4 border border-sidebar-border rounded-lg bg-background">
                        <div className="p-3 h-40 overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-sm text-sidebar-foreground/60 text-center">
                                        Start a conversation with your AI writing assistant...
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="space-y-2">
                                            <div className="bg-primary/10 rounded-lg p-2">
                                                <div className="text-xs text-primary font-medium mb-1">
                                                    You
                                                </div>
                                                <div className="text-sm text-sidebar-foreground">{msg.user_message}</div>
                                            </div>
                                            <div className="bg-sidebar-accent rounded-lg p-2">
                                                <div className="text-xs text-sidebar-foreground/70 font-medium mb-1">
                                                    AI Assistant
                                                </div>
                                                <div className="text-sm text-sidebar-accent-foreground">{msg.ai_response}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Invisible element to scroll to */}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask your AI assistant..."
                            disabled={isLoading || !currentStoryId}
                            className="flex-1 bg-background border-sidebar-border focus:ring-sidebar-ring"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !message.trim() || !currentStoryId}
                            size="sm"
                            className="px-3"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                {/* Flexible space */}
                <div className="flex-1" />

                {/* Separator */}
                <div className="h-px bg-sidebar-border mx-4" />

                {/* Projects Section - Fixed at bottom */}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-sidebar-foreground/70 uppercase tracking-wide">
                            Projects
                        </h2>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[calc(3*4.5rem)]"> {/* Height for 3 items */}
                        {stories.map((story) => (
                            <div
                                key={story.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                    currentStoryId === story.id 
                                        ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-accent-foreground' 
                                        : 'bg-background border-sidebar-border hover:bg-sidebar-accent/50'
                                }`}
                                onClick={() => onStorySelect(story.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-sidebar-foreground/60" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{story.title}</div>
                                        <div className="text-xs text-sidebar-foreground/60 mt-1">
                                            {story.updatedAt}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;