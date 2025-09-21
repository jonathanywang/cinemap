export interface Story {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
}

export interface StoryNode {
    id: string;
    story_id: string;
    act_number: 1 | 2 | 3;
    title: string;
    summary: string;
    details: string;
    parent_node_id?: string;
    position?: { x: number; y: number };
}

export interface Flowchart {
    id: string;
    title: string;
    description?: string;
    nodes: StoryNode[];
    created_at: string;
    updated_at: string;
}

export interface FlowchartCollection {
    id: string;
    title: string;
    flowcharts: Flowchart[];
}
