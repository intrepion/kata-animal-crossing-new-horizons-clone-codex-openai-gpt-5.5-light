export type ResourceId =
  | "branches"
  | "weeds"
  | "softwood"
  | "stone"
  | "clay"
  | "shells"
  | "flowers";

export type ToolId = "hands" | "rod" | "net" | "axe" | "shovel";
export type PlaceableId = "stool" | "flowerBox";
export type CreatureId = "pondSkipper" | "reefMinnow" | "sunwing";
export type ItemId = ResourceId | ToolId | PlaceableId | CreatureId;
export type TaskId =
  | "meetNeighbors"
  | "craftTools"
  | "firstDonation"
  | "decorateIsland"
  | "repayLoan";

export interface Recipe {
  id: ToolId | PlaceableId;
  label: string;
  ingredients: Partial<Record<ResourceId, number>>;
}

export interface Creature {
  id: CreatureId;
  label: string;
  kind: "fish" | "bug";
  value: number;
}

export interface Task {
  id: TaskId;
  label: string;
  target: number;
}

export const POCKET_LIMIT = 18;
export const STARTER_LOAN = 1200;

export const resources: Record<ResourceId, { label: string; value: number }> = {
  branches: { label: "Branches", value: 20 },
  weeds: { label: "Weeds", value: 10 },
  softwood: { label: "Softwood", value: 35 },
  stone: { label: "Stone", value: 45 },
  clay: { label: "Clay", value: 55 },
  shells: { label: "Shells", value: 70 },
  flowers: { label: "Flowers", value: 35 },
};

export const tools: Record<ToolId, { label: string }> = {
  hands: { label: "Hands" },
  rod: { label: "Flimsy Rod" },
  net: { label: "Flimsy Net" },
  axe: { label: "Stone Axe" },
  shovel: { label: "Garden Shovel" },
};

export const recipes: Record<ToolId | PlaceableId, Recipe> = {
  hands: { id: "hands", label: "Hands", ingredients: {} },
  rod: { id: "rod", label: "Flimsy Rod", ingredients: { branches: 3, weeds: 1 } },
  net: { id: "net", label: "Flimsy Net", ingredients: { branches: 2, flowers: 1 } },
  axe: { id: "axe", label: "Stone Axe", ingredients: { branches: 2, stone: 1 } },
  shovel: { id: "shovel", label: "Garden Shovel", ingredients: { softwood: 2, stone: 1 } },
  stool: { id: "stool", label: "Driftwood Stool", ingredients: { softwood: 2, shells: 1 } },
  flowerBox: { id: "flowerBox", label: "Flower Box", ingredients: { softwood: 1, flowers: 2, clay: 1 } },
};

export const creatures: Record<CreatureId, Creature> = {
  pondSkipper: { id: "pondSkipper", label: "Pond Skipper", kind: "fish", value: 180 },
  reefMinnow: { id: "reefMinnow", label: "Reef Minnow", kind: "fish", value: 260 },
  sunwing: { id: "sunwing", label: "Sunwing Butterfly", kind: "bug", value: 220 },
};

export const tasks: Record<TaskId, Task> = {
  meetNeighbors: { id: "meetNeighbors", label: "Meet the island neighbors", target: 3 },
  craftTools: { id: "craftTools", label: "Craft two island goods", target: 2 },
  firstDonation: { id: "firstDonation", label: "Donate a new catch", target: 1 },
  decorateIsland: { id: "decorateIsland", label: "Place a handmade decoration", target: 1 },
  repayLoan: { id: "repayLoan", label: "Repay the starter loan", target: STARTER_LOAN },
};

export const taskOrder: TaskId[] = [
  "meetNeighbors",
  "craftTools",
  "firstDonation",
  "decorateIsland",
  "repayLoan",
];
