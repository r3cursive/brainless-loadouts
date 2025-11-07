# VALORANT Loadout Randomizer v1.0

A modular, tested version of the Valorant loadout randomizer with smart budget-aware weapon selection.

## What's New in v1.0

### Smart Weighted Budget Allocation
v1.0 introduces intelligent budget tier system that adjusts weapon/shield/ability selection based on available credits:

#### Budget Tiers
- **Eco ($0-$1,499)**: Prioritizes saving money
  - 70% chance for cheap weapons (Shorty, Classic, etc.)
  - 60% chance for no shield
  - 30% chance to buy each ability

- **Half Buy ($1,500-$3,499)**: Balanced purchases
  - 50% weight toward SMGs and cheap rifles
  - 50% chance for light shield
  - 60% chance to buy each ability

- **Full Buy ($3,500+)**: Premium loadouts
  - 70% weight toward rifles, Operator, Odin
  - 80% chance for heavy shield
  - 80% chance to buy each ability

### Modular Architecture
- **Separated files**: HTML, CSS, and JavaScript are now in separate files
- **Testable code**: All core logic is exported and unit tested
- **41 comprehensive tests** covering randomization, budget logic, and edge cases

## File Structure

```
v1/
├── index.html      # HTML structure only
├── style.css       # Terminal aesthetic styling
└── app.js          # All JavaScript logic (browser + Node.js compatible)
```

## Usage

### Running the App
Simply open `v1/index.html` in any web browser. No build process required.

### Available Commands
- `loadout` - Generate completely random loadout
- `agent:jett` - Generate random loadout for specific agent
- `300` - Show all agents that can afford loadout at specified budget
- `agents` - List all available agents
- `help` - Show help message
- `clear` - Clear output

### Example Budget Behaviors

**300 credits** → Most loadouts will be Shorty + No Shield + No Abilities
```
SAGE | Shorty     | Classic  | No Shield     | None            | $300
```

**3000 credits** → Mix of SMGs, cheap rifles, light shields
```
JETT | Spectre    | Ghost    | Light Shield  | C+E             | $2,500
```

**5500 credits** → Premium weapons, heavy shields, full abilities
```
SAGE | Vandal     | Sheriff  | Heavy Shield  | C+Q+E           | $4,500
```

## Testing

### Run Tests Locally via Docker

```bash
# Build the Docker image
docker build -t valorant-randomizer-tests .

# Run all tests
docker run --rm valorant-randomizer-tests

# Run tests with coverage
docker run --rm valorant-randomizer-tests npm run test:coverage
```

### Test Coverage
All 41 tests passing:
- ✅ Budget tier classification
- ✅ Weighted random weapon selection
- ✅ Loadout generation with constraints
- ✅ Agent filtering by affordability
- ✅ Command processing
- ✅ Edge cases (0 credits, 9000 credits, etc.)

## Architecture

### Exported Functions (for testing)
```javascript
// Data
AGENTS, WEAPONS, SHIELDS

// Budget Logic
getBudgetTier(credits)
getWeightedPrimaryWeapon(budget, tier)
getWeightedSidearm(budget, tier)
getWeightedShield(budget, tier)
getWeightedAbilities(agentName, budget, tier)

// Core Randomization
generateLoadout(agentName, maxBudget)
generateBudgetLoadout(agent, maxBudget)
getAllAffordableAgents(budget)

// Command Processing
processCommand(command)
getAbilityCost(agent, ability)
```

### Browser + Node.js Compatibility
The code works in both environments:
- **Browser**: Sets up DOM event handlers automatically
- **Node.js**: Exports functions for Jest testing

## Development

### File Sizes
- `index.html`: ~800 bytes
- `style.css`: ~2KB
- `app.js`: ~21KB

### Dependencies
- **Jest**: For testing (dev dependency only)
- **No runtime dependencies**: Pure JavaScript

## Differences from v0

| Feature | v0 (index.html) | v1.0 (v1/) |
|---------|-----------------|------------|
| File structure | Single file | Modular (3 files) |
| Budget logic | Random within budget | Smart weighted tiers |
| Testing | None | 41 Jest tests |
| Testability | Not exportable | Fully modular |
| 300 credit behavior | Random failures | Consistent Shorty picks |

## Performance

- **Loadout generation**: <1ms
- **Budget constraint solving**: 100 attempts max, usually succeeds in <10
- **Weighted random selection**: O(n) where n = number of affordable items
- **All tests run**: ~800ms in Docker

## Future Enhancements

Potential v1.1 features:
- [ ] Save/load favorite loadouts
- [ ] Loadout history tracking
- [ ] Custom budget tier thresholds
- [ ] Team loadout generator (5 agents)
- [ ] Export loadout as image
