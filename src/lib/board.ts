export type BoardNodeType = "ref" | "character" | "generation";

export interface BoardNode {
  id: string;
  type: BoardNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  imageKey?: string;
  imageUrl?: string;
  jobId?: string;
  characterId?: string;
  prompt?: string;
}

export interface BoardState {
  nodes: BoardNode[];
  panX: number;
  panY: number;
}

export const EMPTY_BOARD: BoardState = {
  nodes: [],
  panX: 0,
  panY: 0,
};

export function parseBoardState(value: unknown): BoardState {
  if (!value || typeof value !== "object") return { ...EMPTY_BOARD };
  const raw = value as Partial<BoardState>;
  const nodes = Array.isArray(raw.nodes)
    ? raw.nodes.filter(isBoardNode).map((node) => ({
        id: node.id,
        type: node.type,
        x: Number(node.x) || 0,
        y: Number(node.y) || 0,
        width: Math.max(80, Number(node.width) || 180),
        height: Math.max(80, Number(node.height) || 180),
        label: typeof node.label === "string" ? node.label : undefined,
        imageKey: typeof node.imageKey === "string" ? node.imageKey : undefined,
        imageUrl: typeof node.imageUrl === "string" ? node.imageUrl : undefined,
        jobId: typeof node.jobId === "string" ? node.jobId : undefined,
        characterId: typeof node.characterId === "string" ? node.characterId : undefined,
        prompt: typeof node.prompt === "string" ? node.prompt : undefined,
      }))
    : [];
  return {
    nodes,
    panX: typeof raw.panX === "number" ? raw.panX : 0,
    panY: typeof raw.panY === "number" ? raw.panY : 0,
  };
}

function isBoardNode(value: unknown): value is BoardNode {
  if (!value || typeof value !== "object") return false;
  const node = value as BoardNode;
  return (
    typeof node.id === "string" &&
    (node.type === "ref" || node.type === "character" || node.type === "generation") &&
    typeof node.x === "number" &&
    typeof node.y === "number"
  );
}
