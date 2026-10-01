# Build a full-screen 3D third-person island

The clone will use a full-screen 3D third-person island as its core presentation instead of a 2D, 2.5D, top-down, or dashboard-style interface. This is a deliberate fidelity decision: Animal Crossing: New Horizons is recognized through embodied wandering, camera-follow movement, tool use in place, and a visible island world, so the game should be built around a 3D avatar and world before secondary UI polish.

## Considered Options

- Full-screen 3D third-person island.
- 2D or 2.5D cozy life sim.
- Systems prototype with minimal world presentation.

## Consequences

The implementation should favor Vite and Three.js so camera, animation, interaction targeting, and world composition are first-class concerns rather than late additions.
