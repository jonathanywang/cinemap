import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { useChat } from '../hooks';
import { Button } from './ui/button';
import { Plus, FileText, Mic } from 'lucide-react';
import Logo from './Logo'; // Import the Logo component
import type { AudioTranscriptionResponse, StoryNode } from '../types';
import { parseMermaidFlowchart, convertMermaidToStoryNodes, extractFirstMermaidDiagram } from '../utils/mermaid';

interface SidebarProps {
    currentStoryId: string | null;
    onStorySelect: (storyId: string) => void;
    onMermaidGenerated?: (nodes: StoryNode[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStoryId, onStorySelect, onMermaidGenerated }) => {
    const defaultApiBase = typeof window !== 'undefined' && window.location.port === '3000'
        ? 'http://127.0.0.1:8000'
        : '';
    const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL ?? defaultApiBase).replace(/\/$/, '');
    const audioTranscriptionUrl = apiBaseUrl
        ? `${apiBaseUrl}/api/audio/transcribe/`
        : '/api/audio/transcribe/';
    const navigate = useNavigate(); // Add this hook
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const { addExchange } = useChat(currentStoryId);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const disableRecordButton = !isRecording && (!currentStoryId || isProcessingAudio);

    const uploadAudioToAPI = useCallback(async (audioBlob: Blob) => {
        if (!currentStoryId) {
            setAudioError('Select a project before recording audio.');
            return;
        }

        setIsProcessingAudio(true);
        setAudioError(null);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
            const response = await fetch(audioTranscriptionUrl, {
                method: 'POST',
                body: formData,
            });

            const rawBody = await response.text();

            if (!response.ok) {
                let errorMessage = 'Failed to process audio.';
                if (rawBody) {
                    try {
                        const parsed = JSON.parse(rawBody);
                        if (parsed && typeof parsed === 'object' && 'error' in parsed) {
                            errorMessage = String(parsed.error);
                        } else {
                            errorMessage = rawBody;
                        }
                    } catch {
                        errorMessage = rawBody;
                    }
                }
                throw new Error(errorMessage);
            }

            if (!rawBody) {
                throw new Error('Audio service returned an empty response.');
            }

            let parsedBody: AudioTranscriptionResponse;
            try {
                parsedBody = JSON.parse(rawBody) as AudioTranscriptionResponse;
            } catch {
                throw new Error('Received malformed response from audio service.');
            }

            const { transcript, ai_response: aiResponse } = parsedBody;
            if (typeof transcript !== 'string' || typeof aiResponse !== 'string') {
                throw new Error('Audio service returned unexpected data.');
            }

            addExchange(transcript, aiResponse);

            if (onMermaidGenerated) {
                const diagramSource = extractFirstMermaidDiagram(aiResponse);
                if (diagramSource) {
                    try {
                        const mermaidResult = parseMermaidFlowchart(diagramSource);
                        const storyNodesFromMermaid = convertMermaidToStoryNodes(mermaidResult);
                        if (storyNodesFromMermaid.length === 0) {
                            setAudioError('Generated Mermaid diagram was empty.');
                        } else {
                            onMermaidGenerated(storyNodesFromMermaid);
                        }
                    } catch (mermaidError) {
                        console.error('Failed to process generated Mermaid diagram:', mermaidError);
                        setAudioError('Could not interpret the generated Mermaid diagram.');
                    }
                } else {
                    setAudioError('No Mermaid diagram detected in AI response.');
                }
            }
            setAudioBlob(null);
        } catch (error) {
            console.error('Error uploading audio:', error);
            const message = error instanceof Error
                ? error.message
                : 'Unable to process audio. Please try again.';
            setAudioError(message);
        } finally {
            setIsProcessingAudio(false);
        }
    }, [addExchange, currentStoryId, audioTranscriptionUrl, onMermaidGenerated]);

    const handleRecordClick = async () => {
        if (isRecording) {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            return;
        }

        if (!currentStoryId) {
            setAudioError('Select a project before recording audio.');
            return;
        }

        if (isProcessingAudio) {
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setAudioError('Audio recording is not supported in this browser.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });

            setAudioStream(stream);
            setAudioError(null);
            setAudioBlob(null);

            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });

            const audioChunks: BlobPart[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            recorder.onerror = (event) => {
                const errorDetail =
                    typeof event === 'object' && event !== null && 'error' in event
                        ? (event as { error?: DOMException }).error
                        : null;
                console.error('Recorder error:', errorDetail ?? event);
                setAudioError('Recording error. Please try again.');
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

                stream.getTracks().forEach((track) => track.stop());
                setAudioStream(null);
                setMediaRecorder(null);
                setIsRecording(false);

                if (!audioBlob || audioBlob.size === 0) {
                    setAudioError('No audio captured. Please try again.');
                    return;
                }

                setAudioBlob(audioBlob);
                uploadAudioToAPI(audioBlob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            const message = error instanceof Error
                ? error.message
                : 'Could not access microphone. Please check permissions.';
            setAudioError(message);
            alert('Could not access microphone. Please check permissions.');
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
                        disabled={disableRecordButton}
                        className={`
                            w-12 h-12 rounded-full flex items-center justify-center
                            transition-all duration-200 ease-in-out
                            ${isRecording
                                ? 'bg-red-600 hover:bg-red-700 scale-110'
                                : disableRecordButton
                                    ? 'bg-red-400'
                                    : 'bg-red-500 hover:bg-red-600'
                            }
                            shadow-lg hover:shadow-xl
                            disabled:opacity-60 disabled:cursor-not-allowed
                        `}
                        title={isRecording
                            ? 'Stop Recording'
                            : !currentStoryId
                                ? 'Select a project to enable recording'
                                : isProcessingAudio
                                    ? 'Processing audio...'
                                    : 'Start Recording'
                        }
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
                    {isProcessingAudio && !isRecording && (
                        <div className="mt-2 text-xs text-blue-600 font-medium">
                            Processing audio...
                        </div>
                    )}
                    {audioBlob && !isRecording && !isProcessingAudio && !audioError && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                            Audio ready to resend
                        </div>
                    )}
                    {audioError && (
                        <div className="mt-2 text-xs text-red-600 font-medium text-center px-4">
                            {audioError}
                        </div>
                    )}
                    {!isRecording && !isProcessingAudio && !audioError && !currentStoryId && (
                        <div className="mt-2 text-xs text-sidebar-foreground/60 text-center px-4">
                            Select a project to enable recording.
                        </div>
                    )}
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
