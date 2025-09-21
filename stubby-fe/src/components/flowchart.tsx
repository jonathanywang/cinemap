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
import { StoryNode } from '../types';
import { parseMermaidFlowchart, convertMermaidToStoryNodes } from '../utils/mermaid';

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
                  Paste your Mermaid flowchart syntax. Supports node definitions like A[Label], connections like A --&gt; B, and act numbers (Act 1, Act I, etc.)
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