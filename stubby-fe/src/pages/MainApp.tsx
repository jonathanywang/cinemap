import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Story, StoryNode, Flowchart } from '../types';
import Sidebar from '../components/sidebar';
import FlowchartView from '../components/flowchart';
import ScenePanel from '../components/scene';
import { parseMermaidFlowchart, convertMermaidToStoryNodes } from '../utils/mermaid';

interface Character {
    id: string;
    name: string;
    role: string;
    color: string;
    fillColor: string;
    dataPoints: number[];
    traits: string[];
}

const MainApp: React.FC = () => {
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
    const [isCharacterSectionOpen, setIsCharacterSectionOpen] = useState(true);
    const [activeFlowchartId, setActiveFlowchartId] = useState<string>('');
    const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
    const [isEditCharacterModalOpen, setIsEditCharacterModalOpen] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
    const [stories, setStories] = useState<Story[]>([
        { id: '1', title: 'Untitled', user_id: 'user1', created_at: new Date().toISOString() }
    ]);
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        characterId: string | null;
        pointIndex: number | null;
    }>({
        isDragging: false,
        characterId: null,
        pointIndex: null
    });
    
    // Character state - starts empty for users to add their own characters
    const [characters, setCharacters] = useState<Character[]>([]);

    // New character form state
    const [newCharacter, setNewCharacter] = useState({
        name: '',
        role: 'Supporting',
        traits: ['', '', '', '', '']
    });

    // Edit character form state
    const [editCharacterForm, setEditCharacterForm] = useState({
        name: '',
        role: 'Supporting',
        traits: ['', '', '', '', '']
    });

    // Pentagon coordinates for a 120x120 viewBox
    const pentagonPoints = [
        { x: 60, y: 15 },   // Top
        { x: 89, y: 32 },   // Top Right
        { x: 82, y: 75 },   // Bottom Right
        { x: 38, y: 75 },   // Bottom Left
        { x: 31, y: 32 }    // Top Left
    ];

    // Auto-select the first story on component mount
    useEffect(() => {
        if (stories.length > 0 && !selectedStory) {
            setSelectedStory(stories[0]);
        }
    }, [stories, selectedStory]);

    const handleStorySelect = (storyId: string) => {
        // Find the story in our stories array or create a mock one
        const story = stories.find(s => s.id === storyId) || {
            id: storyId,
            user_id: 'user1',
            title: 'Selected Story',
            created_at: new Date().toISOString()
        };
        setSelectedStory(story);

        // Map stories to their corresponding flowcharts
        const storyToFlowchartMap: { [key: string]: string } = {
            '1': 'customer-support',
            '2': 'research-analysis', 
            '3': 'project-management'
        };

        // Determine which flowchart to activate based on story
        let targetFlowchartId = storyToFlowchartMap[storyId];
        
        // If no specific mapping exists (for new stories), create or find an available flowchart
        if (!targetFlowchartId) {
            // For new stories, try to find an existing flowchart or use the first available one
            const existingFlowchart = flowcharts.find(f => f.title.includes(story.title));
            targetFlowchartId = existingFlowchart?.id || flowcharts[0]?.id || 'customer-support';
        }

        // Set the active flowchart
        setActiveFlowchartId(targetFlowchartId);

        // Load unique mermaid data for this specific story/flowchart combination
        loadUniqueStoryContent(storyId, targetFlowchartId);
    };

    // Load unique mermaid content for each story - make individual API calls
    const loadUniqueStoryContent = async (storyId: string, flowchartId: string) => {
        try {
            // Define unique prompts/contexts for each story to get different mermaid outputs
            const storyPrompts: { [key: string]: string } = {
                '1': 'Story #1',
                '2': 'Story #2', 
                '3': 'Story #3',
                'default': 'Custom Story'
            };

            const prompt = storyPrompts[storyId] || storyPrompts['default'];
            
            const response = await fetch('http://localhost:8000/api/test/mermaid/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: `Generate a detailed mermaid flowchart for: ${prompt}`,
                    story_id: storyId,
                    flowchart_id: flowchartId
                }),
            });

            const data = await response.json();
            
            if (data.success && data.mermaid_code) {
                const mermaidResult = parseMermaidFlowchart(data.mermaid_code);
                const storyNodes = convertMermaidToStoryNodes(mermaidResult);
                
                // Update the specific flowchart with unique content
                setFlowcharts(prevFlowcharts => 
                    prevFlowcharts.map(flowchart => 
                        flowchart.id === flowchartId
                            ? { 
                                ...flowchart, 
                                nodes: storyNodes, 
                                title: `Story ${storyId}`,
                                description: `${prompt}`,
                                updated_at: new Date().toISOString()
                            }
                            : flowchart
                    )
                );

                console.log(`Loaded unique content for Story ${storyId} -> Flowchart ${flowchartId}:`, storyNodes);
            }
        } catch (error) {
            console.error(`Error loading content for Story ${storyId}:`, error);
        }
    };

    // Load all three stories with separate API calls
    const loadAllStories = async () => {
        try {
            // Make 3 separate API calls for each story-flowchart combination
            await Promise.all([
                loadUniqueStoryContent('1', 'customer-support'),
                loadUniqueStoryContent('2', 'research-analysis'),
                loadUniqueStoryContent('3', 'project-management')
            ]);
            console.log('All stories loaded with unique content');
        } catch (error) {
            console.error('Error loading all stories:', error);
        }
    };

    const handleCreateProject = (name: string) => {
        const newStory: Story = {
            id: `story-${Date.now()}`,
            user_id: 'user1',
            title: name,
            created_at: new Date().toISOString()
        };
        
        setStories(prevStories => [newStory, ...prevStories]);
        setSelectedStory(newStory);
    };

    const handleEditProject = (storyId: string, newTitle: string) => {
        setStories(prevStories => 
            prevStories.map(story => 
                story.id === storyId 
                    ? { ...story, title: newTitle }
                    : story
            )
        );
        
        // Update selected story if it's the one being edited
        if (selectedStory?.id === storyId) {
            setSelectedStory(prev => prev ? { ...prev, title: newTitle } : null);
        }
    };

    const handleDeleteProject = (storyId: string) => {
        // Prevent deleting the last story
        if (stories.length <= 1) {
            return;
        }

        setStories(prevStories => prevStories.filter(story => story.id !== storyId));
        
        // If we deleted the selected story, select the first remaining one
        if (selectedStory?.id === storyId) {
            const remainingStories = stories.filter(story => story.id !== storyId);
            setSelectedStory(remainingStories.length > 0 ? remainingStories[0] : null);
        }
    };

    const handleNodeClick = (node: StoryNode) => {
        setSelectedNode(node);
    };

    // API functions to fetch stories from backend - each makes individual API call
    const fetchStory1 = async () => {
        await loadUniqueStoryContent('1', 'customer-support');
    };

    const fetchStory2 = async () => {
        await loadUniqueStoryContent('2', 'research-analysis');
    };

    const fetchStory3 = async () => {
        await loadUniqueStoryContent('3', 'project-management');
    };

    const handleFlowchartChange = (flowchartId: string) => {
        setActiveFlowchartId(flowchartId);
        setSelectedNode(null); // Clear selected node when switching flowcharts
    };

    const handleCreateNewFlowchart = () => {
        const newFlowchartId = `flowchart-${Date.now()}`;
        const newFlowchart: Flowchart = {
            id: newFlowchartId,
            title: `Story ${flowcharts.length + 1}`,
            description: 'New story ready for import',
            nodes: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        setFlowcharts([...flowcharts, newFlowchart]);
        setActiveFlowchartId(newFlowchartId);
        setSelectedNode(null);
    };

    const handleDeleteFlowchart = (flowchartId: string) => {
        if (flowcharts.length <= 1) return; // Don't delete if it's the last one

        if (window.confirm('Are you sure you want to delete this flowchart?')) {
            const updatedFlowcharts = flowcharts.filter(f => f.id !== flowchartId);
            setFlowcharts(updatedFlowcharts);

            // If we deleted the active flowchart, switch to the first one
            if (activeFlowchartId === flowchartId) {
                setActiveFlowchartId(updatedFlowcharts[0].id);
            }
            setSelectedNode(null);
        }
    };

    const toggleCharacterSection = () => {
        setIsCharacterSectionOpen(!isCharacterSectionOpen);
    };

    const openAddCharacterModal = () => {
        setIsAddCharacterModalOpen(true);
    };

    const closeAddCharacterModal = () => {
        setIsAddCharacterModalOpen(false);
        setNewCharacter({
            name: '',
            role: 'Supporting',
            traits: ['', '', '', '', '']
        });
    };

    const openEditCharacterModal = (character: Character) => {
        setEditingCharacter(character);
        setEditCharacterForm({
            name: character.name,
            role: character.role,
            traits: [...character.traits, ...Array(5 - character.traits.length).fill('')]
        });
        setIsEditCharacterModalOpen(true);
    };

    const closeEditCharacterModal = () => {
        setIsEditCharacterModalOpen(false);
        setEditingCharacter(null);
        setEditCharacterForm({
            name: '',
            role: 'Supporting',
            traits: ['', '', '', '', '']
        });
    };

    const handleDeleteCharacter = (characterId: string) => {
        if (window.confirm('Are you sure you want to delete this character?')) {
            setCharacters(prevCharacters => 
                prevCharacters.filter(char => char.id !== characterId)
            );
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Protagonist': return { text: 'text-blue-600', color: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' };
            case 'Antagonist': return { text: 'text-emerald-600', color: '#10b981', fill: 'rgba(16, 185, 129, 0.15)' };
            case 'Supporting': return { text: 'text-orange-600', color: '#f97316', fill: 'rgba(249, 115, 22, 0.15)' };
            case 'Love Interest': return { text: 'text-pink-600', color: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)' };
            case 'Mentor': return { text: 'text-purple-600', color: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)' };
            case 'Comic Relief': return { text: 'text-yellow-600', color: '#eab308', fill: 'rgba(234, 179, 8, 0.15)' };
            default: return { text: 'text-gray-600', color: '#6b7280', fill: 'rgba(107, 114, 128, 0.15)' };
        }
    };

    const handleAddCharacter = () => {
        if (!newCharacter.name.trim()) return;

        const roleColors = getRoleColor(newCharacter.role);
        const newChar: Character = {
            id: Date.now().toString(),
            name: newCharacter.name,
            role: newCharacter.role,
            color: roleColors.color,
            fillColor: roleColors.fill,
            dataPoints: [30, 30, 30, 30, 30], // Default balanced stats
            traits: newCharacter.traits.filter(trait => trait.trim() !== '')
        };

        setCharacters([...characters, newChar]);
        closeAddCharacterModal();
    };

    const handleEditCharacter = () => {
        if (!editCharacterForm.name.trim() || !editingCharacter) return;

        const roleColors = getRoleColor(editCharacterForm.role);
        const updatedCharacter: Character = {
            ...editingCharacter,
            name: editCharacterForm.name,
            role: editCharacterForm.role,
            color: roleColors.color,
            fillColor: roleColors.fill,
            traits: editCharacterForm.traits.filter(trait => trait.trim() !== '')
        };

        setCharacters(prevCharacters =>
            prevCharacters.map(char =>
                char.id === editingCharacter.id ? updatedCharacter : char
            )
        );
        closeEditCharacterModal();
    };

    const updateCharacterTrait = (index: number, value: string) => {
        const updatedTraits = [...newCharacter.traits];
        updatedTraits[index] = value;
        setNewCharacter({ ...newCharacter, traits: updatedTraits });
    };

    const updateEditCharacterTrait = (index: number, value: string) => {
        const updatedTraits = [...editCharacterForm.traits];
        updatedTraits[index] = value;
        setEditCharacterForm({ ...editCharacterForm, traits: updatedTraits });
    };

    // Calculate the position of a data point based on its value and pentagon point
    const calculateDataPointPosition = (value: number, pentagonPoint: { x: number; y: number }) => {
        const center = { x: 60, y: 60 };
        const maxDistance = 45; // Maximum radius
        const normalizedValue = Math.max(0, Math.min(100, value)) / 100; // Ensure value is between 0-100
        
        const deltaX = pentagonPoint.x - center.x;
        const deltaY = pentagonPoint.y - center.y;
        
        return {
            x: center.x + deltaX * normalizedValue,
            y: center.y + deltaY * normalizedValue
        };
    };

    // Calculate the value from a position
    const calculateValueFromPosition = (position: { x: number; y: number }, pentagonPoint: { x: number; y: number }) => {
        const center = { x: 60, y: 60 };
        const maxDistance = Math.sqrt(Math.pow(pentagonPoint.x - center.x, 2) + Math.pow(pentagonPoint.y - center.y, 2));
        const currentDistance = Math.sqrt(Math.pow(position.x - center.x, 2) + Math.pow(position.y - center.y, 2));
        
        return Math.max(0, Math.min(100, (currentDistance / maxDistance) * 100));
    };

    // Get SVG coordinates from mouse/touch event
    const getSVGCoordinates = (event: React.MouseEvent | React.TouchEvent, svgElement: SVGSVGElement) => {
        const rect = svgElement.getBoundingClientRect();
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        
        const x = ((clientX - rect.left) / rect.width) * 120;
        const y = ((clientY - rect.top) / rect.height) * 120;
        
        return { x, y };
    };

    // Project point onto the line from center to pentagon point
    const projectToLine = (point: { x: number; y: number }, pentagonPoint: { x: number; y: number }) => {
        const center = { x: 60, y: 60 };
        const lineVec = { x: pentagonPoint.x - center.x, y: pentagonPoint.y - center.y };
        const pointVec = { x: point.x - center.x, y: point.y - center.y };
        
        const lineLengthSq = lineVec.x * lineVec.x + lineVec.y * lineVec.y;
        const dotProduct = pointVec.x * lineVec.x + pointVec.y * lineVec.y;
        const t = Math.max(0, Math.min(1, dotProduct / lineLengthSq));
        
        return {
            x: center.x + lineVec.x * t,
            y: center.y + lineVec.y * t
        };
    };

    const handleMouseDown = (characterId: string, pointIndex: number) => {
        setDragState({
            isDragging: true,
            characterId,
            pointIndex
        });
    };

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        if (!dragState.isDragging || !dragState.characterId || dragState.pointIndex === null) return;

        const svgElement = event.currentTarget;
        const mousePos = getSVGCoordinates(event, svgElement);
        const pentagonPoint = pentagonPoints[dragState.pointIndex];
        
        // Project the mouse position onto the line from center to pentagon point
        const projectedPos = projectToLine(mousePos, pentagonPoint);
        const newValue = calculateValueFromPosition(projectedPos, pentagonPoint);

        // Update the character's data point
        setCharacters(prevCharacters => 
            prevCharacters.map(char => {
                if (char.id === dragState.characterId) {
                    const newDataPoints = [...char.dataPoints];
                    newDataPoints[dragState.pointIndex!] = Math.round(newValue);
                    return { ...char, dataPoints: newDataPoints };
                }
                return char;
            })
        );
    }, [dragState]);

    const handleMouseUp = () => {
        setDragState({
            isDragging: false,
            characterId: null,
            pointIndex: null
        });
    };

    // Multiple flowcharts data - will be populated after audio recording
    const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);

    // Get current flowchart nodes
    const currentFlowchart = flowcharts.find(f => f.id === activeFlowchartId);
    const currentNodes = currentFlowchart?.nodes || [];

    // Handle mermaid import - create 3 different flowcharts from audio recording
    const handleMermaidImport = async (importedNodes: StoryNode[]) => {
        // Create 3 different flowchart variations
        const flowchartTypes = [
            { 
                id: 'customer-support', 
                title: 'Story 1',
                description: 'story 1',
                storyId: '1'
            },
            { 
                id: 'research-analysis', 
                title: 'Story 2',
                description: 'story 2',
                storyId: '2'
            },
            { 
                id: 'project-management', 
                title: 'Story 3',
                description: 'story 3',
                storyId: '3'
            }
        ];

        // Create the base flowcharts first
        const newFlowcharts: Flowchart[] = flowchartTypes.map(type => ({
            id: type.id,
            title: type.title,
            description: type.description,
            nodes: [], // Will be populated by loadUniqueStoryContent
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        // Add the new flowcharts to the list
        setFlowcharts(newFlowcharts);

        // Set the first flowchart as active
        setActiveFlowchartId(flowchartTypes[0].id);

        // Clear any selected node when importing new flowcharts
        setSelectedNode(null);

        // Load unique content for each flowchart
        try {
            await Promise.all([
                loadUniqueStoryContent('1', 'customer-support'),
                loadUniqueStoryContent('2', 'research-analysis'),
                loadUniqueStoryContent('3', 'project-management')
            ]);
            console.log('Created 3 flowcharts from audio recording');
        } catch (error) {
            console.error('Error loading flowchart content:', error);
        }
    };

    // Handle node changes
    const handleNodesChange = (updatedNodes: StoryNode[]) => {
        // Update the current flowchart with modified nodes
        const updatedFlowcharts = flowcharts.map(flowchart => {
            if (flowchart.id === activeFlowchartId) {
                return {
                    ...flowchart,
                    nodes: updatedNodes,
                    updated_at: new Date().toISOString()
                };
            }
            return flowchart;
        });

        setFlowcharts(updatedFlowcharts);
        console.log('Updated nodes:', updatedNodes);
    };

    const roleOptions = [
        'Protagonist',
        'Antagonist',
        'Supporting',
        'Love Interest',
        'Mentor',
        'Comic Relief',
        'Sidekick',
        'Foil',
        'Other'
    ];

    // Load stories from API on component mount
    // Commented out - API calls will be triggered manually instead
    /*
    useEffect(() => {
        const loadAllStories = async () => {
            try {
                await Promise.all([
                    fetchStory1(),
                    fetchStory2(),
                    fetchStory3()
                ]);
                console.log('All stories loaded from API');
            } catch (error) {
                console.error('Error loading stories:', error);
            }
        };

        loadAllStories();
    }, []);
    */

    return (
        <div className="h-screen flex bg-background">
            {/* Sidebar */}
            <Sidebar 
                currentStoryId={selectedStory?.id || null}
                onStorySelect={handleStorySelect}
                onMermaidGenerated={handleMermaidImport}
                stories={stories}
                onCreateProject={handleCreateProject}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex">
                {/* Main Content with Flowchart and Character Profiles */}
                <div className="flex-1 bg-background flex flex-col">
                    {/* Flowchart Tabs */}
                    <div className="bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center space-x-1">
                                {flowcharts.length > 0 ? (
                                    <>
                                        {flowcharts.map((flowchart) => (
                                            <div key={flowchart.id} className="flex items-center group">
                                                <button
                                                    onClick={() => handleFlowchartChange(flowchart.id)}
                                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                                        activeFlowchartId === flowchart.id
                                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {flowchart.title}
                                                </button>
                                                {flowcharts.length > 1 && (
                                                    <button
                                                        onClick={() => handleDeleteFlowchart(flowchart.id)}
                                                        className="ml-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                        title="Delete flowchart"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={handleCreateNewFlowchart}
                                            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-dashed border-gray-300"
                                            title="Create new flowchart"
                                        >
                                            + New
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-gray-500 text-sm">
                                        Record an audio story to generate 3 unique flowcharts
                                    </div>
                                )}
                            </div>
                            {currentFlowchart && (
                                <div className="text-sm text-gray-500">
                                    {currentFlowchart.description}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Flowchart - Takes up most of the space */}
                    <div className="flex-1 min-h-0">
                        {flowcharts.length > 0 ? (
                            <FlowchartView
                                key={activeFlowchartId}
                                nodes={currentNodes}
                                onNodeClick={handleNodeClick}
                                onMermaidImport={handleMermaidImport}
                                onNodesChange={handleNodesChange}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-50">
                                <div className="text-center p-8">
                                    <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Flowcharts Yet</h3>
                                    <p className="text-gray-500 mb-4">Record your story idea using the microphone in the sidebar to generate 3 unique flowcharts.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Character Profiles Section - Collapsible */}
                    <div className="bg-white border-t border-gray-200">
                        {/* Header with toggle button */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={toggleCharacterSection}
                                    className="flex items-center space-x-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors duration-200"
                                >
                                    <span>Character Profiles</span>
                                    <svg 
                                        className={`w-5 h-5 transition-transform duration-200 ${isCharacterSectionOpen ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {characters.length} characters
                                </span>
                            </div>
                            
                            {isCharacterSectionOpen && (
                                <button 
                                    onClick={openAddCharacterModal}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                                >
                                    + Add Character
                                </button>
                            )}
                        </div>

                        {/* Collapsible content */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isCharacterSectionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                            <div className="px-4 pb-4">
                                <div className="grid grid-cols-4 gap-4">
                                    {characters.map((character) => (
                                        <div key={character.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 group relative">
                                            {/* Action buttons */}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                                                <button
                                                    onClick={() => openEditCharacterModal(character)}
                                                    className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                                                    title="Edit character"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCharacter(character.id)}
                                                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                                                    title="Delete character"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="flex flex-col items-center space-y-3">
                                                {/* Character name and role */}
                                                <div className="text-center">
                                                    <h4 className="font-semibold text-gray-900 text-sm">{character.name}</h4>
                                                    <p className={`text-xs font-medium ${getRoleColor(character.role).text}`}>
                                                        {character.role}
                                                    </p>
                                                </div>

                                                {/* Interactive radar chart with trait labels */}
                                                <div className="relative w-32 h-32">
                                                    <svg 
                                                        viewBox="0 0 120 120" 
                                                        className="w-full h-full cursor-crosshair"
                                                        onMouseMove={handleMouseMove}
                                                        onMouseUp={handleMouseUp}
                                                        onMouseLeave={handleMouseUp}
                                                    >
                                                        {/* Background circles */}
                                                        <circle cx="60" cy="60" r="45" fill="none" stroke="#f8fafc" strokeWidth="1" />
                                                        <circle cx="60" cy="60" r="35" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                                                        <circle cx="60" cy="60" r="25" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                                        <circle cx="60" cy="60" r="15" fill="none" stroke="#cbd5e1" strokeWidth="1" />

                                                        {/* Pentagon outline */}
                                                        <path d="M60,15 L89,32 M89,32 L82,75 M82,75 L38,75 M38,75 L31,32 M31,32 L60,15"
                                                            stroke="#cbd5e1" strokeWidth="0.5" fill="none" />

                                                        {/* Axis lines */}
                                                        <line x1="60" y1="60" x2="60" y2="15" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="60" y1="60" x2="89" y2="32" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="60" y1="60" x2="82" y2="75" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="60" y1="60" x2="38" y2="75" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="60" y1="60" x2="31" y2="32" stroke="#e2e8f0" strokeWidth="0.5" />

                                                        {/* Data shape */}
                                                        <polygon 
                                                            points={character.dataPoints.map((value, index) => {
                                                                const pos = calculateDataPointPosition(value, pentagonPoints[index]);
                                                                return `${pos.x},${pos.y}`;
                                                            }).join(' ')}
                                                            fill={character.fillColor}
                                                            stroke={character.color}
                                                            strokeWidth="2" 
                                                        />

                                                        {/* Interactive data points */}
                                                        {character.dataPoints.map((value, index) => {
                                                            const pos = calculateDataPointPosition(value, pentagonPoints[index]);
                                                            const isDragging = dragState.isDragging && 
                                                                             dragState.characterId === character.id && 
                                                                             dragState.pointIndex === index;
                                                            
                                                            return (
                                                                <circle 
                                                                    key={index}
                                                                    cx={pos.x} 
                                                                    cy={pos.y} 
                                                                    r={isDragging ? "4" : "3"} 
                                                                    fill={character.color}
                                                                    stroke="white"
                                                                    strokeWidth="1"
                                                                    className="cursor-grab hover:r-4 transition-all duration-150"
                                                                    style={{ 
                                                                        cursor: isDragging ? 'grabbing' : 'grab',
                                                                        filter: isDragging ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
                                                                    }}
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        handleMouseDown(character.id, index);
                                                                    }}
                                                                />
                                                            );
                                                        })}

                                                        {/* Center dot */}
                                                        <circle cx="60" cy="60" r="1" fill="#6b7280" />
                                                    </svg>

                                                    {/* Trait labels positioned around the pentagon */}
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {character.traits.slice(0, 5).map((trait, index) => {
                                                            const positions = [
                                                                { top: '0', left: '50%', transform: 'translate(-50%, -8px)' }, // Top
                                                                { top: '8px', right: '0', transform: 'translateX(8px)' }, // Top Right
                                                                { bottom: '8px', right: '8px', transform: 'translateX(8px)' }, // Bottom Right
                                                                { bottom: '8px', left: '8px', transform: 'translateX(-8px)' }, // Bottom Left
                                                                { top: '8px', left: '0', transform: 'translateX(-8px)' } // Top Left
                                                            ];
                                                            
                                                            return (
                                                                <div key={index} className="absolute" style={positions[index]}>
                                                                    <span className="text-[8px] font-medium text-gray-600 bg-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap min-w-max">
                                                                        {trait} ({character.dataPoints[index] || 0})
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Scene Panel */}
                {selectedNode && (
                    <ScenePanel 
                        node={selectedNode}
                        onClose={() => setSelectedNode(null)}
                    />
                )}
            </div>

            {/* Add Character Modal */}
            {isAddCharacterModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Add New Character</h3>
                            <button 
                                onClick={closeAddCharacterModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Character Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Character Name
                                </label>
                                <input
                                    type="text"
                                    value={newCharacter.name}
                                    onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter character name"
                                />
                            </div>

                            {/* Character Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Character Role
                                </label>
                                <select
                                    value={newCharacter.role}
                                    onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {roleOptions.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Character Traits */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Character Traits (up to 5)
                                </label>
                                <div className="space-y-2">
                                    {newCharacter.traits.map((trait, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            value={trait}
                                            onChange={(e) => updateCharacterTrait(index, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={`Trait ${index + 1} (e.g., Brave, Intelligent, Funny)`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={closeAddCharacterModal}
                                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCharacter}
                                disabled={!newCharacter.name.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Add Character
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Character Modal */}
            {isEditCharacterModalOpen && editingCharacter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Character</h3>
                            <button 
                                onClick={closeEditCharacterModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Character Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Character Name
                                </label>
                                <input
                                    type="text"
                                    value={editCharacterForm.name}
                                    onChange={(e) => setEditCharacterForm({ ...editCharacterForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter character name"
                                />
                            </div>

                            {/* Character Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Character Role
                                </label>
                                <select
                                    value={editCharacterForm.role}
                                    onChange={(e) => setEditCharacterForm({ ...editCharacterForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {roleOptions.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Character Traits */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Character Traits (up to 5)
                                </label>
                                <div className="space-y-2">
                                    {editCharacterForm.traits.map((trait, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            value={trait}
                                            onChange={(e) => updateEditCharacterTrait(index, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={`Trait ${index + 1} (e.g., Brave, Intelligent, Funny)`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={closeEditCharacterModal}
                                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditCharacter}
                                disabled={!editCharacterForm.name.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainApp;
