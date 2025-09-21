import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  MarkerType,
  useOnSelectionChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { StoryNode, Flowchart } from '../types';

interface MermaidNode {
  id: string;
  label: string;
  actNumber?: 1 | 2 | 3;
}

interface MermaidEdge {
  source: string;
  target: string;
  label?: string;
}

interface MermaidParseResult {
  nodes: MermaidNode[];
  edges: MermaidEdge[];
}

const parseMermaidFlowchart = (mermaidText: string): MermaidParseResult => {
  const lines = mermaidText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('%%') && !line.startsWith('flowchart') && !line.startsWith('graph'));

  const nodes: MermaidNode[] = [];
  const edges: MermaidEdge[] = [];
  const nodeMap = new Map<string, string>();

  lines.forEach(line => {
    // Handle node definitions with labels - comprehensive regex for all mermaid node types
    // Updated to better handle complex labels with colons, long text, and ellipsis
    const nodeDefMatch = line.match(/(\w+)\[([^\]]+)\]|(\w+)\(([^)]+)\)|(\w+)\(\(([^)]+)\)\)|(\w+)\{([^}]+)\}|(\w+)>([^<]+)<|(\w+)\/([^/]+)\/|(\w+)\("([^"]+)"\)|(\w+)\[\[([^\]]+)\]\]/);
    if (nodeDefMatch) {
      // Extract node ID and label from the matched groups
      let nodeId: string | undefined, label: string | undefined;
      for (let i = 1; i < nodeDefMatch.length; i += 2) {
        if (nodeDefMatch[i] && nodeDefMatch[i + 1]) {
          nodeId = nodeDefMatch[i];
          label = nodeDefMatch[i + 1];
          break;
        }
      }

      // Handle cases where there's no label captured (just node ID)
      if (!nodeId && !label) {
        for (let i = 1; i < nodeDefMatch.length; i++) {
          if (nodeDefMatch[i] && !nodeDefMatch[i + 1]) {
            nodeId = nodeDefMatch[i];
            label = nodeDefMatch[i];
            break;
          }
        }
      }

      if (nodeId && label) {
        nodeMap.set(nodeId, label);
        if (!nodes.find(n => n.id === nodeId)) {
          // Extract act number from label if present (e.g., "Act 1: Title", "Act I: Title", "Act 2", etc.)
          let actNumber: 1 | 2 | 3 | undefined;
          const actMatch = label.match(/Act\s*([I1]|II|2|III|3)(?:\s*:|\s|$)/i);
          if (actMatch) {
            const actStr = actMatch[1].toUpperCase();
            if (actStr === 'I' || actStr === '1') actNumber = 1;
            else if (actStr === 'II' || actStr === '2') actNumber = 2;
            else if (actStr === 'III' || actStr === '3') actNumber = 3;
          }

          // Clean up the label by removing the act prefix and handling truncated labels
          let cleanLabel = label.replace(/^Act\s*([I1]|II|2|III|3)(?:\s*:\s*|\s+)/i, '');

          // Handle truncated labels (those ending with ...)
          if (cleanLabel.includes('...')) {
            // Extract the main part before the ellipsis and clean it up
            cleanLabel = cleanLabel.replace(/\.\.\..*$/, '').trim();
            // Add ellipsis back if the label was actually truncated
            if (cleanLabel.length > 0) {
              cleanLabel += '...';
            }
          }

          // Clean up common prefixes and formatting
          cleanLabel = cleanLabel.replace(/^(Start:|End:|Complete:|Process:)\s*/i, '');

          nodes.push({
            id: nodeId,
            label: cleanLabel || label, // fallback to original label if cleaning results in empty string
            actNumber
          });
        }
      }
    }

    // Handle connections with labels - comprehensive regex for all mermaid connection types
    // Enhanced to handle conditional labels like |Yes| and |No| and various arrow types
    const connectionMatch = line.match(/(\w+)\s*(-{1,3}>|={1,3}>|\.{1,3}->|-\.{1,3}->|<-{1,3}>|<-{1,3}|x-{1,3}x|o-{1,3}o|\|-{1,3}\||~{1,3}~)\s*(?:\|([^|]*)\|)?\s*(\w+)/);
    if (connectionMatch) {
      const source = connectionMatch[1];
      const connector = connectionMatch[2];
      const edgeLabel = connectionMatch[3]?.trim();
      const target = connectionMatch[4];

      if (source && target) {
        // Add nodes if they don't exist
        [source, target].forEach(nodeId => {
          if (!nodeMap.has(nodeId) && !nodes.find(n => n.id === nodeId)) {
            nodeMap.set(nodeId, nodeId);
            nodes.push({ id: nodeId, label: nodeId });
          }
        });

        edges.push({
          source,
          target,
          label: edgeLabel && edgeLabel.length > 0 ? edgeLabel : undefined
        });
      }
    }
  });

  return { nodes, edges };
};

const convertMermaidToStoryNodes = (mermaidResult: MermaidParseResult): StoryNode[] => {
  // Create a map to track parent relationships
  const parentMap = new Map<string, string>();
  mermaidResult.edges.forEach(edge => {
    parentMap.set(edge.target, edge.source);
  });

  // Helper function to infer act number based on flow hierarchy and keywords
  const inferActNumber = (node: MermaidNode, nodeLevel: number, maxLevel: number): 1 | 2 | 3 => {
    if (node.actNumber) return node.actNumber;

    // Try to infer from label keywords first
    const label = node.label.toLowerCase();
    if (label.includes('opening') || label.includes('introduction') || label.includes('setup') ||
        label.includes('beginning') || label.includes('start') || label.includes('inciting')) {
      return 1;
    }
    if (label.includes('climax') || label.includes('resolution') || label.includes('ending') ||
        label.includes('conclusion') || label.includes('finale') || label.includes('denouement')) {
      return 3;
    }
    if (label.includes('conflict') || label.includes('rising') || label.includes('development') ||
        label.includes('action') || label.includes('confrontation') || label.includes('crisis')) {
      return 2;
    }

    // Use flow hierarchy to determine act
    if (maxLevel === 0) return 1; // Single level flowchart

    const levelRatio = nodeLevel / maxLevel;
    if (levelRatio <= 0.3) return 1;       // First 30% of levels = Act 1
    if (levelRatio >= 0.7) return 3;       // Last 30% of levels = Act 3
    return 2;                              // Middle levels = Act 2
  };

  // Calculate hierarchical layout positions
  const calculateHierarchicalPositions = (nodes: MermaidNode[], edges: MermaidEdge[]) => {
    const positions = new Map<string, { x: number; y: number }>();
    const visited = new Set<string>();
    const childrenMap = new Map<string, string[]>();
    const levelMap = new Map<string, number>();

    // Build children map
    edges.forEach(edge => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
    });

    // Find root nodes (nodes with no parents)
    const rootNodes = nodes.filter(node => !parentMap.has(node.id));

    // If no clear roots, use the first few nodes as roots
    if (rootNodes.length === 0) {
      rootNodes.push(nodes[0]);
    }

    // Calculate levels using BFS
    const queue = rootNodes.map(node => ({ id: node.id, level: 0 }));

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;

      if (visited.has(id)) continue;
      visited.add(id);
      levelMap.set(id, level);

      const children = childrenMap.get(id) || [];
      children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    // Group nodes by level
    const levelGroups = new Map<number, string[]>();
    nodes.forEach(node => {
      const level = levelMap.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node.id);
    });

    // Calculate positions with improved hierarchical layout
    const nodeWidth = 300;
    const nodeHeight = 120;
    const levelHeight = 180;
    const minSpacing = 50;

    levelGroups.forEach((nodeIds, level) => {
      const nodesInLevel = nodeIds.length;

      if (nodesInLevel === 1) {
        // Single node - center it
        positions.set(nodeIds[0], { x: 400, y: level * levelHeight + 100 });
      } else {
        // Multiple nodes - distribute evenly with adequate spacing
        const totalRequiredWidth = (nodesInLevel - 1) * Math.max(nodeWidth, 250);
        const startX = 400 - totalRequiredWidth / 2;

        nodeIds.forEach((nodeId, indexInLevel) => {
          const x = startX + (indexInLevel * Math.max(nodeWidth, 250));
          const y = level * levelHeight + 100;

          positions.set(nodeId, { x, y });
        });
      }
    });

    const maxLevelValue = Math.max(...Array.from(levelMap.values()), 0);
    return { positions, levelMap, maxLevel: maxLevelValue };
  };

  const { positions, levelMap, maxLevel } = calculateHierarchicalPositions(mermaidResult.nodes, mermaidResult.edges);

  // Prevent circular connections - detect cycles and remove them
  const sanitizeConnections = (edges: MermaidEdge[]) => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const validEdges: MermaidEdge[] = [];

    const hasCycle = (nodeId: string, currentPath: Set<string>): boolean => {
      if (currentPath.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      currentPath.add(nodeId);

      const children = edges.filter(e => e.source === nodeId);
      for (const edge of children) {
        if (hasCycle(edge.target, currentPath)) {
          return true;
        }
      }

      currentPath.delete(nodeId);
      return false;
    };

    // Check each edge for cycles
    for (const edge of mermaidResult.edges) {
      const tempEdges = [...validEdges, edge];
      visited.clear();

      let createsCycle = false;
      for (const node of mermaidResult.nodes) {
        if (!visited.has(node.id)) {
          if (hasCycle(node.id, new Set())) {
            createsCycle = true;
            break;
          }
        }
      }

      if (!createsCycle) {
        validEdges.push(edge);
      }
    }

    return validEdges;
  };

  const sanitizedEdges = sanitizeConnections(mermaidResult.edges);

  // Rebuild parent map with sanitized edges
  const sanitizedParentMap = new Map<string, string>();
  sanitizedEdges.forEach(edge => {
    sanitizedParentMap.set(edge.target, edge.source);
  });

  // Create nodes with act numbers based on hierarchy level
  const nodesWithActs = mermaidResult.nodes.map((node, index) => ({
    id: node.id,
    story_id: 'mermaid-import',
    act_number: inferActNumber(node, levelMap.get(node.id) || 0, maxLevel),
    title: node.label,
    summary: `Imported from Mermaid`,
    details: '',
    parent_node_id: sanitizedParentMap.get(node.id),
    position: positions.get(node.id) || {
      x: 300 * (index % 3) + 250,
      y: 180 * Math.floor(index / 3) + 100
    }
  }));

  // Return nodes with original mermaid structure preserved
  return nodesWithActs;
};

interface FlowchartViewProps {
  nodes: StoryNode[];
  onNodeClick: (node: StoryNode) => void;
  onNodesChange?: (nodes: StoryNode[]) => void;
  onMermaidImport?: (nodes: StoryNode[]) => void;
}

interface NodeFormData {
  title: string;
  summary: string;
  details: string;
  act_number: 1 | 2 | 3;
}

// Move getActColor function outside the component to avoid hoisting issues
const getActColor = (actNumber: 1 | 2 | 3): string => {
  switch (actNumber) {
    case 1: return '#3B82F6'; // blue
    case 2: return '#EAB308'; // yellow  
    case 3: return '#EF4444'; // red
    default: return '#6B7280'; // gray
  }
};

const FlowchartViewInner: React.FC<FlowchartViewProps> = ({ nodes: storyNodes, onNodeClick, onNodesChange, onMermaidImport }) => {
  const reactFlowInstance = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);
  
  // Modal states
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isEditNodeModalOpen, setIsEditNodeModalOpen] = useState(false);
  const [isMermaidImportModalOpen, setIsMermaidImportModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [mermaidText, setMermaidText] = useState('');
  
  // Form states
  const [nodeForm, setNodeForm] = useState<NodeFormData>({
    title: '',
    summary: '',
    details: '',
    act_number: 1
  });
  
  const [newNodePosition, setNewNodePosition] = useState({ x: 0, y: 0 });

  // Convert StoryNode to ReactFlow Node format
  const convertToReactFlowNode = (node: StoryNode, index?: number): Node => ({
    id: node.id,
    type: 'default',
    position: node.position || { x: 250 * (index || 0), y: 100 * Math.floor((index || 0) / 3) },
    data: {
      label: (
        <div className="p-2 text-center">
          <div className="font-semibold text-sm">{node.title}</div>
          <div className="text-xs text-gray-200 mt-1">{node.summary}</div>
          <div className="text-xs text-gray-300 mt-1">Act {node.act_number}</div>
        </div>
      ),
      node: node
    },
    style: {
      background: getActColor(node.act_number),
      border: '2px solid #333',
      borderRadius: '8px',
      color: 'white',
      width: 200,
      fontSize: '12px'
    }
  });

  const initialNodes: Node[] = storyNodes.map((node, index) => convertToReactFlowNode(node, index));

  const initialEdges: Edge[] = storyNodes
    .filter(node => node.parent_node_id)
    .map(node => ({
      id: `e${node.parent_node_id}-${node.id}`,
      source: node.parent_node_id!,
      target: node.id,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#333',
      },
      style: {
        strokeWidth: 2,
        stroke: '#333',
      },
    }));

  const [nodes, setNodes, onNodesChangeHandler] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeHandler] = useEdgesState(initialEdges);

  // Update nodes and edges when storyNodes prop changes
  React.useEffect(() => {
    const newNodes = storyNodes.map((node, index) => convertToReactFlowNode(node, index));
    const newEdges = storyNodes
      .filter(node => node.parent_node_id)
      .map(node => ({
        id: `e${node.parent_node_id}-${node.id}`,
        source: node.parent_node_id!,
        target: node.id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#333',
        },
        style: {
          strokeWidth: 2,
          stroke: '#333',
        },
      }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [storyNodes, setNodes, setEdges]);

  // Selection change handler
  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodes(nodes.map(node => node.id));
      setSelectedEdges(edges.map(edge => edge.id));
    },
  });

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#333',
        },
        style: {
          strokeWidth: 2,
          stroke: '#333',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    const storyNode = node.data.node as StoryNode;
    onNodeClick(storyNode);
  }, [onNodeClick]);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const reactFlowBounds = reactFlowInstance.getViewport();
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    setNewNodePosition(position);
  }, [reactFlowInstance]);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    setNewNodePosition(position);
    setIsAddNodeModalOpen(true);
  }, [reactFlowInstance]);

  const handleAddNode = () => {
    if (!nodeForm.title.trim()) return;

    const newNode: StoryNode = {
      id: Date.now().toString(),
      story_id: 'current-story',
      act_number: nodeForm.act_number,
      title: nodeForm.title,
      summary: nodeForm.summary,
      details: nodeForm.details,
      position: newNodePosition,
    };

    const reactFlowNode = convertToReactFlowNode(newNode);
    setNodes((nds) => [...nds, reactFlowNode]);
    closeAddNodeModal();

    // Notify parent component
    if (onNodesChange) {
      const updatedStoryNodes = [...storyNodes, newNode];
      onNodesChange(updatedStoryNodes);
    }
  };

  const handleEditNode = () => {
    if (!nodeForm.title.trim() || !editingNode) return;

    const updatedStoryNode: StoryNode = {
      ...editingNode.data.node,
      title: nodeForm.title,
      summary: nodeForm.summary,
      details: nodeForm.details,
      act_number: nodeForm.act_number,
    };

    const updatedReactFlowNode = convertToReactFlowNode(updatedStoryNode);
    setNodes((nds) => 
      nds.map((node) => 
        node.id === editingNode.id ? updatedReactFlowNode : node
      )
    );
    closeEditNodeModal();

    // Notify parent component
    if (onNodesChange) {
      const updatedStoryNodes = storyNodes.map(node => 
        node.id === editingNode.id ? updatedStoryNode : node
      );
      onNodesChange(updatedStoryNodes);
    }
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedNodes.length} node(s) and ${selectedEdges.length} edge(s)?`)) {
      setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)));
      setEdges((eds) => eds.filter((edge) => !selectedEdges.includes(edge.id)));
      
      // Notify parent component
      if (onNodesChange) {
        const updatedStoryNodes = storyNodes.filter(node => !selectedNodes.includes(node.id));
        onNodesChange(updatedStoryNodes);
      }
    }
  }, [selectedNodes, selectedEdges, setNodes, setEdges, onNodesChange, storyNodes]);

  const openEditNodeModal = (node: Node) => {
    setEditingNode(node);
    const storyNode = node.data.node as StoryNode;
    setNodeForm({
      title: storyNode.title,
      summary: storyNode.summary,
      details: storyNode.details || '',
      act_number: storyNode.act_number,
    });
    setIsEditNodeModalOpen(true);
  };

  const closeAddNodeModal = () => {
    setIsAddNodeModalOpen(false);
    setNodeForm({
      title: '',
      summary: '',
      details: '',
      act_number: 1
    });
  };

  const closeEditNodeModal = () => {
    setIsEditNodeModalOpen(false);
    setEditingNode(null);
    setNodeForm({
      title: '',
      summary: '',
      details: '',
      act_number: 1
    });
  };

  const handleMermaidImport = () => {
    if (!mermaidText.trim()) return;

    try {
      const mermaidResult = parseMermaidFlowchart(mermaidText);
      const storyNodes = convertMermaidToStoryNodes(mermaidResult);

      if (onMermaidImport) {
        onMermaidImport(storyNodes);
      } else if (onNodesChange) {
        // Fallback: replace current nodes
        onNodesChange(storyNodes);
      }

      closeMermaidImportModal();
    } catch (error) {
      console.error('Failed to parse Mermaid flowchart:', error);
      alert('Failed to parse Mermaid flowchart. Please check your syntax.');
    }
  };

  const closeMermaidImportModal = () => {
    setIsMermaidImportModalOpen(false);
    setMermaidText('');
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        handleDeleteSelected();
      }
      if (event.key === 'n' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setIsAddNodeModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        onNodeDoubleClick={(event, node) => openEditNodeModal(node)}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
        selectNodesOnDrag={false}
      >
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      {/* Toolbar */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 flex space-x-2 z-10">
        <button
          onClick={() => setIsAddNodeModalOpen(true)}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          title="Add Node (Ctrl+N)"
        >
          + Node
        </button>
        <button
          onClick={() => setIsMermaidImportModalOpen(true)}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          title="Import from Mermaid"
        >
          Import Mermaid
        </button>
        <button
          onClick={handleDeleteSelected}
          disabled={selectedNodes.length === 0 && selectedEdges.length === 0}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
          title="Delete Selected (Delete)"
        >
          Delete
        </button>
      </div>


      {/* Add Node Modal */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Node</h3>
              <button 
                onClick={closeAddNodeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={nodeForm.title}
                  onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter node title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <input
                  type="text"
                  value={nodeForm.summary}
                  onChange={(e) => setNodeForm({ ...nodeForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Act</label>
                <select
                  value={nodeForm.act_number}
                  onChange={(e) => setNodeForm({ ...nodeForm, act_number: Number(e.target.value) as 1 | 2 | 3 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Act I</option>
                  <option value={2}>Act II</option>
                  <option value={3}>Act III</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  value={nodeForm.details}
                  onChange={(e) => setNodeForm({ ...nodeForm, details: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Detailed description"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeAddNodeModal}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNode}
                disabled={!nodeForm.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Add Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Node Modal */}
      {isEditNodeModalOpen && editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Node</h3>
              <button 
                onClick={closeEditNodeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={nodeForm.title}
                  onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter node title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <input
                  type="text"
                  value={nodeForm.summary}
                  onChange={(e) => setNodeForm({ ...nodeForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Act</label>
                <select
                  value={nodeForm.act_number}
                  onChange={(e) => setNodeForm({ ...nodeForm, act_number: Number(e.target.value) as 1 | 2 | 3 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Act I</option>
                  <option value={2}>Act II</option>
                  <option value={3}>Act III</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  value={nodeForm.details}
                  onChange={(e) => setNodeForm({ ...nodeForm, details: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Detailed description"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeEditNodeModal}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditNode}
                disabled={!nodeForm.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mermaid Import Modal */}
      {isMermaidImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import from Mermaid</h3>
              <button
                onClick={closeMermaidImportModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mermaid Flowchart
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Paste your Mermaid flowchart syntax. Supports node definitions like A[Label], connections like A {'->'} B, and act numbers (Act 1, Act I, etc.)
                </p>
                <textarea
                  value={mermaidText}
                  onChange={(e) => setMermaidText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={12}
                  placeholder="Example:&#10;flowchart TD&#10;    A[Act 1: Opening Scene] --> B[Inciting Incident]&#10;    B --> C[Act 2: Rising Action]&#10;    C --> D{Decision Point?}&#10;    D -->|Yes| E[Act 3: Climax]&#10;    D -->|No| F[Alternative Path]&#10;    E --> G[Act 3: Resolution]&#10;    F --> G"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeMermaidImportModal}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMermaidImport}
                disabled={!mermaidText.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FlowchartView: React.FC<FlowchartViewProps> = (props) => (
  <ReactFlowProvider>
    <FlowchartViewInner {...props} />
  </ReactFlowProvider>
);

export default FlowchartView;
