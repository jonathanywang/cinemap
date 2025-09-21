import { StoryNode } from '../types';

export interface MermaidNode {
  id: string;
  label: string;
  actNumber?: 1 | 2 | 3;
}

export interface MermaidEdge {
  source: string;
  target: string;
  label?: string;
}

export interface MermaidParseResult {
  nodes: MermaidNode[];
  edges: MermaidEdge[];
}

export const parseMermaidFlowchart = (mermaidText: string): MermaidParseResult => {
  const lines = mermaidText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('%%') && !line.startsWith('flowchart') && !line.startsWith('graph') && !line.startsWith('subgraph') && line !== 'end');

  const nodes: MermaidNode[] = [];
  const edges: MermaidEdge[] = [];
  const nodeMap = new Map<string, string>();

  lines.forEach(line => {
    // Enhanced regex to handle all mermaid node types including:
    // [text], (text), ((text)), {text}, >text<, /text/, "text", [[text]], [(text)], [/text/]
    const nodeDefMatch = line.match(/(\w+)(?:\[([^\]]+)\]|\("([^"]+)"\)|\(([^)]+)\)|\(\(([^)]+)\)\)|\{([^}]+)\}|>([^<]+)<|\/([^/]+)\/|\[\[([^\]]+)\]\]|\[\/([^/]+)\/\]|\[\(([^)]+)\)\])/);

    if (nodeDefMatch) {
      const nodeId = nodeDefMatch[1];
      // Find the first non-empty label from all capturing groups
      let label = '';
      for (let i = 2; i < nodeDefMatch.length; i++) {
        if (nodeDefMatch[i] && nodeDefMatch[i].trim()) {
          label = nodeDefMatch[i].trim();
          break;
        }
      }

      if (nodeId && label) {
        nodeMap.set(nodeId, label);
        if (!nodes.find(n => n.id === nodeId)) {
          // Extract act number from label if present
          let actNumber: 1 | 2 | 3 | undefined;
          const actMatch = label.match(/Act\s*([I1]|II|2|III|3)(?:\s*:|\s|$)/i);
          if (actMatch) {
            const actStr = actMatch[1].toUpperCase();
            if (actStr === 'I' || actStr === '1') actNumber = 1;
            else if (actStr === 'II' || actStr === '2') actNumber = 2;
            else if (actStr === 'III' || actStr === '3') actNumber = 3;
          }

          // Clean up the label by removing act prefix and handling truncation
          let cleanLabel = label.replace(/^Act\s*([I1]|II|2|III|3)(?:\s*:\s*|\s+)/i, '');

          // Handle truncated labels (those ending with ...)
          if (cleanLabel.includes('...')) {
            cleanLabel = cleanLabel.replace(/\.\.\..*$/, '').trim();
            if (cleanLabel.length > 0) {
              cleanLabel += '...';
            }
          }

          // Clean up common prefixes
          cleanLabel = cleanLabel.replace(/^(Start:|End:|Complete:|Process:)\s*/i, '');

          nodes.push({
            id: nodeId,
            label: cleanLabel || label, // fallback to original if cleaning results in empty
            actNumber
          });
        }
      }
    }

    // Enhanced regex to handle all mermaid connection types and conditional labels
    // Matches: A --> B, A -->|Yes| B, A --Yes--> B, A -.->|Maybe| B, etc.
    const connectionMatch = line.match(/(\w+)\s*(-{1,3}>?|={1,3}>?|\.{1,3}->?|-\.{1,3}->?|<-{1,3}>?|<-{1,3}|x-{1,3}x|o-{1,3}o|\|-{1,3}\||~{1,3}~|--\s*([^-|>]+)\s*-->|==\s*([^=|>]+)\s*==>)\s*(?:\|([^|]*)\|)?\s*(\w+)/);

    if (connectionMatch) {
      const source = connectionMatch[1];
      const inlineLabel = connectionMatch[3] || connectionMatch[4]; // For --label--> or ==label==> style
      const pipeLabel = connectionMatch[5]; // For |label| style
      const target = connectionMatch[6];

      // Prioritize pipe labels over inline labels
      const edgeLabel = (pipeLabel || inlineLabel)?.trim();

      if (source && target) {
        // Only add nodes if they were explicitly defined with brackets/braces
        // Don't create nodes for connection-only references
        [source, target].forEach(nodeId => {
          if (!nodeMap.has(nodeId) && !nodes.find(n => n.id === nodeId)) {
            // Skip creating nodes that are only referenced in connections
            // These will be filtered out later
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

  // Filter out any nodes that weren't explicitly defined (only referenced in connections)
  const validNodes = nodes.filter(node => nodeMap.has(node.id) && nodeMap.get(node.id) !== '');

  // Filter edges to only include those between valid nodes
  const validEdges = edges.filter(edge =>
    validNodes.some(n => n.id === edge.source) &&
    validNodes.some(n => n.id === edge.target)
  );

  return { nodes: validNodes, edges: validEdges };
};

export const convertMermaidToStoryNodes = (mermaidResult: MermaidParseResult): StoryNode[] => {
  const parentMap = new Map<string, string>();
  mermaidResult.edges.forEach(edge => {
    parentMap.set(edge.target, edge.source);
  });

  const inferActNumber = (node: MermaidNode, nodeLevel: number, maxLevel: number): 1 | 2 | 3 => {
    if (node.actNumber) return node.actNumber;

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

    if (maxLevel === 0) return 1;

    const levelRatio = nodeLevel / maxLevel;
    if (levelRatio <= 0.3) return 1;
    if (levelRatio >= 0.7) return 3;
    return 2;
  };

  const calculateHierarchicalPositions = (nodes: MermaidNode[], edges: MermaidEdge[]) => {
    const positions = new Map<string, { x: number; y: number }>();
    const visited = new Set<string>();
    const childrenMap = new Map<string, string[]>();
    const levelMap = new Map<string, number>();

    // Build children map for hierarchy
    edges.forEach(edge => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
    });

    // Find root nodes (nodes with no parents) for level calculation
    const rootNodesForLevels = nodes.filter(node => !parentMap.has(node.id));
    if (rootNodesForLevels.length === 0 && nodes.length > 0) {
      rootNodesForLevels.push(nodes[0]);
    }

    // Calculate hierarchical levels using BFS
    const queue = rootNodesForLevels.map(node => ({ id: node.id, level: 0 }));

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

    // Group nodes by level for positioning
    const levelGroups = new Map<number, string[]>();
    nodes.forEach(node => {
      const level = levelMap.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node.id);
    });

    // Movie flowchart positioning algorithm - prevents overlap and follows hierarchy
    const nodeWidth = 240;
    const verticalSpacing = 150;
    const horizontalSpacing = 140;
    const centerX = 600;

    // Position nodes level by level with proper spacing
    levelGroups.forEach((nodeIds, level) => {
      // Sort nodes at each level alphabetically for consistent positioning
      const sortedNodes = nodeIds.sort((a, b) => a.localeCompare(b));
      const y = level * verticalSpacing + 80;

      if (sortedNodes.length === 1) {
        // Single node - center it
        positions.set(sortedNodes[0], { x: centerX, y });
      } else {
        // Multiple nodes - distribute with enough spacing to prevent overlap
        const totalWidth = (sortedNodes.length - 1) * (nodeWidth + horizontalSpacing);
        const startX = centerX - totalWidth / 2;

        sortedNodes.forEach((nodeId, index) => {
          const x = startX + index * (nodeWidth + horizontalSpacing);
          positions.set(nodeId, { x, y });
        });
      }
    });

    return { positions, levelMap };
  };

  // Add cycle detection and prevention
  const sanitizeEdges = (edges: MermaidEdge[]): MermaidEdge[] => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const validEdges: MermaidEdge[] = [];
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    edges.forEach(edge => {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
    });

    // DFS to detect cycles
    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    // Check each edge for creating cycles
    for (const edge of edges) {
      // Temporarily add this edge
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);

      // Reset visited sets for fresh cycle detection
      visited.clear();
      recursionStack.clear();

      // Check if adding this edge creates a cycle
      let createsCycle = false;
      for (const node of mermaidResult.nodes.map(n => n.id)) {
        if (!visited.has(node) && hasCycle(node)) {
          createsCycle = true;
          break;
        }
      }

      if (!createsCycle) {
        validEdges.push(edge);
      } else {
        // Remove the edge we just added
        const neighbors = adjacencyList.get(edge.source)!;
        const index = neighbors.lastIndexOf(edge.target);
        if (index > -1) neighbors.splice(index, 1);
      }
    }

    return validEdges;
  };

  const sanitizedEdges = sanitizeEdges(mermaidResult.edges);
  const sanitizedResult = { ...mermaidResult, edges: sanitizedEdges };

  const { positions, levelMap } = calculateHierarchicalPositions(sanitizedResult.nodes, sanitizedResult.edges);
  const maxLevel = Math.max(...Array.from(levelMap.values()), 0);

  // Rebuild parent map with sanitized edges
  const sanitizedParentMap = new Map<string, string>();
  sanitizedEdges.forEach(edge => {
    sanitizedParentMap.set(edge.target, edge.source);
  });

  return mermaidResult.nodes.map(node => {
    const level = levelMap.get(node.id) || 0;
    const actNumber = inferActNumber(node, level, maxLevel);
    const position = positions.get(node.id) || { x: 0, y: level * 150 };

    return {
      id: node.id,
      story_id: '',
      act_number: actNumber,
      title: node.label,
      summary: '',
      details: '',
      parent_node_id: sanitizedParentMap.get(node.id),
      position
    } as StoryNode;
  });
};

export const extractFirstMermaidDiagram = (text: string): string | null => {
  if (!text) return null;

  const codeBlockMatch = text.match(/```\s*mermaid\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const fencedMatch = text.match(/```([\s\S]*?)```/);
  if (fencedMatch && /flowchart|graph/.test(fencedMatch[1])) {
    return fencedMatch[1].trim();
  }

  const htmlMatch = text.match(/<code[^>]*class=['"]?language-mermaid['"]?[^>]*>([\s\S]*?)<\/code>/i);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }

  if (/flowchart|graph/.test(text)) {
    return text.trim();
  }

  return null;
};
