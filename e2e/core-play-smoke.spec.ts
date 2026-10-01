import { expect, test } from "@playwright/test";

test("Core Play Smoke completes the island loop without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("#island-canvas")).toBeVisible();
  await expect(page.locator("#hud-task")).toContainText("Meet the island neighbors");

  const canvasImageSize = await page.locator("#island-canvas").evaluate((canvas: HTMLCanvasElement) => {
    return canvas.toDataURL("image/png").length;
  });
  expect(canvasImageSize).toBeGreaterThan(10_000);

  await page.keyboard.press("2");
  await expect(page.locator("#hud-tool")).toContainText("Flimsy Rod");

  const smoke = page.evaluate(async () => {
    const game = window.harborSproutTest;
    if (!game) {
      throw new Error("Missing Harbor Sprout test harness");
    }
    game.forceCatchSuccess(true);
    game.setTool("hands");
    game.goTo("Mira");
    game.interact();
    game.goTo("Sol");
    game.interact();
    game.goTo("Pip");
    game.interact();
    game.setTool("rod");
    game.goTo("Pond");
    game.interact();
    game.interact();
    game.interact();
    game.interact();
    game.setTool("net");
    game.goTo("sunwing");
    game.interact();
    game.setTool("hands");
    game.goTo("branches");
    game.interact();
    game.goTo("Crafting Stump");
    game.interact();
    game.interact();
    game.interact();
    game.placeDecoration();
    game.goTo("Museum Tent");
    game.interact();
    game.goTo("Shop Stall");
    game.interact();
    game.goTo("Player Tent");
    game.interact();
    return game.snapshot();
  });

  await expect(page.locator("#hud-task")).toContainText("Enjoy the evening wrap-up");
  const state = await smoke;
  expect(state.completed).toBe(true);
  expect(state.loanPaid).toBe(1200);
  expect(state.placedItems.length).toBeGreaterThan(0);
  expect(state.donatedCreatures.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
