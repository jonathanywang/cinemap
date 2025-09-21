import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { useChat } from '../hooks';
import { Button } from './ui/button';
import { Plus, FileText, Mic, X, Check, Edit2 } from 'lucide-react';
import Logo from './Logo'; // Import the Logo component
import type { AudioTranscriptionResponse, StoryNode, Story } from '../types';
import { parseMermaidFlowchart, convertMermaidToStoryNodes, extractFirstMermaidDiagram } from '../utils/mermaid';

interface SidebarProps {
    currentStoryId: string | null;
    onStorySelect: (storyId: string) => void;
    onMermaidGenerated?: (nodes: StoryNode[]) => void;
    stories?: Story[];
    onCreateProject?: (name: string) => void;
    onEditProject?: (storyId: string, newTitle: string) => void;
    onDeleteProject?: (storyId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentStoryId, 
    onStorySelect, 
    onMermaidGenerated,
    stories = [],
    onCreateProject,
    onEditProject,
    onDeleteProject
}) => {
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
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [audioSummary, setAudioSummary] = useState<string>('');
    const [lastTranscript, setLastTranscript] = useState<string>('');
    const [showFullTranscript, setShowFullTranscript] = useState<boolean>(false);
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

            // Store the transcript and create a very intelligent summary
            setLastTranscript(transcript);
            
            // Create an AI-powered summary focused purely on transcript content
            const summary = createVeryIntelligentSummary(transcript);
            setAudioSummary(summary);
            
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
            // Clear previous summary when starting new recording
            setAudioSummary('');
            setLastTranscript('');
            setShowFullTranscript(false);

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

    const handleCreateProject = () => {
        if (newProjectName.trim() && onCreateProject) {
            onCreateProject(newProjectName.trim());
            setNewProjectName('');
            setIsNewProjectModalOpen(false);
        }
    };

    const handleCancelCreate = () => {
        setNewProjectName('');
        setIsNewProjectModalOpen(false);
    };

    const handleStartEdit = (story: Story) => {
        setEditingStoryId(story.id);
        setEditingTitle(story.title);
    };

    const handleSaveEdit = () => {
        if (editingStoryId && editingTitle.trim() && onEditProject) {
            onEditProject(editingStoryId, editingTitle.trim());
        }
        setEditingStoryId(null);
        setEditingTitle('');
    };

    const handleCancelEdit = () => {
        setEditingStoryId(null);
        setEditingTitle('');
    };

    const handleDelete = (storyId: string) => {
        if (stories.length <= 1) {
            alert('Cannot delete the last project.');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this project?')) {
            onDeleteProject?.(storyId);
        }
    };

    const handleClearSummary = () => {
        setAudioSummary('');
        setLastTranscript('');
        setShowFullTranscript(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    };

    const createVeryIntelligentSummary = (transcript: string) => {
        if (!transcript) return '';
        
        // Clean and normalize the transcript
        const cleaned = transcript.trim().replace(/\s+/g, ' ');
        
        // If it's very short, return as is
        if (cleaned.length <= 120) return cleaned;
        
        // Create a natural paraphrase that captures all the content
        return createNaturalParaphrase(cleaned);
    };

    const createNaturalParaphrase = (text: string) => {
        // Clean up filler words and redundancy while preserving meaning
        let paraphrase = text
            // Remove excessive filler words but keep the flow
            .replace(/\b(um|uh|like you know|you know like|sort of like|kind of like)\b/gi, '')
            .replace(/\b(basically|actually|really|very very|quite quite|pretty pretty)\b/gi, '')
            // Clean up repetitive phrases
            .replace(/\b(\w+)\s+\1\b/gi, '$1') // Remove immediate word repetitions
            .replace(/\s+/g, ' ')
            .trim();

        // Split into sentences and clean each one
        const sentences = paraphrase.split(/[.!?]+/).filter(s => s.trim().length > 5);
        
        if (sentences.length === 0) return text.substring(0, 200) + '...';
        
        // Process each sentence to make it more concise while preserving meaning
        const processedSentences = sentences.map(sentence => {
            let processed = sentence.trim();
            
            // Replace verbose phrases with more concise equivalents
            processed = processed
                .replace(/\bi was thinking that maybe we could\b/gi, 'we could')
                .replace(/\bwhat i want to do is\b/gi, 'I want to')
                .replace(/\bthe thing is that\b/gi, '')
                .replace(/\bit would be good if we\b/gi, 'we should')
                .replace(/\bi think it would be better if\b/gi, 'it would be better to')
                .replace(/\bwhat we need to do is\b/gi, 'we need to')
                .replace(/\bthe way i see it\b/gi, 'I think')
                .replace(/\bin my opinion\b/gi, 'I think')
                .replace(/\bto be honest\b/gi, '')
                .replace(/\bif you ask me\b/gi, '')
                .replace(/\bas far as i'm concerned\b/gi, 'I think')
                .replace(/\bat the end of the day\b/gi, 'ultimately')
                .replace(/\bwhen all is said and done\b/gi, 'ultimately')
                .replace(/\bthe bottom line is\b/gi, '')
                .replace(/\blong story short\b/gi, '')
                .replace(/\bto make a long story short\b/gi, '');
            
            // Clean up extra spaces
            processed = processed.replace(/\s+/g, ' ').trim();
            
            // Ensure sentence starts with capital letter
            if (processed.length > 0) {
                processed = processed[0].toUpperCase() + processed.slice(1);
            }
            
            return processed;
        }).filter(s => s.length > 3); // Remove very short fragments
        
        // Combine sentences intelligently
        let result = processedSentences.join('. ');
        
        // Add final period if needed
        if (result && !result.match(/[.!?]$/)) {
            result += '.';
        }
        
        // If the paraphrase is still very long, intelligently condense while preserving all key information
        if (result.length > 400) {
            result = createIntelligentCondensation(result, processedSentences);
        }
        
        return result || text.substring(0, 300) + '...';
    };

    const createIntelligentCondensation = (fullText: string, sentences: string[]) => {
        // Don't just cut off - instead, combine related ideas more efficiently
        let condensed = '';
        let currentLength = 0;
        const maxLength = 350;
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const nextSentence = sentences[i + 1];
            
            // If adding this sentence would exceed limit, try to merge it with the previous concept
            if (currentLength + sentence.length > maxLength && condensed.length > 0) {
                // Try to create a summary ending that captures remaining concepts
                const remainingSentences = sentences.slice(i);
                if (remainingSentences.length > 0) {
                    const keyRemainingConcepts = extractKeyConceptsFromSentences(remainingSentences);
                    if (keyRemainingConcepts.length > 0) {
                        condensed += `, and also discusses ${keyRemainingConcepts.join(', ')}`;
                    }
                }
                break;
            }
            
            // Check if we can combine this sentence with the next one more efficiently
            if (nextSentence && sentence.length + nextSentence.length < 100) {
                const combined = combineRelatedSentences(sentence, nextSentence);
                if (combined !== sentence + '. ' + nextSentence) {
                    condensed += (condensed ? '. ' : '') + combined;
                    currentLength += combined.length + 2;
                    i++; // Skip the next sentence since we combined it
                    continue;
                }
            }
            
            condensed += (condensed ? '. ' : '') + sentence;
            currentLength += sentence.length + 2;
        }
        
        return condensed;
    };

    const extractKeyConceptsFromSentences = (sentences: string[]) => {
        const concepts: string[] = [];
        const conceptWords = ['story', 'character', 'plot', 'design', 'create', 'build', 'plan', 'idea', 'project', 'feature', 'system', 'problem', 'solution', 'process', 'method', 'approach'];
        
        sentences.forEach(sentence => {
            const words = sentence.toLowerCase().split(/\s+/);
            conceptWords.forEach(concept => {
                if (words.includes(concept) && !concepts.includes(concept)) {
                    concepts.push(concept);
                }
            });
        });
        
        return concepts.slice(0, 3);
    };

    const combineRelatedSentences = (sentence1: string, sentence2: string) => {
        const s1Lower = sentence1.toLowerCase();
        const s2Lower = sentence2.toLowerCase();
        
        // If sentences are about the same topic, try to combine them
        if (s1Lower.includes('story') && s2Lower.includes('character') ||
            s1Lower.includes('create') && s2Lower.includes('design') ||
            s1Lower.includes('want') && s2Lower.includes('need') ||
            s1Lower.includes('think') && s2Lower.includes('should')) {
            
            // Create a more natural combination
            const connector = s2Lower.startsWith('and') || s2Lower.startsWith('also') ? ', ' : ', and ';
            return sentence1 + connector + sentence2.toLowerCase();
        }
        
        return sentence1 + '. ' + sentence2;
    };

    const analyzeTranscriptContent = (text: string) => {
        const lowercaseText = text.toLowerCase();
        
        // Detect content types
        const isStoryContent = /\b(story|character|plot|narrative|tale|fiction)\b/.test(lowercaseText);
        const isInstructional = /\b(how to|step|process|method|way to|instructions)\b/.test(lowercaseText);
        const isDescriptive = /\b(describe|explain|about|regarding|concerning)\b/.test(lowercaseText);
        const isDecisionMaking = /\b(decide|choose|option|alternative|consider)\b/.test(lowercaseText);
        const isProblemSolving = /\b(problem|issue|solve|solution|fix|resolve)\b/.test(lowercaseText);
        
        return {
            isStoryContent,
            isInstructional,
            isDescriptive,
            isDecisionMaking,
            isProblemSolving
        };
    };

    const extractKeyTopics = (text: string) => {
        const words = text.toLowerCase().split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
        
        // Count word frequency, excluding stop words
        const wordCount = new Map<string, number>();
        words.forEach(word => {
            const cleanWord = word.replace(/[^\w]/g, '');
            if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
                wordCount.set(cleanWord, (wordCount.get(cleanWord) || 0) + 1);
            }
        });
        
        // Get most frequent meaningful words
        const sortedWords = Array.from(wordCount.entries())
            .filter(([word, count]) => count > 1 || word.length > 6) // Multi-occurrence or long words
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
        
        return sortedWords;
    };

    const extractImportantStatements = (text: string) => {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
        
        // Score sentences for importance and descriptive completeness
        const scoredSentences = sentences.map(sentence => {
            let score = 0;
            const lowerSentence = sentence.toLowerCase();
            const words = sentence.trim().split(' ');
            
            // High importance indicators
            if (lowerSentence.match(/\b(main|key|important|crucial|essential|primary|major|significant)\b/)) score += 5;
            if (lowerSentence.match(/\b(want|need|should|must|have to|going to|plan to|intend to)\b/)) score += 4;
            if (lowerSentence.match(/\b(because|since|due to|reason|why|therefore|so that)\b/)) score += 4;
            if (lowerSentence.match(/\b(problem|issue|challenge|difficulty|solution|answer|approach)\b/)) score += 4;
            if (lowerSentence.match(/\b(think|believe|feel|realize|understand|know|consider)\b/)) score += 3;
            if (lowerSentence.match(/\b(first|second|third|initially|finally|ultimately|basically)\b/)) score += 2;
            
            // Descriptive content indicators
            if (lowerSentence.match(/\b(describe|explain|discuss|involve|include|contain|feature)\b/)) score += 3;
            if (lowerSentence.match(/\b(create|make|build|develop|design|establish|implement)\b/)) score += 3;
            if (lowerSentence.match(/\b(story|character|plot|narrative|scene|chapter)\b/)) score += 2;
            
            // Sentence structure and completeness
            if (words.length >= 8 && words.length <= 20) score += 3; // Good descriptive length
            if (words.length >= 6 && words.length <= 25) score += 2;
            if (sentence.includes(',')) score += 1; // Complex sentences often more descriptive
            if (sentence.match(/\b[A-Z][a-z]+\b/)) score += 1; // Proper nouns add specificity
            
            // Deduct points for filler and incomplete sentences
            if (lowerSentence.match(/\b(um|uh|like|you know|sort of|kind of|basically|actually)\b/)) score -= 2;
            if (words.length < 6) score -= 2; // Too short to be descriptive
            if (words.length > 30) score -= 1; // Might be too verbose
            
            // Boost sentences that provide explanations or details
            if (lowerSentence.match(/\b(how|what|where|when|which|that|this|these)\b/)) score += 1;
            if (sentence.match(/\d+/)) score += 1; // Numbers add specificity
            
            return { sentence: sentence.trim(), score };
        });
        
        scoredSentences.sort((a, b) => b.score - a.score);
        
        return {
            primary: scoredSentences[0]?.sentence || '',
            secondary: scoredSentences.slice(1, 4).map(s => s.sentence)
        };
    };

    const extractKeyPhrases = (text: string) => {
        const lowercaseText = text.toLowerCase();
        
        // Story/narrative keywords
        const storyKeywords = ['story', 'plot', 'character', 'scene', 'chapter', 'narrative', 'protagonist', 'antagonist', 'conflict', 'resolution'];
        const actionKeywords = ['fight', 'battle', 'journey', 'travel', 'discover', 'reveal', 'escape', 'chase', 'love', 'betrayal'];
        const emotionKeywords = ['happy', 'sad', 'angry', 'excited', 'scared', 'surprised', 'confused', 'determined'];
        
        const topics: string[] = [];
        
        // Check for story elements
        storyKeywords.forEach(keyword => {
            if (lowercaseText.includes(keyword)) {
                topics.push(keyword);
            }
        });
        
        // Check for actions
        actionKeywords.forEach(keyword => {
            if (lowercaseText.includes(keyword)) {
                topics.push(keyword);
            }
        });
        
        return { topics: Array.from(new Set(topics)) };
    };

    const extractStoryElements = (transcript: string) => {
        const lowercaseTranscript = transcript.toLowerCase();
        
        // Extract character names (look for proper nouns and common character indicators)
        const characterPatterns = [
            /\b[A-Z][a-z]+ (is|was|said|told|went|came|did)\b/g,
            /\b(he|she|they) (is|was|said|told|went|came|did)\b/g,
            /(character|hero|heroine|villain|protagonist|antagonist) (\w+)/g
        ];
        
        const characters: string[] = [];
        characterPatterns.forEach(pattern => {
            const matches = transcript.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const words = match.split(' ');
                    if (words[0] && words[0].length > 2) {
                        characters.push(words[0]);
                    }
                });
            }
        });
        
        // Extract actions and plot points
        const actionWords = transcript.match(/\b(fights?|battles?|travels?|discovers?|reveals?|escapes?|meets?|finds?|loses?|wins?|defeats?)\b/gi) || [];
        const plotWords = transcript.match(/\b(beginning|middle|end|climax|twist|resolution|conflict|problem|solution)\b/gi) || [];
        
        return {
            characters: Array.from(new Set(characters)).slice(0, 3), // Limit to 3 characters
            actions: Array.from(new Set(actionWords.map(w => w.toLowerCase()))).slice(0, 3),
            plotPoints: Array.from(new Set(plotWords.map(w => w.toLowerCase()))).slice(0, 2)
        };
    };

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [audioStream]);

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

                {/* Audio Summary Section */}
                {(audioSummary || lastTranscript || isProcessingAudio) && (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wide">
                                Summary
                            </h3>
                            {(audioSummary || lastTranscript) && !isProcessingAudio && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                                    onClick={handleClearSummary}
                                    title="Clear summary"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <div className="bg-sidebar-accent/30 border border-sidebar-border rounded-lg p-3">
                            {isProcessingAudio ? (
                                <div className="text-sm text-sidebar-foreground/60 italic">
                                    Processing audio...
                                </div>
                            ) : (
                                <div>
                                    <div 
                                        className="text-sm text-sidebar-foreground/80 leading-relaxed max-h-32 overflow-y-auto cursor-pointer"
                                        onClick={() => setShowFullTranscript(!showFullTranscript)}
                                        title="Click to toggle full transcript"
                                    >
                                        {showFullTranscript ? lastTranscript : (audioSummary || lastTranscript)}
                                    </div>
                                    {lastTranscript && audioSummary && audioSummary !== lastTranscript && (
                                        <button
                                            onClick={() => setShowFullTranscript(!showFullTranscript)}
                                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                                        >
                                            {showFullTranscript ? 'Show summary' : 'Show full transcript'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Flexible space */}
                <div className="flex-1" />

                {/* Separator */}
                <div className="h-px bg-sidebar-border mx-4" />

                {/* Projects Section - Fixed at bottom */}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-sidebar-foreground/70 uppercase tracking-wide">
                            Clutters
                        </h2>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => setIsNewProjectModalOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[calc(3*4.5rem)]"> {/* Height for 3 items */}
                        {stories.map((story) => (
                            <div
                                key={story.id}
                                className={`group p-3 rounded-lg border transition-colors ${
                                    currentStoryId === story.id 
                                        ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-accent-foreground' 
                                        : 'bg-background border-sidebar-border hover:bg-sidebar-accent/50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        {editingStoryId === story.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSaveEdit();
                                                        } else if (e.key === 'Escape') {
                                                            handleCancelEdit();
                                                        }
                                                    }}
                                                    className="flex-1 px-1 py-0.5 text-sm bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                                    autoFocus
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0"
                                                    onClick={handleSaveEdit}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0"
                                                    onClick={handleCancelEdit}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div 
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => onStorySelect(story.id)}
                                                >
                                                    <div className="font-medium text-sm truncate">{story.title}</div>
                                                    <div className="text-xs text-sidebar-foreground/60 mt-1">
                                                        {formatDate(story.created_at)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 w-5 p-0 hover:bg-gray-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEdit(story);
                                                        }}
                                                        title="Edit project name"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                    {stories.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 w-5 p-0 hover:bg-red-200 text-red-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(story.id);
                                                            }}
                                                            title="Delete project"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* New Project Modal */}
            {isNewProjectModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleCancelCreate}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
                                Project Name
                            </label>
                            <input
                                id="project-name"
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateProject();
                                    }
                                }}
                                placeholder="Enter project name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={handleCancelCreate}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateProject}
                                disabled={!newProjectName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Create Project
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
