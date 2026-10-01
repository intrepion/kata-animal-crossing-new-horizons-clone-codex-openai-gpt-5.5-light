# Persist progress and browser-verify core play

The game will persist progress in localStorage through an explicit Island Save and expose a visible New Island reset. Final delivery should include browser smoke evidence that the island loads, the avatar moves, a tool is used, selling or donating works, crafting works, NookPhone and Starter Loan progress update, and the console remains free of application errors.

## Considered Options

- localStorage save and continue with an explicit reset.
- Session-only progress.
- Resettable daily run without persistence.

## Consequences

Build or syntax checks are not enough to prove this clone works. Browser verification must exercise the core island life loop because a playable but wrong abstraction has been the main failure mode for recognizable game clones.
