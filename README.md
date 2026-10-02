# Harbor Sprout

Harbor Sprout is an original browser island-life game inspired by the feel and loop of Animal Crossing: New Horizons. It is a full-screen 3D third-person island day: wander a compact island, talk to villagers, gather materials, craft tools and decorations, catch fish and bugs, donate a new catch, sell goods for Bells, place a decoration, and repay the starter loan before the evening wrap-up.

## Play

Open `index.html` directly in a browser, or run the local dev server:

```bash
npm install
npm run dev
```

The dev server prints a local URL, usually `http://127.0.0.1:5173`.

## Controls

- `WASD` or arrow keys: move
- Mouse drag: orbit the follow camera
- `1`: hands
- `2`: flimsy rod
- `3`: flimsy net
- `4`: stone axe
- `5`: garden shovel
- `E`: interact with the current World Prompt
- `P`: place a crafted decoration

The game includes an explicit New Island reset, reduced-motion toggle, audio mute toggle, keyboard play, visible Pocket/Bells/task HUD, and localStorage Island Save.

## Verification

```bash
npm run check
```

This runs:

- Vitest unit coverage for Island State and Forgiving Collision/World Prompt targeting.
- TypeScript and Vite production build.
- Playwright Core Play Smoke in Chromium: load the 3D island, confirm nonblank canvas rendering, switch tools, talk to villagers, catch fish and a bug, craft, place a decoration, donate, sell, repay the starter loan, reach the evening wrap-up, and assert no browser console errors.
