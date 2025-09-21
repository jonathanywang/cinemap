import React from 'react';
import { StoryNode } from '../types';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface ScenePanelProps {
  node: StoryNode;
  onClose: () => void;
}

const ScenePanel: React.FC<ScenePanelProps> = ({ node, onClose }) => {
  const getActColorClass = (actNumber: 1 | 2 | 3): string => {
    switch (actNumber) {
      case 1: return 'border-l-blue-500';
      case 2: return 'border-l-yellow-500';
      case 3: return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="w-96 bg-card border-l border-border p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">Scene Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className={`border-l-4 pl-4 mb-4 ${getActColorClass(node.act_number)}`}>
        <h4 className="font-bold text-card-foreground">{node.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">Act {node.act_number}</p>
      </div>

      <div className="space-y-4">
        <div>
          <h5 className="font-medium text-card-foreground mb-2">Summary</h5>
          <p className="text-sm text-muted-foreground">{node.summary}</p>
        </div>

        <div>
          <h5 className="font-medium text-card-foreground mb-2">Details</h5>
          <p className="text-sm text-muted-foreground leading-relaxed">{node.details}</p>
        </div>
      </div>
    </div>
  );
};

export default ScenePanel;