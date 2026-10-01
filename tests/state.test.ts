import { describe, expect, it } from "vitest";
import {
  addItem,
  craftItem,
  createIslandState,
  currentTask,
  donateCreature,
  hydrateIslandState,
  itemCount,
  placeItem,
  POCKET_LIMIT,
  repayLoan,
  sellItem,
  serializeIslandState,
  talkToVillager,
} from "../src/state";

describe("Island State", () => {
  it("keeps Pocket capacity real and generous", () => {
    const state = createIslandState();

    expect(addItem(state, "shells", POCKET_LIMIT)).toBe(false);
    expect(addItem(state, "shells", 1)).toBe(true);
  });

  it("crafts from the Recipe Book and updates NookPhone task progress", () => {
    const state = createIslandState();

    expect(craftItem(state, "rod")).toBe(true);

    expect(itemCount(state, "branches")).toBe(1);
    expect(itemCount(state, "rod")).toBe(1);
    expect(state.taskProgress.craftTools).toBe(1);
  });

  it("marks first-time donations without paying Bells", () => {
    const state = createIslandState();
    addItem(state, "pondSkipper");

    expect(donateCreature(state, "pondSkipper")).toBe(true);

    expect(state.donatedCreatures.has("pondSkipper")).toBe(true);
    expect(itemCount(state, "pondSkipper")).toBe(0);
    expect(state.bells).toBe(240);
    expect(state.taskProgress.firstDonation).toBe(1);
  });

  it("sells resources and creatures into Bells", () => {
    const state = createIslandState();
    addItem(state, "reefMinnow");

    expect(sellItem(state, "reefMinnow")).toBe(260);
    expect(state.bells).toBe(500);
  });

  it("completes the Island Day only after core loop proof and loan repayment", () => {
    const state = createIslandState();
    addItem(state, "pondSkipper");
    donateCreature(state, "pondSkipper");
    craftItem(state, "rod");
    addItem(state, "branches", 2);
    craftItem(state, "net");
    state.bells = 1500;

    expect(repayLoan(state, 1200)).toBe(1200);

    expect(state.completed).toBe(true);
    expect(state.dayPhase).toBe("evening");
    expect(currentTask(state)).toBe("Enjoy the evening wrap-up");
  });

  it("persists villager, placeable, and loan progress through an Island Save", () => {
    const state = createIslandState();
    craftItem(state, "stool");
    placeItem(state, "stool", 2, -1);
    talkToVillager(state, "Mira");
    state.bells = 900;
    repayLoan(state, 300);

    const restored = hydrateIslandState(serializeIslandState(state));

    expect(restored.placedItems).toEqual([{ id: "stool", x: 2, z: -1 }]);
    expect(restored.talkedVillagers.has("Mira")).toBe(true);
    expect(restored.loanPaid).toBe(300);
  });
});
