/// <reference types="vite/client" />

import { SerializedIslandState } from "./state";
import { ToolId } from "./data";

declare global {
  interface Window {
    harborSproutTest?: {
      goTo(id: string): void;
      interact(): void;
      placeDecoration(): void;
      setTool(tool: ToolId): void;
      snapshot(): SerializedIslandState;
      forceCatchSuccess(value: boolean): void;
    };
  }
}
