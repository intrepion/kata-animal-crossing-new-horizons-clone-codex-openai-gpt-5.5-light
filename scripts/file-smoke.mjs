import { chromium } from "@playwright/test";
import path from "node:path";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    errors.push(message.text());
  }
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(`file://${path.join(process.cwd(), "index.html")}`);
await page.waitForSelector("#island-canvas");
await page.waitForFunction(() => window.harborSproutTest);

const canvasSize = await page.locator("#island-canvas").evaluate((canvas) => {
  return canvas.toDataURL("image/png").length;
});

await page.keyboard.press("2");
const tool = (await page.locator("#hud-tool").textContent())?.trim();

await browser.close();

if (canvasSize <= 10_000 || tool !== "Flimsy Rod" || errors.length > 0) {
  console.error(JSON.stringify({ canvasSize, tool, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ canvasSize, tool, errors }, null, 2));
