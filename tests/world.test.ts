import { describe, expect, it } from "vitest";
import { cameraRelativeDelta, findInteractionTarget, moveWithCollision } from "../src/world";

describe("Forgiving Collision and World Prompt targeting", () => {
  it("keeps movement outside simple shape colliders", () => {
    const start = { x: 0, z: 0 };
    const colliders = [{ x: 1, z: 0, radius: 1.2 }];

    expect(moveWithCollision(start, { x: 1, z: 0 }, colliders)).toEqual(start);
    expect(moveWithCollision(start, { x: 0, z: 1 }, colliders)).toEqual({ x: 0, z: 1 });
  });

  it("prefers the equipped tool target over a nearer generic target", () => {
    const target = findInteractionTarget({ x: 0, z: 0 }, "rod", [
      { id: "shop", label: "Shop", kind: "shop", action: "Sell", x: 0.4, z: 0, radius: 0.5 },
      {
        id: "pond",
        label: "Pond",
        kind: "water",
        action: "Fish",
        requiredTool: "rod",
        x: 1,
        z: 0,
        radius: 0.5,
      },
    ]);

    expect(target?.id).toBe("pond");
  });

  it("maps up and down controls to camera forward and backward", () => {
    expect(cameraRelativeDelta({ x: 0, z: 1 }, 0, 2)).toEqual({ x: 0, z: 2 });
    expect(cameraRelativeDelta({ x: 0, z: -1 }, 0, 2)).toEqual({ x: 0, z: -2 });
  });
});
