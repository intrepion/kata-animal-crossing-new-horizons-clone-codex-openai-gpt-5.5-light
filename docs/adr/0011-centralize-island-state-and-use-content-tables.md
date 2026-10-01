# Centralize island state and use content tables

Gameplay will use one authoritative Island State with small systems for movement, interaction, economy, crafting, collection, save/load, and rendering. Resources, recipes, creatures, tasks, dialogue, prices, and landmark metadata should live in plain Content Tables so content, balance, tests, and UI prompts can refer to the same facts.

## Considered Options

- Centralized Island State with small systems and Content Tables.
- Split state ownership across scene object classes.
- Hardcoded content directly inside interaction branches.

## Consequences

Implementation should make ownership of Pocket contents, Bells, donations, task progress, and placed items obvious. Content changes should not require hunting through rendering or interaction code.
