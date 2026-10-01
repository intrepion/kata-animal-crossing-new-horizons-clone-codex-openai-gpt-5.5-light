import "./styles.css";
import { createIslandState, currentTask } from "./state";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root");
}

const state = createIslandState();

app.innerHTML = `
  <main class="shell">
    <section class="panel">
      <p class="eyebrow">Harbor Sprout</p>
      <h1>Island systems are ready.</h1>
      <p>${currentTask(state)}</p>
    </section>
  </main>
`;
