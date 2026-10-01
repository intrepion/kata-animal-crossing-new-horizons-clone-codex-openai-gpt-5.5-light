# Animal Crossing: New Horizons Clone

This context defines the domain language for a compact browser game inspired by Animal Crossing: New Horizons. It exists to keep the clone focused on a living island play loop rather than a dashboard, menu toy, or generic collection game.

## Language

**Island Day**:
A complete playable slice of island life spanning gathering, crafting, creature collection, selling, donating, and a starter home-loan milestone.
_Avoid_: Demo level, sandbox session, quest chain

**Island Life Loop**:
The relaxed cycle of moving through the island, noticing resources or creatures, using the right tool, turning finds into Bells, donations, crafted goods, or home progress, then choosing the next small goal.
_Avoid_: Economy loop, task grind, checklist

**Island**:
A small dense place with a plaza, player home, shore, river or pond, trees, rocks, museum tent, shop stall, villagers, and enough nearby affordances to reward wandering.
_Avoid_: Map, level, board

**Island Style**:
The game's low-poly toy-like visual language with rounded forms, readable silhouettes, bright materials, and soft shadows.
_Avoid_: Nintendo replica, realistic style, generic low poly

**Villager**:
A named island resident who wanders, talks, and reacts modestly to the player's progress or collection milestones.
_Avoid_: NPC, mob, quest giver

**NookPhone Task**:
A lightweight in-world goal that nudges the player toward island life verbs without turning the game into a mission checklist.
_Avoid_: Quest, achievement, objective

**Recipe Book**:
The small set of craftable items unlocked through NookPhone Tasks during the Island Day.
_Avoid_: Tech tree, crafting menu, recipe database

**Starter Loan**:
The first home-debt milestone that gives Bells an emotional purpose and marks visible progress toward making the island feel like the player's place.
_Avoid_: Score target, win condition, currency sink

**Museum Donation**:
A first-time creature or find given to the museum collection instead of sold, trading short-term Bells for long-term island identity.
_Avoid_: Collection upload, unlock

**Tool-Mediated Interaction**:
An island action that depends on equipping the right tool, such as fishing with a rod, catching bugs with a net, mining rocks with a shovel, or chopping trees with an axe.
_Avoid_: Click action, generic interact

**Equipped Tool**:
The active tool that gives the player's next valid interaction its first meaning, before generic nearby interactions are considered.
_Avoid_: Selected item, active mode

**Tool Wheel**:
A compact in-world control for switching the Equipped Tool without leaving the island view.
_Avoid_: Toolbar, menu, loadout

**Creature Catch**:
A fish or bug capture that requires a small timing, range, or angle action rather than an instant pickup.
_Avoid_: Pickup, loot drop

**New Catch**:
A first-time Creature Catch marked as not yet donated, making the choice between Museum Donation and selling explicit.
_Avoid_: Rare drop, collectible unlock

**Soft Friction**:
Lightweight resistance that creates texture without punishing the player, such as failed catches or short resource cooldowns.
_Avoid_: Durability grind, failure state, penalty

**Bells**:
The island currency earned mostly by selling gathered items, creatures, and materials.
_Avoid_: Coins, money, points

**Pocket**:
The player's limited carried inventory for resources, creatures, tools, and placeable items.
_Avoid_: Bag, inventory grid

**Island Save**:
The persisted local record of the player's Pocket, Bells, museum donations, NookPhone Task progress, placed items, and Starter Loan progress.
_Avoid_: Save slot, checkpoint, run state

**Evening Wrap-Up**:
The cozy closing moment for a completed Island Day after the player repays the Starter Loan milestone and proves the core loop.
_Avoid_: Game over, victory screen, results screen
