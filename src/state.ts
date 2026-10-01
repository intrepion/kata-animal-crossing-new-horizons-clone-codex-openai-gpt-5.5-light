import {
  creatures,
  ItemId,
  PlaceableId,
  POCKET_LIMIT as DATA_POCKET_LIMIT,
  recipes,
  ResourceId,
  resources,
  STARTER_LOAN,
  taskOrder,
  tasks,
  ToolId,
} from "./data";

export const POCKET_LIMIT = DATA_POCKET_LIMIT;

export interface PocketEntry {
  id: ItemId;
  count: number;
}

export interface PlacedItem {
  id: PlaceableId;
  x: number;
  z: number;
}

export interface IslandState {
  bells: number;
  loanPaid: number;
  equippedTool: ToolId;
  pocket: PocketEntry[];
  knownRecipes: Set<ToolId | PlaceableId>;
  donatedCreatures: Set<string>;
  talkedVillagers: Set<string>;
  placedItems: PlacedItem[];
  taskProgress: Record<string, number>;
  dayPhase: "morning" | "afternoon" | "evening";
  completed: boolean;
}

export interface SerializedIslandState {
  bells: number;
  loanPaid: number;
  equippedTool: ToolId;
  pocket: PocketEntry[];
  knownRecipes: Array<ToolId | PlaceableId>;
  donatedCreatures: string[];
  talkedVillagers: string[];
  placedItems: PlacedItem[];
  taskProgress: Record<string, number>;
  dayPhase: IslandState["dayPhase"];
  completed: boolean;
}

export function createIslandState(): IslandState {
  return {
    bells: 240,
    loanPaid: 0,
    equippedTool: "hands",
    pocket: [
      { id: "branches", count: 4 },
      { id: "weeds", count: 2 },
      { id: "flowers", count: 2 },
      { id: "stone", count: 1 },
      { id: "softwood", count: 2 },
      { id: "shells", count: 1 },
      { id: "clay", count: 1 },
    ],
    knownRecipes: new Set(["rod", "net", "axe", "shovel", "stool", "flowerBox"]),
    donatedCreatures: new Set(),
    talkedVillagers: new Set(),
    placedItems: [],
    taskProgress: Object.fromEntries(taskOrder.map((id) => [id, 0])),
    dayPhase: "morning",
    completed: false,
  };
}

export function pocketCount(state: IslandState): number {
  return state.pocket.reduce((sum, entry) => sum + entry.count, 0);
}

export function itemCount(state: IslandState, id: ItemId): number {
  return state.pocket.find((entry) => entry.id === id)?.count ?? 0;
}

export function addItem(state: IslandState, id: ItemId, count = 1): boolean {
  if (count <= 0 || pocketCount(state) + count > POCKET_LIMIT) {
    return false;
  }
  const existing = state.pocket.find((entry) => entry.id === id);
  if (existing) {
    existing.count += count;
  } else {
    state.pocket.push({ id, count });
  }
  return true;
}

export function removeItem(state: IslandState, id: ItemId, count = 1): boolean {
  const existing = state.pocket.find((entry) => entry.id === id);
  if (!existing || count <= 0 || existing.count < count) {
    return false;
  }
  existing.count -= count;
  if (existing.count === 0) {
    state.pocket = state.pocket.filter((entry) => entry.id !== id);
  }
  return true;
}

export function canCraft(state: IslandState, id: ToolId | PlaceableId): boolean {
  const recipe = recipes[id];
  return state.knownRecipes.has(id) && Object.entries(recipe.ingredients).every(([resource, count]) => {
    return itemCount(state, resource as ResourceId) >= (count ?? 0);
  });
}

export function craftItem(state: IslandState, id: ToolId | PlaceableId): boolean {
  if (!canCraft(state, id)) {
    return false;
  }
  for (const [resource, count] of Object.entries(recipes[id].ingredients)) {
    removeItem(state, resource as ResourceId, count);
  }
  addItem(state, id);
  incrementTask(state, "craftTools", 1);
  return true;
}

export function sellItem(state: IslandState, id: ItemId, count = 1): number {
  const value = getSellValue(id);
  if (value === 0 || !removeItem(state, id, count)) {
    return 0;
  }
  const bells = value * count;
  state.bells += bells;
  return bells;
}

export function donateCreature(state: IslandState, id: ItemId): boolean {
  if (!(id in creatures) || state.donatedCreatures.has(id) || !removeItem(state, id)) {
    return false;
  }
  state.donatedCreatures.add(id);
  incrementTask(state, "firstDonation", 1);
  advanceDay(state);
  return true;
}

export function talkToVillager(state: IslandState, id: string): void {
  state.talkedVillagers.add(id);
  state.taskProgress.meetNeighbors = Math.min(tasks.meetNeighbors.target, state.talkedVillagers.size);
}

export function placeItem(state: IslandState, id: PlaceableId, x: number, z: number): boolean {
  if (!removeItem(state, id)) {
    return false;
  }
  state.placedItems.push({ id, x, z });
  incrementTask(state, "decorateIsland", 1);
  return true;
}

export function repayLoan(state: IslandState, amount: number): number {
  const payment = Math.max(0, Math.min(amount, state.bells, STARTER_LOAN - state.loanPaid));
  state.bells -= payment;
  state.loanPaid += payment;
  state.taskProgress.repayLoan = state.loanPaid;
  if (state.loanPaid >= STARTER_LOAN && state.taskProgress.firstDonation > 0 && state.taskProgress.craftTools >= 2) {
    state.completed = true;
    state.dayPhase = "evening";
  }
  return payment;
}

export function currentTask(state: IslandState): string {
  if (state.completed) {
    return "Enjoy the evening wrap-up";
  }
  const next = taskOrder.find((id) => state.taskProgress[id] < tasks[id].target);
  return next ? tasks[next].label : "Enjoy the evening wrap-up";
}

export function serializeIslandState(state: IslandState): SerializedIslandState {
  return {
    ...state,
    knownRecipes: [...state.knownRecipes],
    donatedCreatures: [...state.donatedCreatures],
    talkedVillagers: [...state.talkedVillagers],
    pocket: state.pocket.map((entry) => ({ ...entry })),
    placedItems: state.placedItems.map((item) => ({ ...item })),
    taskProgress: { ...state.taskProgress },
  };
}

export function hydrateIslandState(saved: SerializedIslandState): IslandState {
  return {
    ...saved,
    knownRecipes: new Set(saved.knownRecipes),
    donatedCreatures: new Set(saved.donatedCreatures),
    talkedVillagers: new Set(saved.talkedVillagers),
    pocket: saved.pocket.map((entry) => ({ ...entry })),
    placedItems: saved.placedItems.map((item) => ({ ...item })),
    taskProgress: { ...saved.taskProgress },
  };
}

function incrementTask(state: IslandState, id: string, amount: number): void {
  const target = tasks[id as keyof typeof tasks]?.target ?? Number.MAX_SAFE_INTEGER;
  state.taskProgress[id] = Math.min(target, (state.taskProgress[id] ?? 0) + amount);
  advanceDay(state);
}

function getSellValue(id: ItemId): number {
  if (id in resources) {
    return resources[id as ResourceId].value;
  }
  if (id in creatures) {
    return creatures[id as keyof typeof creatures].value;
  }
  return 0;
}

function advanceDay(state: IslandState): void {
  const doneTasks = Object.values(state.taskProgress).filter((value) => value > 0).length;
  if (doneTasks >= 4) {
    state.dayPhase = "afternoon";
  }
}
