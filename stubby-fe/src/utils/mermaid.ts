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
    .filter(line => line && !line.startsWith('%%') && !line.startsWith('flowchart') && !line.startsWith('graph'));

  const nodes: MermaidNode[] = [];
  const edges: MermaidEdge[] = [];
  const nodeMap = new Map<string, string>();

  lines.forEach(line => {
    const nodeDefMatch = line.match(/(\w+)\[([^\]]+)\]|(\w+)\("([^"]+)"\)|(\w+)\(([^)]+)\)|(\w+)\(\(([^)]+)\)\)|(\w+)\{([^}]+)\}|(\w+)>([^<]+)<|(\w+)\/([^\/]+)\\/);
    if (nodeDefMatch) {
      const nodeId = nodeDefMatch[1] || nodeDefMatch[3] || nodeDefMatch[5] || nodeDefMatch[7] || nodeDefMatch[9] || nodeDefMatch[11] || nodeDefMatch[13];
      const label = nodeDefMatch[2] || nodeDefMatch[4] || nodeDefMatch[6] || nodeDefMatch[8] || nodeDefMatch[10] || nodeDefMatch[12] || nodeDefMatch[14];

      if (nodeId && label) {
        nodeMap.set(nodeId, label);
        if (!nodes.find(n => n.id === nodeId)) {
          let actNumber: 1 | 2 | 3 | undefined;
          const actMatch = label.match(/Act\s*([I1]|II|2|III|3)(?:\s*:|\s|$)/i);
          if (actMatch) {
            const actStr = actMatch[1].toUpperCase();
            if (actStr === 'I' || actStr === '1') actNumber = 1;
            else if (actStr === 'II' || actStr === '2') actNumber = 2;
            else if (actStr === 'III' || actStr === '3') actNumber = 3;
          }

          const cleanLabel = label.replace(/^Act\s*([I1]|II|2|III|3)(?:\s*:\s*|\s+)/i, '');

          nodes.push({
            id: nodeId,
            label: cleanLabel || label,
            actNumber
          });
        }
      }
    }

    const connectionMatch = line.match(/(\w+)\s*(-->|---|\.-\.->|\.-\.-|==>|==|->|-\.->|<-->|<->|-.->|\.\.\.|===|~~~)\s*\|?([^|]*)\|?\s*(\w+)/);
    if (connectionMatch) {
      const [, source, , edgeLabel, target] = connectionMatch;
      const cleanEdgeLabel = edgeLabel?.trim();

      [source, target].forEach(nodeId => {
        if (!nodeMap.has(nodeId) && !nodes.find(n => n.id === nodeId)) {
          nodeMap.set(nodeId, nodeId);
          nodes.push({ id: nodeId, label: nodeId });
        }
      });

      edges.push({
        source,
        target,
        label: cleanEdgeLabel && cleanEdgeLabel.length > 0 ? cleanEdgeLabel : undefined
      });
    }
  });

  return { nodes, edges };
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

    edges.forEach(edge => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
    });

    const rootNodes = nodes.filter(node => !parentMap.has(node.id));
    if (rootNodes.length === 0 && nodes.length > 0) {
      rootNodes.push(nodes[0]);
    }

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

    const levelGroups = new Map<number, string[]>();
    nodes.forEach(node => {
      const level = levelMap.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node.id);
    });

    const nodeWidth = 300;
    const nodeHeight = 120;
    const levelHeight = 180;
    const minSpacing = 50;

    levelGroups.forEach((nodeIds, level) => {
      const nodesInLevel = nodeIds.length;

      nodeIds.forEach((nodeId, index) => {
        const parentId = parentMap.get(nodeId);
        const siblings = parentId ? (childrenMap.get(parentId) || []) : nodeIds;
        const siblingIndex = parentId ? siblings.indexOf(nodeId) : index;
        const totalSiblings = parentId ? siblings.length : nodesInLevel;

        const x = parentId && positions.has(parentId)
          ? positions.get(parentId)!.x + (siblingIndex - (totalSiblings - 1) / 2) * (nodeWidth + minSpacing)
          : index * (nodeWidth + minSpacing);

        const y = level * (nodeHeight + levelHeight);

        positions.set(nodeId, {
          x,
          y
        });
      });
    });

    return { positions, levelMap };
  };

  const { positions, levelMap } = calculateHierarchicalPositions(mermaidResult.nodes, mermaidResult.edges);
  const maxLevel = Math.max(...Array.from(levelMap.values()), 0);

  return mermaidResult.nodes.map(node => {
    const level = levelMap.get(node.id) || 0;
    const actNumber = inferActNumber(node, level, maxLevel);
    const position = positions.get(node.id) || { x: 0, y: level * 250 };

    return {
      id: node.id,
      story_id: '',
      act_number: actNumber,
      title: node.label,
      summary: '',
      details: '',
      parent_node_id: parentMap.get(node.id),
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
