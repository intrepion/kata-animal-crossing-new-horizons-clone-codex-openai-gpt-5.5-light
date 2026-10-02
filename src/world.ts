import { ToolId } from "./data";

export type InteractableKind =
  | "villager"
  | "resource"
  | "water"
  | "bug"
  | "museum"
  | "shop"
  | "crafting"
  | "home"
  | "placeable";

export interface Vec2 {
  x: number;
  z: number;
}

export interface Collider extends Vec2 {
  radius: number;
}

export interface Interactable extends Collider {
  id: string;
  label: string;
  kind: InteractableKind;
  action: string;
  requiredTool?: ToolId;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function cameraRelativeDelta(input: Vec2, cameraYaw: number, speed: number): Vec2 {
  const forward = { x: Math.sin(cameraYaw), z: Math.cos(cameraYaw) };
  const right = { x: Math.cos(cameraYaw), z: -Math.sin(cameraYaw) };
  return {
    x: (right.x * input.x + forward.x * input.z) * speed,
    z: (right.z * input.x + forward.z * input.z) * speed,
  };
}

export function moveWithCollision(position: Vec2, delta: Vec2, colliders: Collider[]): Vec2 {
  const next = { x: position.x + delta.x, z: position.z + delta.z };
  const blocked = colliders.some((collider) => distance(next, collider) < collider.radius);
  return blocked ? position : next;
}

export function findInteractionTarget(
  position: Vec2,
  equippedTool: ToolId,
  interactables: Interactable[],
  range = 1.8,
): Interactable | undefined {
  const nearby = interactables
    .filter((target) => distance(position, target) <= range + target.radius)
    .sort((a, b) => distance(position, a) - distance(position, b));

  return nearby.find((target) => target.requiredTool === equippedTool) ?? nearby.find((target) => !target.requiredTool);
}
